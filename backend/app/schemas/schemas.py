from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ----------------- Bin Schemas -----------------
class BinBase(BaseModel):
    bin_id: str
    latitude: float
    longitude: float
    location_zone: str
    capacity: float = 100.0
    address: Optional[str] = None

class BinCreate(BinBase):
    pass

class BinResponse(BinBase):
    id: int
    created_at: datetime
    current_fill: Optional[float] = None
    predicted_fill: Optional[float] = None
    risk_level: Optional[str] = None
    last_collection: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- Sensor Reading Schemas -----------------
class SensorReadingBase(BaseModel):
    bin_id: str
    timestamp: datetime
    fill_level: float = Field(..., ge=0.0, le=100.0)
    weather: Optional[str] = "Clear"
    event_flag: Optional[bool] = False
    day_type: Optional[str] = "Weekday"

class SensorReadingCreate(SensorReadingBase):
    pass

class BulkReadingCreate(BaseModel):
    readings: List[SensorReadingCreate]

class SensorReadingResponse(SensorReadingBase):
    id: int
    created_at: datetime
    days_since_collection: Optional[float] = None

    class Config:
        from_attributes = True

# ----------------- Collection Schemas -----------------
class CollectionBase(BaseModel):
    bin_id: str
    collection_time: datetime
    fill_before_collection: float = Field(..., ge=0.0, le=100.0)

class CollectionCreate(CollectionBase):
    pass

class CollectionResponse(CollectionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Prediction Schemas -----------------
class PredictionResponse(BaseModel):
    id: int
    bin_id: str
    prediction_time: datetime
    predicted_fill_level: float
    overflow_probability: float
    risk_level: str
    priority_score: float
    model_version: str
    explanation: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SinglePredictRequest(BaseModel):
    bin_id: str
    current_fill_level: float = Field(..., ge=0.0, le=100.0)
    location_zone: str
    days_since_collection: float = Field(0.0, ge=0.0)
    weather: Optional[str] = "Clear"
    event_flag: Optional[bool] = False
    day_type: Optional[str] = "Weekday"
    horizon_hours: Optional[int] = 4

class SinglePredictResponse(BaseModel):
    bin_id: str
    current_fill_level: float
    predicted_fill_level: float
    overflow_probability: float
    risk_level: str
    priority_score: float
    explanation: str
    factors: Dict[str, Any]

# ----------------- Model Runs Schemas -----------------
class ModelRunResponse(BaseModel):
    id: int
    model_type: str
    target_type: str
    training_rows: int
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2: Optional[float] = None
    f1: Optional[float] = None
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    feature_importance: Optional[List[Dict[str, Any]]] = None
    confusion_matrix: Optional[List[List[int]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ModelComparisonResponse(BaseModel):
    models: List[ModelRunResponse]
    active_regression_model: str
    active_classification_model: str
    actual_vs_predicted: Optional[List[Dict[str, Any]]] = None
    residual_distribution: Optional[List[Dict[str, Any]]] = None

class TrainModelRequest(BaseModel):
    model_types: Optional[List[str]] = ["LinearRegression", "RandomForestRegressor", "RandomForestClassifier"]
    test_size: Optional[float] = 0.2

# ----------------- Priority List & Routing -----------------
class PriorityItemResponse(BaseModel):
    rank: int
    bin_id: str
    location: str
    zone: str
    latitude: float
    longitude: float
    current_fill: float
    predicted_fill: float
    overflow_probability: float
    risk_level: str
    last_collection: Optional[str] = None
    days_since_collection: float
    priority_score: float
    action: str
    explanation: str

class RouteStop(BaseModel):
    sequence: int
    bin_id: str
    zone: str
    latitude: float
    longitude: float
    risk_level: str
    priority_score: float
    leg_distance_km: float

class SimpleRouteResponse(BaseModel):
    total_bins: int
    total_estimated_distance_km: float
    estimated_travel_time_min: float
    estimated_fuel_liters: float
    depot_coordinates: Dict[str, Any]
    stops: List[RouteStop]
    disclaimer: str

class PriorityListResponse(BaseModel):
    total_count: int
    items: List[PriorityItemResponse]
    route_preview: Optional[SimpleRouteResponse] = None

# ----------------- Settings Schemas -----------------
class PriorityWeights(BaseModel):
    predicted_fill: float = 0.50
    overflow_prob: float = 0.25
    days_since_collection: float = 0.15
    current_fill: float = 0.10

class RiskThresholds(BaseModel):
    critical: float = 90.0
    high: float = 75.0
    medium: float = 50.0

class AppSettingsSchema(BaseModel):
    priority_weights: PriorityWeights
    risk_thresholds: RiskThresholds
    prediction_horizon: str = "Next collection window (4 hrs)"
    active_model: str = "RandomForestRegressor"

# ----------------- Alerts Schemas -----------------
class AlertResponse(BaseModel):
    id: int
    bin_id: Optional[str]
    alert_type: str
    severity: str
    message: str
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- EDA & Dataset Stats -----------------
class ZoneStat(BaseModel):
    zone: str
    count: int
    avg_fill: float
    high_risk_count: int

class DayOfWeekStat(BaseModel):
    day: str
    avg_fill: float

class EDAStatsResponse(BaseModel):
    total_records: int
    total_bins: int
    missing_values: int
    duplicate_rows: int
    date_range_start: Optional[str]
    date_range_end: Optional[str]
    avg_fill: float
    min_fill: float
    max_fill: float
    overflow_count: int
    overflow_percentage: float
    fill_distribution: List[Dict[str, Any]]
    zone_stats: List[ZoneStat]
    day_of_week_stats: List[DayOfWeekStat]
    weather_stats: List[Dict[str, Any]]
    event_stats: List[Dict[str, Any]]
    fill_vs_days_collection: List[Dict[str, Any]]
    time_series_trend: List[Dict[str, Any]]

# ----------------- Data Management Schemas -----------------
class SyntheticGenerateRequest(BaseModel):
    num_bins: int = Field(50, ge=5, le=5000)
    num_days: int = Field(30, ge=3, le=365)
    readings_per_day: int = Field(4, ge=1, le=24)
    zones: Optional[List[str]] = ["Residential", "Commercial", "Market", "Industrial", "IT Park", "Mixed"]
    include_weather: bool = True
    include_events: bool = True
    add_noise: bool = True

class UploadValidationResponse(BaseModel):
    is_valid: bool
    filename: str
    total_rows: int
    detected_columns: List[str]
    missing_columns: List[str]
    missing_values_count: int
    duplicate_rows_count: int
    invalid_fill_values_count: int
    errors: List[str]
    preview_rows: List[Dict[str, Any]]

# ----------------- Dashboard KPI Schemas -----------------
class DashboardKPIResponse(BaseModel):
    total_bins: int
    high_risk_bins: int
    medium_risk_bins: int
    low_risk_bins: int
    critical_risk_bins: int
    average_fill_level: float
    predicted_overflow_count: int
    active_alerts_count: int
    risk_distribution: Dict[str, int]
    zone_distribution: List[Dict[str, Any]]
    urgent_bins: List[PriorityItemResponse]
    recent_alerts: List[AlertResponse]
    model_status: Dict[str, Any]
