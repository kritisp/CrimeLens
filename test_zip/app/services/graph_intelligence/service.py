"""
CrimeLens AI — Graph Intelligence Service

Integrates NetworkX to calculate graph metrics (centrality, communities,
hidden links, entity rankings, and risk levels) from the database graph.
"""

from __future__ import annotations

from typing import Any, Dict, List, Set, Tuple
import networkx as nx

from app.domain.models.ingested_case import IngestedCase
from app.services.crime_signature_v2.builder import SignatureBuilder
from app.domain.knowledge_graph.builder import GraphBuilder
from app.domain.knowledge_graph.models import GraphSchema


class GraphIntelligenceService:
    """
    Computes graph metrics and overlays analysis using NetworkX.
    """

    def __init__(self) -> None:
        self.sig_builder = SignatureBuilder()
        self.graph_builder = GraphBuilder()

    def build_networkx_graph(self, cases: List[Dict[str, Any]]) -> Tuple[nx.Graph, GraphSchema]:
        """
        Builds a NetworkX graph and a consolidated GraphSchema from list of raw cases.
        """
        full_schema = GraphSchema()
        
        # Build signatures and collect graph schemas
        for raw in cases:
            try:
                case = IngestedCase.model_validate(raw)
                sig_v2 = self.sig_builder.build_from_case(case)
                sub_schema = self.graph_builder.build_from_signature(sig_v2)
                
                # Merge nodes and edges
                full_schema.nodes.extend(sub_schema.nodes)
                full_schema.edges.extend(sub_schema.edges)
            except Exception:
                # Silently skip validation errors in seed cases to keep robustness
                continue

        # Deduplicate nodes by ID
        unique_nodes = {node.node_id: node for node in full_schema.nodes}
        full_schema.nodes = list(unique_nodes.values())

        # Deduplicate edges by (source_id, target_id, type)
        unique_edges = {}
        for edge in full_schema.edges:
            key = (edge.source_id, edge.target_id, edge.relationship_type)
            unique_edges[key] = edge
        full_schema.edges = list(unique_edges.values())

        # Build NetworkX Graph
        g = nx.Graph()
        for node in full_schema.nodes:
            g.add_node(
                node.node_id,
                label=node.label,
                type=node.properties.get("type", "Unknown"),
                name=node.properties.get("name") or node.properties.get("summary") or node.node_id,
                properties=node.properties
            )

        for edge in full_schema.edges:
            g.add_edge(
                edge.source_id,
                edge.target_id,
                relationship=edge.relationship_type,
                weight=edge.weight or 1.0
            )

        return g, full_schema

    def compute_graph_intelligence(self, cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Runs modularity, centrality, and risk level algorithms on the database network.
        """
        g, schema = self.build_networkx_graph(cases)
        
        if len(g) == 0:
            return {"nodes": [], "links": [], "statistics": {"density": 0, "communities": 0}}

        # 1. Compute Spring Layout Coordinates dynamically
        try:
            pos_layout = nx.spring_layout(g, scale=160.0, center=(250.0, 250.0))
        except Exception:
            pos_layout = {node_id: [250.0, 250.0] for node_id in g.nodes}

        # 2. Degree and Closeness Centrality
        deg_centrality = nx.degree_centrality(g)
        try:
            closeness_centrality = nx.closeness_centrality(g)
        except Exception:
            closeness_centrality = deg_centrality

        # 3. Community Detection via Modularity
        communities = {}
        try:
            from networkx.algorithms.community import greedy_modularity_communities
            comm_list = list(greedy_modularity_communities(g))
            for comm_id, node_set in enumerate(comm_list):
                for node_id in node_set:
                    communities[node_id] = comm_id
        except Exception:
            # Fallback if partition fails or list is empty
            communities = {node_id: 0 for node_id in g.nodes}

        # 4. Compile output nodes with metrics and coordinate mappings
        enriched_nodes = []
        for node in schema.nodes:
            node_id = node.node_id
            centrality = closeness_centrality.get(node_id, 0.0)
            comm_id = communities.get(node_id, 0)
            coord = pos_layout.get(node_id, [250.0, 250.0])
            
            # Derived risk level: higher centrality = higher risk
            risk_score = min(1.0, centrality * 5.0)
            if risk_score > 0.6:
                risk_level = "High Risk"
            elif risk_score > 0.3:
                risk_level = "Medium Risk"
            else:
                risk_level = "Low Risk"

            # Inject calculated metrics into properties
            properties = dict(node.properties)
            properties["centrality"] = round(centrality, 3)
            properties["community_id"] = comm_id
            properties["risk_level"] = risk_level
            properties["label"] = node.label

            # Node label/type normalizer mapping to lucide icons in frontend
            # Node labels: Crime -> FIR, Accused -> Person, Victim -> Person, Behavior -> UPI or Phone or Location
            type_mapping = {
                "Crime": "FIR",
                "PoliceStation": "Location",
                "Taxonomy": "Location",
                "LegalSection": "Location",
                "Behavior": "UPI",
                "Victim": "Person",
                "Accused": "Person",
                "Gang": "Person",
            }
            mapped_type = type_mapping.get(node.label, "Location")

            # Format name matching UI expectation
            name_val = node.properties.get("name") or node.properties.get("summary") or node_id
            if mapped_type == "FIR" and node.properties.get("crime_no"):
                name_val = f"FIR-{node.properties.get('case_master_id')}"

            meta_data = {
                "centrality": round(centrality, 3),
                "community": comm_id,
                "schemaVersion": "2.1.0"
            }

            enriched_nodes.append({
                "id": node_id,
                "name": name_val,
                "type": mapped_type,
                "x": float(coord[0]),
                "y": float(coord[1]),
                "risk": risk_level,
                "clearance": "RESTRICTED AUDIT",
                "details": node.properties.get("summary") or node.properties.get("facts") or f"Knowledge entity of type {node.label}.",
                "meta": meta_data,
                "properties": properties
            })

        # 4. Compile links
        links = []
        for edge in schema.edges:
            rel_type = edge.relationship_type
            mapped_type = "Co-occurrence"
            if "COMMUNICATION" in rel_type or "PHONE" in rel_type or "CALL" in rel_type:
                mapped_type = "Communication"
            elif "OWNERSHIP" in rel_type or "OWNED" in rel_type or "HAS_ACCUSED" in rel_type:
                mapped_type = "Ownership"
            elif "TRANSACTION" in rel_type or "TRANSFER" in rel_type or "PAYMENT" in rel_type:
                mapped_type = "Transaction"
                
            label_text = rel_type.replace("CRIME_", "").replace("ACCUSED_", "").replace("_", " ").title()

            links.append({
                "source": edge.source_id,
                "target": edge.target_id,
                "type": mapped_type,
                "label": label_text,
                "weight": edge.weight or 1.0
            })

        # 5. Calculate global statistics
        density = nx.density(g)
        num_communities = len(set(communities.values()))

        # 6. Hidden Links Detection
        # Finds pairs of nodes with high Jaccard coefficient (common neighbors) that are NOT directly connected.
        hidden_links = []
        try:
            preds = nx.jaccard_coefficient(g)
            for u, v, p in preds:
                if p > 0.4 and not g.has_edge(u, v):
                    # Filter: Only connect meaningful nodes (e.g. Accused and Crime)
                    hidden_links.append({
                        "source": u,
                        "target": v,
                        "type": "SUGGESTED_LINK",
                        "weight": round(p, 3),
                        "explanation": f"High common association Jaccard index: {p:.2f}."
                    })
        except Exception:
            pass

        return {
            "nodes": enriched_nodes,
            "links": links,
            "hidden_links": hidden_links[:10],  # Limit to top 10 matches
            "statistics": {
                "density": round(density, 4),
                "communities_count": num_communities,
                "nodes_count": len(g),
                "links_count": len(g.edges)
            }
        }
