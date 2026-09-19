export interface BinItem {
  id: number;
  bin_id: string;
  latitude: float;
  longitude: float;
  location_zone: string;
  capacity: number;
  address?: string;
  created_at: string;
  current_fill?: number;
  predicted_fill?: number;
  risk_level?: 'Critical' | 'High' | 'Medium' | 'Low';
  last_collection?: string;
}

export interface MapBin {
  bin_id: string;
  latitude: number;
  longitude: number;
  zone: string;
  address?: string;
  current_fill: number;
  predicted_fill: number;
  overflow_probability: number;
  risk_level: string;
  priority_score: number;
  explanation: string;
}

export type float = number;

export interface SensorRecord {
  id: number;
  bin_id: string;
  timestamp: string;
  fill_level: number;
  zone: string;
  weather?: string;
  event_flag?: boolean;
  day_type?: string;
}

export interface PriorityItem {
  rank: number;
  bin_id: string;
  location: string;
  zone: string;
  latitude: number;
  longitude: number;
  current_fill: number;
  predicted_fill: number;
  overflow_probability: number;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  last_collection?: string;
  days_since_collection: number;
  priority_score: number;
  action: string;
  explanation: string;
}

export interface RouteStop {
  sequence: number;
  bin_id: string;
  zone: string;
  latitude: number;
  longitude: number;
  risk_level: string;
  priority_score: number;
  leg_distance_km: number;
}

export interface SimpleRoute {
  total_bins: number;
  total_estimated_distance_km: number;
  estimated_travel_time_min: number;
  estimated_fuel_liters: number;
  depot_coordinates: { latitude: number; longitude: number; name: string };
  stops: RouteStop[];
  disclaimer: string;
}

export interface PriorityListResponse {
  total_count: number;
  items: PriorityItem[];
  route_preview?: SimpleRoute;
}

export interface ModelRun {
  id: number;
  model_type: string;
  target_type: string;
  training_rows: number;
  mae?: number;
  rmse?: number;
  r2?: number;
  f1?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  feature_importance?: Array<{ feature: string; importance: number }>;
  confusion_matrix?: number[][];
  created_at: string;
}

export interface ModelPerformanceData {
  models: ModelRun[];
  active_regression_model: string;
  active_classification_model: string;
  actual_vs_predicted?: Array<{
    timestamp: string;
    bin_id: string;
    actual: number;
    predicted: number;
    error: number;
  }>;
  residual_distribution?: Array<{ range: string; count: number }>;
}

export interface DashboardKPIs {
  total_bins: number;
  high_risk_bins: number;
  medium_risk_bins: number;
  low_risk_bins: number;
  critical_risk_bins: number;
  average_fill_level: number;
  predicted_overflow_count: number;
  active_alerts_count: number;
  risk_distribution: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  };
  zone_distribution: Array<{ zone: string; count: number }>;
  urgent_bins: PriorityItem[];
  recent_alerts: AlertItem[];
  model_status: {
    is_trained: boolean;
    model_type: string;
    last_trained?: string;
    mae?: number;
    r2?: number;
  };
}

export interface AlertItem {
  id: number;
  bin_id?: string;
  alert_type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export interface EDAStats {
  total_records: number;
  total_bins: number;
  missing_values: number;
  duplicate_rows: number;
  date_range_start?: string;
  date_range_end?: string;
  avg_fill: number;
  min_fill: number;
  max_fill: number;
  overflow_count: number;
  overflow_percentage: number;
  fill_distribution: Array<{ range: string; count: number; percentage: number }>;
  zone_stats: Array<{ zone: string; count: number; avg_fill: number; high_risk_count: number }>;
  day_of_week_stats: Array<{ day: string; avg_fill: number }>;
  weather_stats: Array<{ weather: string; avg_fill: number; count: number }>;
  event_stats: Array<{ event: string; avg_fill: number; count: number }>;
  fill_vs_days_collection: Array<{ days: string; avg_fill: number; overflow_rate: number }>;
  time_series_trend: Array<{ date: string; avg_fill: number }>;
}

export interface AppSettings {
  priority_weights: {
    predicted_fill: number;
    overflow_prob: number;
    days_since_collection: number;
    current_fill: number;
  };
  risk_thresholds: {
    critical: number;
    high: number;
    medium: number;
  };
  prediction_horizon: string;
  active_model: string;
}

export interface SinglePredictResult {
  bin_id: string;
  current_fill_level: number;
  predicted_fill_level: number;
  overflow_probability: number;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  priority_score: number;
  explanation: string;
  factors: Record<string, any>;
}
