import math
from typing import List, Dict, Any

# Depot coordinates: Mathura Nagar Nigam Central Depot (Mathura, UP, India)
DEPOT = {"latitude": 27.4924, "longitude": 77.6737, "name": "Mathura Nagar Nigam Central Depot"}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in km."""
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def compute_priority_route(priority_bins: List[Dict[str, Any]], max_stops: int = 25) -> Dict[str, Any]:
    """
    Greedy nearest-neighbor ordering on top priority bins starting from Depot.
    Clearly labeled as illustrative estimate.
    """
    if not priority_bins:
        return {
            "total_bins": 0,
            "total_estimated_distance_km": 0.0,
            "estimated_travel_time_min": 0.0,
            "estimated_fuel_liters": 0.0,
            "depot_coordinates": DEPOT,
            "stops": [],
            "disclaimer": "Illustrative route ordering — not municipal road-network optimization."
        }

    # Select top high urgency candidates (up to max_stops)
    candidates = priority_bins[:max_stops].copy()
    
    current_lat = DEPOT["latitude"]
    current_lng = DEPOT["longitude"]
    ordered_stops = []
    total_dist = 0.0

    seq = 1
    while candidates:
        # Find nearest unvisited bin from current location
        nearest_idx = 0
        best_dist = float("inf")
        for idx, b in enumerate(candidates):
            d = haversine_distance(current_lat, current_lng, b["latitude"], b["longitude"])
            if d < best_dist:
                best_dist = d
                nearest_idx = idx

        chosen = candidates.pop(nearest_idx)
        total_dist += best_dist
        current_lat = chosen["latitude"]
        current_lng = chosen["longitude"]

        ordered_stops.append({
            "sequence": seq,
            "bin_id": chosen["bin_id"],
            "zone": chosen.get("zone", "Mixed"),
            "latitude": chosen["latitude"],
            "longitude": chosen["longitude"],
            "risk_level": chosen.get("risk_level", "Medium"),
            "priority_score": chosen.get("priority_score", 50.0),
            "leg_distance_km": round(best_dist, 2)
        })
        seq += 1

    # Return leg to depot
    return_dist = haversine_distance(current_lat, current_lng, DEPOT["latitude"], DEPOT["longitude"])
    total_dist += return_dist

    # Heuristic estimates: 25 km/h urban speed + 4 mins per bin stop
    transit_time_min = (total_dist / 25.0) * 60.0
    service_time_min = len(ordered_stops) * 4.0
    est_fuel = total_dist * 0.35 # ~0.35L per km for medium municipal truck

    return {
        "total_bins": len(ordered_stops),
        "total_estimated_distance_km": round(total_dist, 2),
        "estimated_travel_time_min": round(transit_time_min + service_time_min, 1),
        "estimated_fuel_liters": round(est_fuel, 2),
        "depot_coordinates": DEPOT,
        "stops": ordered_stops,
        "disclaimer": "Illustrative route ordering — not municipal road-network optimization. Approximate straight-line distance heuristic."
    }
