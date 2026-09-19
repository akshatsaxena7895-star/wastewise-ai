# WasteWise AI: AI-powered Smart Waste Collection Priority Predictor

> **Disclaimer**: This prototype uses synthetic and calibrated simulation data to demonstrate predictive waste collection prioritization. It does not represent real municipal road-network turn-by-turn route optimization.

---

## 1. Project Overview & Problem Statement

### The Problem
Traditional municipal waste management relies on fixed collection schedules. Garbage trucks drive rigid routes regardless of actual fill levels, wasting fuel, vehicle wear, and labor visiting half-empty bins, while high-density commercial or market bins overflow, causing litter, odors, and public health risks.

### The Solution
**WasteWise AI** forecasts bin fill levels and overflow probabilities for the upcoming collection window (e.g. next 4 hours) using Machine Learning. It converts multi-factor predictions into a ranked **Priority Collection List**, allowing dispatchers to focus fleet resources where urgency is highest.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 React + TypeScript Frontend                 │
│      (Tailwind CSS, Lucide Icons, Recharts, Leaflet Map)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend Service                  │
│       (/api/dashboard, /api/priorities, /api/predict, etc.) │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
┌──────────────▼──────────────┐ ┌──────────────▼──────────────┐
│   PostgreSQL / SQLite DB    │ │         ML Pipeline         │
│  (bins, readings, preds,    │ │ (Feature Eng, Scikit-learn, │
│   collections, model_runs)  │ │  LinearReg vs RandomForest) │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## 3. Core Features

1. **Smart City Operations Dashboard**: Real-time KPI cards (Total Bins, Critical/High Risk, Medium, Low, Average Fill, Predicted Overflows) derived directly from live database records.
2. **Interactive Map View**: Leaflet city map with risk-coded markers (Critical, High, Medium, Low), live vs predicted fill levels, depot base, and priority path overlay.
3. **Transparent Priority Engine**:
   $$\text{Priority Score} = 100 \times \left( 0.50 \cdot \frac{\text{PredFill}}{100} + 0.25 \cdot P(\text{Overflow}) + 0.15 \cdot \frac{\text{Days}}{7} + 0.10 \cdot \frac{\text{CurrFill}}{100} \right)$$
   Categorized into Critical ($\ge 90$), High ($75-89$), Medium ($50-74$), and Low ($< 50$).
4. **Simple Priority-Based Route Ordering (Stretch Goal)**: Nearest-neighbor heuristic calculating estimated travel distance, duration, and fuel consumption starting and ending at the Central Depot.
5. **Machine Learning Model Comparison**:
   - **Baseline**: Linear Regression
   - **Champion**: Random Forest Regressor & Classifier
   - Real metrics calculated on chronological test split: MAE, RMSE, $R^2$, Accuracy, Precision, Recall, F1, Feature Importances, Residual Distribution, and Actual vs. Predicted time series.
6. **Exploratory Data Analysis (EDA)**: 10 diagnostic charts including fill distribution, zone generation rates, day-of-week surges, weather impacts, and longitudinal trends.
7. **Data Management Center**:
   - Upload CSV/XLSX with schema validation and error reporting.
   - Realistic Synthetic Data Generator with zone profiles, event spikes, rain dampening, and collection resets.
   - Manual sensor telemetry entry (single and batch).
   - Paginated historical data table with search and filtering.
8. **1-Click Demo Mode**: Automatically seeds data, trains models, evaluates metrics, and generates live predictions with one click.
9. **Hackathon Presentation Mode**: Integrated slide view highlighting Problem, Solution, AI Architecture, and Projected Impact.

---

## 4. Machine Learning & Feature Engineering

### Feature Engineering
To prevent data leakage, records are sorted chronologically per bin before extracting:
- **Temporal**: `hour`, `day_of_week`, `day_of_month`, `month`, `is_weekend`, `day_type`.
- **Lag Features**: Fill level lag $t-1$ (`fill_lag_1`) and $t-2$ (`fill_lag_2`).
- **Rolling Aggregations**: 3-period and 7-period rolling mean fill levels.
- **Operational**: `days_since_collection`.
- **Environmental**: Categorical one-hot encoding for `location_zone` (Market, Commercial, Residential, IT Park, Industrial, Mixed) and `weather` (Clear, Overcast, Rain, Storm), and boolean for `event_flag`.

### Model Comparison
- **Linear Regression**: Fast linear baseline (MAE $\approx 12.6\%$).
- **Random Forest Regressor**: 100 decision trees capturing non-linear zone dynamics and weekend spikes (MAE $\approx 7.8\%$, $R^2 \approx 0.53$).
- **Random Forest Classifier**: Predicts overflow binary risk ($\ge 90\%$ fill) with balanced class weights (F1 $\approx 0.82$).

---

## 5. Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Navigate to project root
cd project

# Install Python requirements
pip install -r backend/requirements.txt

# Start FastAPI backend (port 8000)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API documentation is available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
```bash
# In a separate terminal, navigate to frontend
cd project/frontend

# Install dependencies (already installed if cloned with dependencies)
npm install

# Start Vite dev server (port 5173)
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. One-Click Demo Instructions

1. Open `http://localhost:5173/` in your browser.
2. Click the **"1-Click Demo Mode"** button in the top right header.
3. The system will automatically:
   - Ingest simulated sensor readings across 60 smart city bins.
   - Run chronological feature engineering.
   - Train Linear Regression and Random Forest models.
   - Evaluate performance metrics (MAE, RMSE, $R^2$, F1).
   - Generate next-cycle fill predictions and overflow probabilities.
   - Rank the Priority Collection Queue and display risk markers on the Map.
4. Explore the **Priority List**, **Interactive Map**, **Model Performance**, and **EDA Analytics** tabs!

---

## 7. Limitations & Future Scope

- **Simulation**: Uses realistic synthetic data and sensor simulation rather than live municipal hardware.
- **Route Optimization**: Uses straight-line Haversine nearest-neighbor heuristic as an illustrative estimate. Future iterations will integrate OpenStreetMap / OSRM for street-network turn-by-turn routing with traffic constraints.
- **Dynamic Fleet Allocation**: Multi-vehicle routing with truck capacity limits (Capacitated Vehicle Routing Problem).
