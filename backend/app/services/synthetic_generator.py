import random
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple

# Base city coordinate reference: Mathura, Uttar Pradesh, India (Sri Krishna Janmabhoomi / Center)
BASE_LAT = 27.4924
BASE_LNG = 77.6737

# Real OpenStreetMap places & landmarks in Mathura, India
MATHURA_OSM_PLACES = {
    "Market": [
        {"name": "Krishna Janmasthan Bazaar", "lat": 27.5050, "lng": 77.6690, "addr": "Near Potra Kund, Deeg Gate, Mathura"},
        {"name": "Vishram Ghat Riverfront", "lat": 27.5035, "lng": 77.6845, "addr": "Yamuna Kinara Ghats, Mathura"},
        {"name": "Dwarkadhish Temple Chowk", "lat": 27.5042, "lng": 77.6830, "addr": "Asikunda Ghat Lane, Mathura"},
        {"name": "Holi Gate Main Bazaar", "lat": 27.4975, "lng": 77.6780, "addr": "Holi Gate Commercial Square, Mathura"},
        {"name": "Chatta Bazaar Heritage Walk", "lat": 27.5015, "lng": 77.6860, "addr": "Chatta Bazaar, Old Mathura"},
        {"name": "Tilak Dwar Wholesale Market", "lat": 27.4990, "lng": 77.6800, "addr": "Tilak Dwar, Mathura"},
        {"name": "Swami Ghat Vegetable Market", "lat": 27.5020, "lng": 77.6850, "addr": "Swami Ghat Mandi, Mathura"}
    ],
    "Commercial": [
        {"name": "Krishna Nagar Commercial Hub", "lat": 27.5060, "lng": 77.6580, "addr": "Krishna Nagar High Street, Mathura"},
        {"name": "Dampier Nagar Plaza", "lat": 27.4950, "lng": 77.6750, "addr": "Civil Lines, Dampier Nagar, Mathura"},
        {"name": "Highway Plaza NH-19", "lat": 27.4780, "lng": 77.6380, "addr": "Delhi-Agra National Highway, Mathura"},
        {"name": "Mathura Junction Terminal Plaza", "lat": 27.4842, "lng": 77.6740, "addr": "Railway Station Road, Mathura"},
        {"name": "Bhuteshwar Crossing Plaza", "lat": 27.5090, "lng": 77.6650, "addr": "Bhuteshwar Mahadev Road, Mathura"},
        {"name": "Sadar Bazaar Cantonment", "lat": 27.4890, "lng": 77.6980, "addr": "Mathura Cantonment Board Area"}
    ],
    "Residential": [
        {"name": "Govind Nagar Colony", "lat": 27.5180, "lng": 77.6680, "addr": "Sector 1, Govind Nagar, Mathura"},
        {"name": "Radha Nagar Enclave", "lat": 27.5010, "lng": 77.6450, "addr": "Goverdhan Road Belt, Mathura"},
        {"name": "Mayur Vihar Colony", "lat": 27.4910, "lng": 77.6630, "addr": "BSA College Road, Mathura"},
        {"name": "Anand Puri Enclave", "lat": 27.4860, "lng": 77.6620, "addr": "Anand Puri, Mathura"},
        {"name": "Bankey Bihari Nagar", "lat": 27.5350, "lng": 77.6620, "addr": "Pagal Baba Road, Mathura Outskirts"},
        {"name": "Maholi Road Residential Sector", "lat": 27.4820, "lng": 77.6580, "addr": "Maholi Road, Mathura"}
    ],
    "IT Park": [
        {"name": "GLA Tech Corridor Hub", "lat": 27.6050, "lng": 77.5940, "addr": "GLA University Tech Complex, NH-19 Mathura"},
        {"name": "Mathura Software Innovation Park", "lat": 27.5250, "lng": 77.6400, "addr": "Vrindavan Bypass IT Park, Mathura"},
        {"name": "Digital Center Mathura", "lat": 27.5120, "lng": 77.6550, "addr": "National Highway Innovation Hub, Mathura"}
    ],
    "Industrial": [
        {"name": "Mathura Refinery IOCL Complex", "lat": 27.4320, "lng": 77.6950, "addr": "Indian Oil Refinery Township, Mathura"},
        {"name": "UPSIDC Industrial Area Site A", "lat": 27.4450, "lng": 77.6820, "addr": "Industrial Area Site A, Baad, Mathura"},
        {"name": "UPSIDC Industrial Area Site B", "lat": 27.4520, "lng": 77.6740, "addr": "Industrial Area Site B, Mathura"},
        {"name": "Transport Nagar Logistics Hub", "lat": 27.4620, "lng": 77.6510, "addr": "Transport Nagar, Bypass Road, Mathura"}
    ],
    "Mixed": [
        {"name": "Geeta Mandir / Birla Temple", "lat": 27.5260, "lng": 77.6750, "addr": "Vrindavan Road, Mathura"},
        {"name": "Masani Bypass Crossing", "lat": 27.5210, "lng": 77.6850, "addr": "Masani Road, Mathura"},
        {"name": "Dhauli Pyau Chowk", "lat": 27.4880, "lng": 77.6710, "addr": "Dhauli Pyau, Mathura"},
        {"name": "Pali Khera Sonkh Hub", "lat": 27.4750, "lng": 77.6250, "addr": "Sonkh Road Crossing, Mathura"}
    ]
}

ZONE_CONFIG = {
    "Market": {
        "base_fill_rate": 6.5,
        "weekend_mult": 1.4,
        "event_mult": 1.8,
        "collection_threshold": 82.0,
    },
    "Commercial": {
        "base_fill_rate": 5.2,
        "weekend_mult": 1.2,
        "event_mult": 1.5,
        "collection_threshold": 85.0,
    },
    "IT Park": {
        "base_fill_rate": 4.5,
        "weekend_mult": 0.4,
        "event_mult": 1.3,
        "collection_threshold": 88.0,
    },
    "Industrial": {
        "base_fill_rate": 4.0,
        "weekend_mult": 0.5,
        "event_mult": 1.2,
        "collection_threshold": 85.0,
    },
    "Residential": {
        "base_fill_rate": 3.2,
        "weekend_mult": 1.3,
        "event_mult": 1.4,
        "collection_threshold": 90.0,
    },
    "Mixed": {
        "base_fill_rate": 4.2,
        "weekend_mult": 1.1,
        "event_mult": 1.4,
        "collection_threshold": 85.0,
    }
}

WEATHER_TYPES = ["Clear", "Overcast", "Rain", "Storm"]
WEATHER_FILL_IMPACT = {
    "Clear": 1.0,
    "Overcast": 1.05,
    "Rain": 1.25,
    "Storm": 1.35
}

def generate_bins(num_bins: int = 50, zones: List[str] = None) -> List[Dict[str, Any]]:
    if not zones:
        zones = list(ZONE_CONFIG.keys())
    
    bins_data = []
    zone_names = list(zones)

    for i in range(1, num_bins + 1):
        bin_id = f"BIN_{i:03d}"
        zone = zone_names[(i - 1) % len(zone_names)]
        
        # Pull real OSM place in Mathura
        osm_candidates = MATHURA_OSM_PLACES.get(zone, MATHURA_OSM_PLACES["Mixed"])
        osm_place = osm_candidates[(i - 1) % len(osm_candidates)]
        
        # Subtle realistic GPS jitter around the landmark
        lat = osm_place["lat"] + random.gauss(0, 0.0025)
        lng = osm_place["lng"] + random.gauss(0, 0.0025)
        
        bins_data.append({
            "bin_id": bin_id,
            "latitude": round(lat, 6),
            "longitude": round(lng, 6),
            "location_zone": zone,
            "capacity": 100.0,
            "address": f"{osm_place['name']} - {osm_place['addr']} [Point {i % 5 + 1}]",
            "created_at": datetime.utcnow()
        })
    return bins_data

def generate_synthetic_dataset(
    num_bins: int = 50,
    num_days: int = 30,
    readings_per_day: int = 4,
    zones: List[str] = None,
    include_weather: bool = True,
    include_events: bool = True,
    add_noise: bool = True
) -> Tuple[pd.DataFrame, List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Generates realistic temporal waste readings calibrated for Mathura locations,
    with market surges, pilgrimage/event spikes (e.g. Janmashtami/Holi festivals),
    weather effects, and realistic collection resets.
    """
    bins = generate_bins(num_bins, zones)
    
    interval_hours = 24 / readings_per_day
    end_date = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=num_days)
    
    timestamps = []
    current_time = start_date
    while current_time <= end_date:
        timestamps.append(current_time)
        current_time += timedelta(hours=interval_hours)

    all_readings = []
    all_collections = []

    for b in bins:
        bin_id = b["bin_id"]
        zone = b["location_zone"]
        cfg = ZONE_CONFIG.get(zone, ZONE_CONFIG["Mixed"])
        
        current_fill = random.uniform(10.0, 30.0)
        last_collection_time = start_date - timedelta(hours=random.randint(12, 48))
        
        for t in timestamps:
            is_weekend = t.weekday() >= 5
            day_type = "Weekend" if is_weekend else "Weekday"
            
            if include_weather:
                weather_roll = random.random()
                if weather_roll < 0.65:
                    weather = "Clear"
                elif weather_roll < 0.85:
                    weather = "Overcast"
                elif weather_roll < 0.96:
                    weather = "Rain"
                else:
                    weather = "Storm"
            else:
                weather = "Clear"

            # Event / Festival flag (e.g. Yamuna Aarti, Janmashtami, Parikrama days in Mathura)
            event_flag = False
            if include_events:
                if random.random() < 0.05:
                    event_flag = True

            base_rate = cfg["base_fill_rate"] * (interval_hours / 4.0)
            mult = 1.0
            if is_weekend:
                mult *= cfg["weekend_mult"]
            if event_flag:
                mult *= cfg["event_mult"]
            if include_weather:
                mult *= WEATHER_FILL_IMPACT.get(weather, 1.0)
            
            # Diurnal cycle
            hour = t.hour
            if 8 <= hour <= 20:
                mult *= 1.3
            else:
                mult *= 0.6

            noise = random.gauss(0, 1.2) if add_noise else 0.0
            increment = max(0.2, (base_rate * mult) + noise)
            
            collected = False
            if current_fill >= cfg["collection_threshold"] or current_fill >= 92.0:
                if random.random() < 0.75:
                    collected = True
            elif current_fill >= 70.0 and random.random() < 0.25:
                collected = True
            
            if collected:
                all_collections.append({
                    "bin_id": bin_id,
                    "collection_time": t,
                    "fill_before_collection": round(current_fill, 2),
                    "created_at": datetime.utcnow()
                })
                current_fill = random.uniform(5.0, 15.0)
                last_collection_time = t
            else:
                current_fill = min(100.0, current_fill + increment)

            days_since_collection = max(0.0, round((t - last_collection_time).total_seconds() / 86400.0, 2))
            overflow = 1 if current_fill >= 90.0 else 0

            all_readings.append({
                "bin_id": bin_id,
                "timestamp": t,
                "fill_level": round(current_fill, 2),
                "location_zone": zone,
                "last_collection": last_collection_time,
                "days_since_collection": days_since_collection,
                "day_type": day_type,
                "weather": weather,
                "event_flag": event_flag,
                "overflow": overflow
            })

    df = pd.DataFrame(all_readings)
    return df, bins, all_collections
