import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.session import engine, Base, SessionLocal
from app.models.entities import Bin, AppSetting
from app.api.endpoints import router as api_router, setup_demo_environment

# Create database tables automatically
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize default settings if missing
    db = SessionLocal()
    try:
        if db.query(AppSetting).count() == 0:
            defaults = [
                ("weight_predicted_fill", "0.50", "Weight for predicted fill level"),
                ("weight_overflow_prob", "0.25", "Weight for overflow probability"),
                ("weight_days_since_collection", "0.15", "Weight for days since last collection"),
                ("weight_current_fill", "0.10", "Weight for current fill level"),
                ("threshold_critical", "90.0", "Threshold for critical risk level"),
                ("threshold_high", "75.0", "Threshold for high risk level"),
                ("threshold_medium", "50.0", "Threshold for medium risk level"),
                ("prediction_horizon", "Next collection window (4 hrs)", "Prediction horizon window"),
                ("active_model", "RandomForestRegressor", "Active prediction model")
            ]
            for k, v, d in defaults:
                db.add(AppSetting(key=k, value=v, description=d))
            db.commit()

        # Check if database has any bins; if not, automatically run demo setup
        bin_count = db.query(Bin).count()
        if bin_count == 0:
            print("Database is empty. Automatically initializing demo data...")
            setup_demo_environment(db)
    except Exception as e:
        print(f"Startup initialization notice: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title="WasteWise AI",
    description="AI-powered Smart Waste Collection Priority Predictor API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": "WasteWise AI",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
