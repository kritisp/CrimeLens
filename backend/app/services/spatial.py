import math
from datetime import datetime
from typing import Any

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points
    on the Earth in kilometers.
    """
    # Earth's radius in km
    R = 6371.0
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def dbscan_cluster(firs: list[Any], eps: float = 1.5, min_samples: int = 3) -> list[list[Any]]:
    """
    Simple DBSCAN spatial clustering in pure Python.
    Filters out records with missing coordinates.
    firs: List of SQLAlchemy FIR objects.
    Returns: List of clusters, each cluster being a list of FIR objects.
    """
    valid_firs = [f for f in firs if f.latitude is not None and f.longitude is not None]
    labels = {fir.id: 0 for fir in valid_firs}  # 0: unvisited, -1: noise, >0: cluster_id
    clusters = []

    def get_neighbors(fir):
        neighbors = []
        for other in valid_firs:
            if fir.id == other.id:
                continue
            dist = haversine_distance(fir.latitude, fir.longitude, other.latitude, other.longitude)
            if dist <= eps:
                neighbors.append(other)
        return neighbors

    cluster_id = 0
    for fir in valid_firs:
        if labels[fir.id] != 0:
            continue

        neighbors = get_neighbors(fir)
        if len(neighbors) < min_samples:
            labels[fir.id] = -1  # Noise
            continue

        # Found a new cluster core point
        cluster_id += 1
        labels[fir.id] = cluster_id
        cluster = [fir]

        # Expand cluster
        queue = list(neighbors)
        idx = 0
        while idx < len(queue):
            curr_fir = queue[idx]
            if labels[curr_fir.id] == -1:
                labels[curr_fir.id] = cluster_id
                cluster.append(curr_fir)
            elif labels[curr_fir.id] == 0:
                labels[curr_fir.id] = cluster_id
                cluster.append(curr_fir)
                curr_neighbors = get_neighbors(curr_fir)
                if len(curr_neighbors) >= min_samples:
                    queue.extend(curr_neighbors)
            idx += 1
        
        clusters.append(cluster)

    return clusters

def calculate_hotspot_score(cluster_firs: list[Any]) -> int:
    """
    Calculate a crime hotspot score between 0 and 100 based on:
    1. Total volume of crimes
    2. Severity of crimes (critical=5, high=3, medium=2, low=1)
    3. Recency of incidents (exponential decay based on days elapsed)
    """
    if not cluster_firs:
        return 0
    
    # 1. Volume Factor (up to 40 pts)
    volume_pts = min(len(cluster_firs) * 2, 40)
    
    # 2. Severity Factor (up to 40 pts)
    severity_weights = {"critical": 5.0, "high": 3.0, "medium": 2.0, "low": 1.0}
    total_severity = 0.0
    for fir in cluster_firs:
        sev = (fir.severity or "medium").lower()
        total_severity += severity_weights.get(sev, 2.0)
    
    avg_severity = total_severity / len(cluster_firs)
    # Map avg severity (1.0 to 5.0) to points (0 to 40)
    severity_pts = int(((avg_severity - 1.0) / 4.0) * 40)
    severity_pts = max(0, min(severity_pts, 40))

    # 3. Recency Factor (up to 20 pts)
    # Find most recent date
    now = datetime.utcnow()
    most_recent_date = max(fir.date for fir in cluster_firs)
    days_elapsed = (now - most_recent_date).days
    
    # Exponential decay over 30 days
    recency_decay = math.exp(-days_elapsed / 30.0)
    recency_pts = int(recency_decay * 20)
    
    score = volume_pts + severity_pts + recency_pts
    return max(10, min(int(score), 100))

def generate_patrol_routes(center_lat: float, center_lng: float, cluster_firs: list[Any]) -> list[list[float]]:
    """
    Generate a closed-loop spatial patrol route (coordinates list)
    connecting the center point and the coordinates of the crimes in the cluster.
    """
    # Simple nearest-neighbor path starting and ending at center
    coords = [[fir.latitude, fir.longitude] for fir in cluster_firs if fir.latitude is not None and fir.longitude is not None]
    if not coords:
        return [[center_lat, center_lng]]

    route = [[center_lat, center_lng]]
    unvisited = list(coords)

    curr_lat, curr_lng = center_lat, center_lng
    while unvisited:
        # Find nearest unvisited coordinate
        nearest_idx = 0
        min_dist = float('inf')
        for idx, (lat, lng) in enumerate(unvisited):
            dist = haversine_distance(curr_lat, curr_lng, lat, lng)
            if dist < min_dist:
                min_dist = dist
                nearest_idx = idx
        
        curr_lat, curr_lng = unvisited.pop(nearest_idx)
        route.append([curr_lat, curr_lng])
        
    route.append([center_lat, center_lng])  # Close the loop
    return route
