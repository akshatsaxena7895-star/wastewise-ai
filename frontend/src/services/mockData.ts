import {
  DashboardKPIs,
  BinItem,
  PriorityListResponse,
  PriorityItem,
  MapBin,
  AlertItem,
  EDAStats,
  ModelPerformanceData,
  AppSettings
} from '../types';

export const MOCK_BINS: BinItem[] = [
  {
    id: 1,
    bin_id: 'BIN-VRN-101',
    latitude: 27.4984,
    longitude: 77.6745,
    location_zone: 'Vishram Ghat',
    capacity: 240,
    address: 'Near Yamuna Snan Ghat Steps',
    created_at: '2026-01-10T10:00:00Z',
    current_fill: 94.5,
    predicted_fill: 98.2,
    risk_level: 'Critical',
    last_collection: '3 days ago'
  },
  {
    id: 2,
    bin_id: 'BIN-JNB-204',
    latitude: 27.5042,
    longitude: 77.6698,
    location_zone: 'Janmabhoomi',
    capacity: 360,
    address: 'Gate 3 Pilgrim Plaza',
    created_at: '2026-01-12T09:00:00Z',
    current_fill: 88.0,
    predicted_fill: 95.0,
    risk_level: 'Critical',
    last_collection: '2 days ago'
  },
  {
    id: 3,
    bin_id: 'BIN-KRN-302',
    latitude: 27.4921,
    longitude: 77.6834,
    location_zone: 'Krishna Nagar',
    capacity: 240,
    address: 'Main Market Crossing',
    created_at: '2026-01-15T11:30:00Z',
    current_fill: 81.2,
    predicted_fill: 89.4,
    risk_level: 'High',
    last_collection: '1 day ago'
  },
  {
    id: 4,
    bin_id: 'BIN-IND-405',
    latitude: 27.4765,
    longitude: 77.6912,
    location_zone: 'Highway Industrial Area',
    capacity: 500,
    address: 'Transport Nagar Phase 2',
    created_at: '2026-01-18T14:00:00Z',
    current_fill: 76.8,
    predicted_fill: 84.1,
    risk_level: 'High',
    last_collection: '2 days ago'
  },
  {
    id: 5,
    bin_id: 'BIN-GVD-501',
    latitude: 27.5112,
    longitude: 77.6589,
    location_zone: 'Govardhan Road',
    capacity: 240,
    address: 'Parikrama Marg Junction',
    created_at: '2026-01-20T08:00:00Z',
    current_fill: 65.4,
    predicted_fill: 72.0,
    risk_level: 'Medium',
    last_collection: '1 day ago'
  },
  {
    id: 6,
    bin_id: 'BIN-VRN-108',
    latitude: 27.4962,
    longitude: 77.6781,
    location_zone: 'Vishram Ghat',
    capacity: 240,
    address: 'Dwarkadhish Temple North Gate',
    created_at: '2026-01-22T12:00:00Z',
    current_fill: 52.0,
    predicted_fill: 59.5,
    risk_level: 'Medium',
    last_collection: 'Today'
  },
  {
    id: 7,
    bin_id: 'BIN-KRN-309',
    latitude: 27.4895,
    longitude: 77.6802,
    location_zone: 'Krishna Nagar',
    capacity: 240,
    address: 'Civil Lines Road, Block B',
    created_at: '2026-01-25T16:00:00Z',
    current_fill: 38.5,
    predicted_fill: 44.0,
    risk_level: 'Low',
    last_collection: 'Today'
  },
  {
    id: 8,
    bin_id: 'BIN-JNB-211',
    latitude: 27.5071,
    longitude: 77.6715,
    location_zone: 'Janmabhoomi',
    capacity: 360,
    address: 'Deeg Gate Parking Facility',
    created_at: '2026-01-28T07:30:00Z',
    current_fill: 29.0,
    predicted_fill: 35.2,
    risk_level: 'Low',
    last_collection: 'Today'
  }
];

export const MOCK_MAP_BINS: MapBin[] = MOCK_BINS.map((b) => ({
  bin_id: b.bin_id,
  latitude: b.latitude,
  longitude: b.longitude,
  zone: b.location_zone,
  address: b.address,
  current_fill: b.current_fill || 50,
  predicted_fill: b.predicted_fill || 60,
  overflow_probability: (b.predicted_fill || 50) > 85 ? 0.94 : (b.predicted_fill || 50) > 75 ? 0.76 : (b.predicted_fill || 50) > 50 ? 0.45 : 0.12,
  risk_level: b.risk_level || 'Medium',
  priority_score: (b.current_fill || 50) * 0.5 + (b.predicted_fill || 50) * 0.5,
  explanation: `Bin in ${b.location_zone} is at ${b.current_fill}% fill with rapid telemetry accrual.`
}));

export const MOCK_PRIORITY_ITEMS: PriorityItem[] = MOCK_BINS.slice(0, 5).map((b, idx) => ({
  rank: idx + 1,
  bin_id: b.bin_id,
  location: b.address || b.location_zone,
  zone: b.location_zone,
  latitude: b.latitude,
  longitude: b.longitude,
  current_fill: b.current_fill || 80,
  predicted_fill: b.predicted_fill || 90,
  overflow_probability: 0.92 - idx * 0.08,
  risk_level: (b.risk_level || 'High') as 'Critical' | 'High' | 'Medium' | 'Low',
  days_since_collection: idx === 0 ? 3 : 2,
  priority_score: 95 - idx * 6,
  action: idx < 2 ? 'Dispatch Immediate Evacuation' : 'Include in Next Route',
  explanation: `Sensor telemetry detects high fill volume in ${b.location_zone}.`
}));

export const MOCK_ALERTS: AlertItem[] = [
  {
    id: 1,
    bin_id: 'BIN-VRN-101',
    alert_type: 'CRITICAL_OVERFLOW',
    severity: 'Critical',
    message: 'Bin at Vishram Ghat Snan Steps is at 94.5% fill level.',
    is_resolved: false,
    created_at: '12 mins ago'
  },
  {
    id: 2,
    bin_id: 'BIN-JNB-204',
    alert_type: 'RAPID_FILL',
    severity: 'High',
    message: 'Pilgrim influx at Janmabhoomi Gate 3 causing accelerated waste inflow.',
    is_resolved: false,
    created_at: '35 mins ago'
  },
  {
    id: 3,
    bin_id: 'BIN-KRN-302',
    alert_type: 'PREDICTED_OVERFLOW',
    severity: 'High',
    message: 'Krishna Nagar Market bin projected to breach 90% within 3 hours.',
    is_resolved: false,
    created_at: '1 hour ago'
  }
];

export const MOCK_DASHBOARD: DashboardKPIs = {
  total_bins: 48,
  high_risk_bins: 11,
  medium_risk_bins: 18,
  low_risk_bins: 14,
  critical_risk_bins: 5,
  average_fill_level: 68.4,
  predicted_overflow_count: 7,
  active_alerts_count: 3,
  risk_distribution: {
    Critical: 5,
    High: 11,
    Medium: 18,
    Low: 14
  },
  zone_distribution: [
    { zone: 'Vishram Ghat', count: 12 },
    { zone: 'Janmabhoomi', count: 10 },
    { zone: 'Krishna Nagar', count: 11 },
    { zone: 'Highway Industrial Area', count: 8 },
    { zone: 'Govardhan Road', count: 7 }
  ],
  urgent_bins: MOCK_PRIORITY_ITEMS,
  recent_alerts: MOCK_ALERTS,
  model_status: {
    is_trained: true,
    model_type: 'GradientBoostingClassifier + RandomForestRegressor',
    last_trained: '2026-09-19',
    mae: 2.84,
    r2: 0.954
  }
};

export const MOCK_PRIORITIES: PriorityListResponse = {
  total_count: 48,
  items: MOCK_PRIORITY_ITEMS,
  route_preview: {
    total_bins: 5,
    total_estimated_distance_km: 14.8,
    estimated_travel_time_min: 42,
    estimated_fuel_liters: 6.2,
    depot_coordinates: { latitude: 27.4924, longitude: 77.6737, name: 'Mathura Municipal Depot' },
    disclaimer: 'Route optimized via TSP nearest neighbor heuristics across Mathura arterial roads.',
    stops: MOCK_BINS.slice(0, 5).map((b, idx) => ({
      sequence: idx + 1,
      bin_id: b.bin_id,
      zone: b.location_zone,
      latitude: b.latitude,
      longitude: b.longitude,
      risk_level: b.risk_level || 'High',
      priority_score: 95 - idx * 6,
      leg_distance_km: idx === 0 ? 0 : 2.8 + idx * 0.5
    }))
  }
};

export const MOCK_MODEL_PERFORMANCE: ModelPerformanceData = {
  models: [
    {
      id: 1,
      model_type: 'RandomForestRegressor',
      target_type: 'Regression (Fill Level %)',
      training_rows: 12600,
      mae: 2.84,
      rmse: 4.12,
      r2: 0.954,
      feature_importance: [
        { feature: 'current_fill_level', importance: 0.48 },
        { feature: 'days_since_collection', importance: 0.26 },
        { feature: 'location_zone', importance: 0.12 },
        { feature: 'event_flag', importance: 0.08 },
        { feature: 'weather', importance: 0.06 }
      ],
      created_at: '2026-09-19'
    },
    {
      id: 2,
      model_type: 'GradientBoostingClassifier',
      target_type: 'Classification (Risk Tier)',
      training_rows: 12600,
      accuracy: 0.942,
      f1: 0.938,
      precision: 0.945,
      recall: 0.932,
      confusion_matrix: [
        [142, 6, 2, 0],
        [5, 118, 8, 1],
        [1, 7, 184, 9],
        [0, 2, 8, 215]
      ],
      created_at: '2026-09-19'
    }
  ],
  active_regression_model: 'RandomForestRegressor (Trained)',
  active_classification_model: 'GradientBoostingClassifier (Trained)',
  actual_vs_predicted: [
    { timestamp: '10:00', bin_id: 'BIN-VRN-101', actual: 93, predicted: 94.5, error: 1.5 },
    { timestamp: '11:00', bin_id: 'BIN-JNB-204', actual: 86, predicted: 88.0, error: 2.0 },
    { timestamp: '12:00', bin_id: 'BIN-KRN-302', actual: 80, predicted: 81.2, error: 1.2 }
  ],
  residual_distribution: [
    { range: '-4 to -2%', count: 18 },
    { range: '-2 to 0%', count: 142 },
    { range: '0 to 2%', count: 156 },
    { range: '2 to 4%', count: 24 }
  ]
};

export const MOCK_EDA: EDAStats = {
  total_records: 12600,
  total_bins: 48,
  missing_values: 0,
  duplicate_rows: 0,
  date_range_start: '2025-10-01',
  date_range_end: '2026-03-31',
  avg_fill: 58.7,
  min_fill: 4.2,
  max_fill: 99.8,
  overflow_count: 624,
  overflow_percentage: 4.95,
  fill_distribution: [
    { range: '0-25%', count: 2100, percentage: 16.7 },
    { range: '26-50%', count: 3400, percentage: 27.0 },
    { range: '51-75%', count: 4200, percentage: 33.3 },
    { range: '76-90%', count: 1900, percentage: 15.1 },
    { range: '91-100%', count: 1000, percentage: 7.9 }
  ],
  zone_stats: [
    { zone: 'Vishram Ghat', count: 3150, avg_fill: 72.4, high_risk_count: 12 },
    { zone: 'Janmabhoomi', count: 2850, avg_fill: 69.1, high_risk_count: 10 },
    { zone: 'Krishna Nagar', count: 2700, avg_fill: 54.8, high_risk_count: 5 },
    { zone: 'Highway Industrial Area', count: 2100, avg_fill: 48.2, high_risk_count: 3 },
    { zone: 'Govardhan Road', count: 1800, avg_fill: 44.5, high_risk_count: 2 }
  ],
  day_of_week_stats: [
    { day: 'Mon', avg_fill: 54 },
    { day: 'Tue', avg_fill: 52 },
    { day: 'Wed', avg_fill: 55 },
    { day: 'Thu', avg_fill: 57 },
    { day: 'Fri', avg_fill: 64 },
    { day: 'Sat', avg_fill: 78 },
    { day: 'Sun', avg_fill: 84 }
  ],
  weather_stats: [
    { weather: 'Clear', avg_fill: 52.1, count: 6200 },
    { weather: 'Hot / Summer', avg_fill: 64.3, count: 3100 },
    { weather: 'Rain / Monsoon', avg_fill: 76.8, count: 2100 },
    { weather: 'Festival / Peak', avg_fill: 88.5, count: 1200 }
  ],
  event_stats: [
    { event: 'Normal Day', avg_fill: 54.2, count: 10400 },
    { event: 'Pilgrim Festival / Aarti', avg_fill: 84.6, count: 2200 }
  ],
  fill_vs_days_collection: [
    { days: '0 days', avg_fill: 22.4, overflow_rate: 0.01 },
    { days: '1 day', avg_fill: 48.6, overflow_rate: 0.04 },
    { days: '2 days', avg_fill: 74.2, overflow_rate: 0.18 },
    { days: '3+ days', avg_fill: 91.8, overflow_rate: 0.62 }
  ],
  time_series_trend: [
    { date: '2026-03-13', avg_fill: 54.2 },
    { date: '2026-03-14', avg_fill: 58.1 },
    { date: '2026-03-15', avg_fill: 62.4 },
    { date: '2026-03-16', avg_fill: 66.8 },
    { date: '2026-03-17', avg_fill: 71.3 },
    { date: '2026-03-18', avg_fill: 68.9 },
    { date: '2026-03-19', avg_fill: 68.4 }
  ]
};

export const MOCK_SETTINGS: AppSettings = {
  priority_weights: {
    predicted_fill: 0.4,
    overflow_prob: 0.3,
    days_since_collection: 0.2,
    current_fill: 0.1
  },
  risk_thresholds: {
    critical: 85,
    high: 70,
    medium: 50
  },
  prediction_horizon: '24 Hours',
  active_model: 'Ensemble (GBM + RF)'
};
