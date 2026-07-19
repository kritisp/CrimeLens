"""
CrimeLens AI — Knowledge Graph Builder

Maps the deeply nested CrimeSignatureV2.1 structure into a flattened, 
interconnected network of GraphNode and GraphEdge objects.
"""

from app.services.crime_signature_v2.models import CrimeSignatureV2
from app.domain.knowledge_graph.models import (
    GraphSchema, GraphNode, GraphEdge,
    CrimeNode, VictimNode, AccusedNode, PoliceStationNode,
    LegalSectionNode, TaxonomyNode, BehaviorNode, GangNode
)


class GraphBuilder:
    """Constructs a GraphSchema from a CrimeSignatureV2.1 object."""

    def build_from_signature(self, signature: CrimeSignatureV2) -> GraphSchema:
        schema = GraphSchema()

        # 1. CRIME NODE
        crime_node_id = f"CRIME_{signature.identity.crime_no}"
        crime_node = CrimeNode(
            node_id=crime_node_id,
            properties={
                "crime_no": signature.identity.crime_no,
                "case_master_id": signature.identity.case_master_id,
                "incident_date": signature.temporal.incident_date_from,
                "schema_version": signature.identity.schema_version,
                "overall_hash": signature.crime_dna.overall_crime_hash
            }
        )
        schema.nodes.append(crime_node)

        # 2. POLICE STATION NODE
        ps_id = f"PS_{signature.spatial.police_station_id}"
        ps_node = PoliceStationNode(
            node_id=ps_id,
            properties={"police_station_id": signature.spatial.police_station_id}
        )
        schema.nodes.append(ps_node)
        schema.edges.append(GraphEdge(
            source_id=crime_node_id,
            target_id=ps_id,
            relationship_type="CRIME_OCCURRED_AT"
        ))

        # 3. TAXONOMY NODE
        tax_id = f"TAX_{signature.crime_dna.taxonomy_hash}"
        tax_node = TaxonomyNode(
            node_id=tax_id,
            properties={
                "major_head": signature.taxonomy.crime_major_head,
                "minor_head": signature.taxonomy.crime_minor_head,
                "gravity": signature.taxonomy.gravity_offence
            }
        )
        schema.nodes.append(tax_node)
        schema.edges.append(GraphEdge(
            source_id=crime_node_id,
            target_id=tax_id,
            relationship_type="CRIME_CATEGORIZED_AS"
        ))

        # 4. LEGAL SECTION NODES
        for charge in signature.legal.statutory_charges:
            legal_id = f"LEGAL_{charge.act_code}_{charge.section_code}".replace(" ", "_")
            legal_node = LegalSectionNode(
                node_id=legal_id,
                properties={"act": charge.act_code, "section": charge.section_code}
            )
            schema.nodes.append(legal_node)
            schema.edges.append(GraphEdge(
                source_id=crime_node_id,
                target_id=legal_id,
                relationship_type="CRIME_CHARGED_UNDER"
            ))

        # 5. BEHAVIOR (MO) NODE
        # We group crimes by their behavioral hash to cluster identical MOs.
        behavior_id = f"MO_{signature.crime_dna.behavior_hash}"
        beh_node = BehaviorNode(
            node_id=behavior_id,
            properties={
                "summary": signature.behavioral.behavior_summary,
                "tags": signature.behavioral.behavior_tags,
                "weapon": signature.behavioral.weapon_used
            }
        )
        schema.nodes.append(beh_node)
        schema.edges.append(GraphEdge(
            source_id=crime_node_id,
            target_id=behavior_id,
            relationship_type="CRIME_EXHIBITS_BEHAVIOR",
            weight=signature.behavioral.behavior_confidence if signature.behavioral.behavior_confidence > 0 else 1.0
        ))

        # 6. VICTIM PROFILE NODE
        if signature.victim.victim_count > 0:
            victim_id = f"VICTIM_PROFILE_{signature.crime_dna.victim_hash}"
            vic_node = VictimNode(
                node_id=victim_id,
                properties={
                    "count": signature.victim.victim_count,
                    "category": signature.victim.victim_category,
                    "summary": signature.victim.victim_summary
                }
            )
            schema.nodes.append(vic_node)
            schema.edges.append(GraphEdge(
                source_id=crime_node_id,
                target_id=victim_id,
                relationship_type="CRIME_HAS_VICTIM"
            ))

        # 7. ACCUSED PROFILE NODE & GANG LINKS
        if signature.accused.accused_count > 0:
            accused_id = f"ACCUSED_PROFILE_{signature.crime_dna.accused_hash}"
            acc_node = AccusedNode(
                node_id=accused_id,
                properties={
                    "count": signature.accused.accused_count,
                    "summary": signature.accused.accused_summary,
                    "gang_indicator": signature.accused.known_gang_indicator
                }
            )
            schema.nodes.append(acc_node)
            schema.edges.append(GraphEdge(
                source_id=crime_node_id,
                target_id=accused_id,
                relationship_type="CRIME_HAS_ACCUSED"
            ))

            # Intelligence Derived Gang Node
            if signature.accused.known_gang_indicator or signature.intelligence.organized_crime_indicator:
                # We use the taxonomy and spatial hash to loosely group gang indicators in the same area
                gang_id = f"GANG_{signature.crime_dna.spatial_hash[:10]}"
                gang_node = GangNode(
                    node_id=gang_id,
                    properties={"indicator": "Organized Network Suspects"}
                )
                schema.nodes.append(gang_node)
                schema.edges.append(GraphEdge(
                    source_id=accused_id,
                    target_id=gang_id,
                    relationship_type="ACCUSED_ASSOCIATED_WITH",
                    confidence=signature.intelligence.intelligence_confidence if signature.intelligence.intelligence_confidence > 0 else 0.8
                ))

        # To avoid duplicates in memory representation (though graph DBs would merge on ID)
        unique_nodes = {n.node_id: n for n in schema.nodes}
        schema.nodes = list(unique_nodes.values())

        return schema
