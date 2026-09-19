import os
import io
import csv
from datetime import datetime, timedelta
from typing import List, Optional
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from backend.app.database.session import get_db
from backend.app.models.entities import (
    Bin,
    SensorReading,
    Collection,
    Prediction,
    ModelRun,
    AppSetting,
    Alert,
)
from backend.app.schemas.schemas import (
    BinCreate,
    BinResponse,
    SensorReadingCreate,
    BulkReadingCreate,
    SensorReadingResponse,
    SinglePredictRequest,
    SinglePredictResponse,
    TrainModelRequest,
    ModelRunResponse,
    ModelComparisonResponse,
    PriorityItemResponse,
    PriorityListResponse,
    SimpleRouteResponse,
    EDAStatsResponse,
    SyntheticGenerateRequest,
    UploadValidationResponse,
    DashboardKPIResponse,
    AlertResponse,
    AppSettingsSchema
)
from backend.app.services.synthetic_generator import generate_synthetic_dataset
from backend.app.services.data_service import (
    get_eda_statistics,
    validate_uploaded_data,
    import_dataframe_to_db,
)
from backend.app.ml.pipeline import pipeline, MODELS_DIR
from backend.app.services.priority_engine import (
    calculate_priority_score,
    DEFAULT_WEIGHTS,
    DEFAULT_THRESHOLDS,
)
from backend.app.services.route_optimizer import compute_priority_route

router = APIRouter()

# ----------------- Helper Functions -----------------
def get_current_settings(db: Session) -> dict:
    weights = DEFAULT_WEIGHTS.copy()
    thresholds = DEFAULT_THRESHOLDS.copy()
    horizon = "Next collection window (4 hrs)"
    active_model = "RandomForestRegressor"

    settings = db.query(AppSetting).all()
    for s in settings:
        if s.key == "weight_predicted_fill":
            weights["predicted_fill"] = float(s.value)
        elif s.key == "weight_overflow_prob":
            weights["overflow_prob"] = float(s.value)
        elif s.key == "weight_days_since_collection":
            weights["days_since_collection"] = float(s.value)
        elif s.key == "weight_current_fill":
            weights["current_fill"] = float(s.value)
        elif s.key == "threshold_critical":
            thresholds["critical"] = float(s.value)
        elif s.key == "threshold_high":
            thresholds["high"] = float(s.value)
        elif s.key == "threshold_medium":
            thresholds["medium"] = float(s.value)
        elif s.key == "prediction_horizon":
            horizon = s.value
        elif s.key == "active_model":
            active_model = s.value

    return {
        "weights": weights,
        "thresholds": thresholds,
        "horizon": horizon,
        "active_model": active_model
    }

# ----------------- Bins Endpoints -----------------
@router.get("/bins", response_model=List[BinResponse])
def get_bins(zone: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Bin)
    if zone:
        query = query.filter(Bin.location_zone == zone)
    bins = query.all()
    
    # Enrich with latest reading and prediction
    results = []
    for b in bins:
        latest_reading = db.query(SensorReading).filter(
            SensorReading.bin_id == b.bin_id
        ).order_by(desc(SensorReading.timestamp)).first()
        
        latest_pred = db.query(Prediction).filter(
            Prediction.bin_id == b.bin_id
        ).order_by(desc(Prediction.prediction_time)).first()

        latest_col = db.query(Collection).filter(
            Collection.bin_id == b.bin_id
        ).order_by(desc(Collection.collection_time)).first()

        results.append(BinResponse(
            id=b.id,
            bin_id=b.bin_id,
            latitude=b.latitude,
            longitude=b.longitude,
            location_zone=b.location_zone,
            capacity=b.capacity,
            address=b.address,
            created_at=b.created_at,
            current_fill=latest_reading.fill_level if latest_reading else 0.0,
            predicted_fill=latest_pred.predicted_fill_level if latest_pred else (latest_reading.fill_level if latest_reading else 0.0),
            risk_level=latest_pred.risk_level if latest_pred else "Low",
            last_collection=latest_col.collection_time if latest_col else None
        ))
    return results

@router.post("/bins", response_model=BinResponse)
def create_bin(bin_in: BinCreate, db: Session = Depends(get_db)):
    existing = db.query(Bin).filter(Bin.bin_id == bin_in.bin_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Bin with ID {bin_in.bin_id} already exists.")
    
    new_bin = Bin(
        bin_id=bin_in.bin_id,
        latitude=bin_in.latitude,
        longitude=bin_in.longitude,
        location_zone=bin_in.location_zone,
        capacity=bin_in.capacity,
        address=bin_in.address or f"{bin_in.location_zone} Point"
    )
    db.add(new_bin)
    db.commit()
    db.refresh(new_bin)
    
    # Create initial sensor reading
    initial_reading = SensorReading(
        bin_id=new_bin.bin_id,
        timestamp=datetime.utcnow(),
        fill_level=15.0,
        weather="Clear",
        event_flag=False,
        day_type="Weekday"
    )
    db.add(initial_reading)
    db.commit()

    return BinResponse(
        id=new_bin.id,
        bin_id=new_bin.bin_id,
        latitude=new_bin.latitude,
        longitude=new_bin.longitude,
        location_zone=new_bin.location_zone,
        capacity=new_bin.capacity,
        address=new_bin.address,
        created_at=new_bin.created_at,
        current_fill=15.0,
        predicted_fill=20.0,
        risk_level="Low",
        last_collection=None
    )

# ----------------- Sensor Readings -----------------
@router.get("/readings")
def get_readings(
    bin_id: Optional[str] = None,
    zone: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=5, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(SensorReading)
    if bin_id:
        query = query.filter(SensorReading.bin_id == bin_id)
    if zone:
        bin_ids = [b.bin_id for b in db.query(Bin).filter(Bin.location_zone == zone).all()]
        query = query.filter(SensorReading.bin_id.in_(bin_ids))
    
    total = query.count()
    records = query.order_by(desc(SensorReading.timestamp)).offset((page - 1) * page_size).limit(page_size).all()
    
    bins_map = {b.bin_id: b.location_zone for b in db.query(Bin).all()}
    
    items = []
    for r in records:
        items.append({
            "id": r.id,
            "bin_id": r.bin_id,
            "timestamp": r.timestamp.isoformat(),
            "fill_level": r.fill_level,
            "zone": bins_map.get(r.bin_id, "Mixed"),
            "weather": r.weather,
            "event_flag": r.event_flag,
            "day_type": r.day_type
        })
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "records": items
    }

@router.post("/readings", response_model=SensorReadingResponse)
def add_reading(reading_in: SensorReadingCreate, db: Session = Depends(get_db)):
    bin_obj = db.query(Bin).filter(Bin.bin_id == reading_in.bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail=f"Bin {reading_in.bin_id} not found.")

    new_reading = SensorReading(
        bin_id=reading_in.bin_id,
        timestamp=reading_in.timestamp,
        fill_level=reading_in.fill_level,
        weather=reading_in.weather,
        event_flag=reading_in.event_flag,
        day_type=reading_in.day_type
    )
    db.add(new_reading)
    
    # If high fill, trigger alert
    if reading_in.fill_level >= 90.0:
        alert = Alert(
            bin_id=reading_in.bin_id,
            alert_type="CRITICAL_FILL",
            severity="Critical",
            message=f"Bin {reading_in.bin_id} reached critical fill level of {reading_in.fill_level}%."
        )
        db.add(alert)

    db.commit()
    db.refresh(new_reading)
    return new_reading

@router.post("/readings/bulk")
def add_readings_bulk(bulk_in: BulkReadingCreate, db: Session = Depends(get_db)):
    readings = [
        SensorReading(
            bin_id=r.bin_id,
            timestamp=r.timestamp,
            fill_level=r.fill_level,
            weather=r.weather,
            event_flag=r.event_flag,
            day_type=r.day_type
        )
        for r in bulk_in.readings
    ]
    db.bulk_save_objects(readings)
    db.commit()
    return {"status": "success", "count": len(readings)}

# ----------------- Data Management & Upload -----------------
@router.post("/data/upload", response_model=UploadValidationResponse)
async def upload_dataset_file(file: UploadFile = File(...)):
    contents = await file.read()
    res = validate_uploaded_data(contents, file.filename)
    return res

@router.post("/data/import")
async def import_uploaded_data(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    val = validate_uploaded_data(contents, file.filename)
    if not val["is_valid"]:
        raise HTTPException(status_code=400, detail="Uploaded file failed validation. Fix errors first.")
    
    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))
        
    num_bins, num_readings = import_dataframe_to_db(df, db)
    return {
        "status": "success",
        "bins_created": num_bins,
        "readings_imported": num_readings
    }

@router.post("/data/generate")
def generate_synthetic_data(req: SyntheticGenerateRequest, db: Session = Depends(get_db)):
    df, bins_data, collections_data = generate_synthetic_dataset(
        num_bins=req.num_bins,
        num_days=req.num_days,
        readings_per_day=req.readings_per_day,
        zones=req.zones,
        include_weather=req.include_weather,
        include_events=req.include_events,
        add_noise=req.add_noise
    )
    
    # Save into DB
    num_bins, num_readings = import_dataframe_to_db(df, db)
    return {
        "status": "success",
        "bins_created": num_bins,
        "readings_generated": num_readings,
        "sample_preview": df.head(10).to_dict(orient="records")
    }

@router.get("/data/stats", response_model=EDAStatsResponse)
def get_eda_stats(zone: Optional[str] = None, bin_id: Optional[str] = None, db: Session = Depends(get_db)):
    stats = get_eda_statistics(db, zone=zone, bin_id=bin_id)
    return stats

# ----------------- Machine Learning Endpoints -----------------
@router.post("/ml/train")
def train_models(req: TrainModelRequest = None, db: Session = Depends(get_db)):
    # Fetch all readings from database
    readings = db.query(SensorReading).all()
    if len(readings) < 50:
        raise HTTPException(
            status_code=400,
            detail=f"Database only contains {len(readings)} readings. Need at least 50 readings to train. Please generate or import data first."
        )
    
    bins_map = {b.bin_id: b.location_zone for b in db.query(Bin).all()}
    records = []
    for r in readings:
        records.append({
            "bin_id": r.bin_id,
            "timestamp": r.timestamp,
            "fill_level": r.fill_level,
            "location_zone": bins_map.get(r.bin_id, "Mixed"),
            "weather": r.weather or "Clear",
            "event_flag": 1 if r.event_flag else 0,
            "day_type": r.day_type or "Weekday"
        })
    raw_df = pd.DataFrame(records)

    test_size = req.test_size if req else 0.2
    results = pipeline.train_and_evaluate(raw_df, test_size=test_size)

    # Record model runs in DB
    run_lr = ModelRun(
        model_type="LinearRegression",
        target_type="fill_level",
        training_rows=results["training_rows"],
        mae=results["lr_metrics"]["mae"],
        rmse=results["lr_metrics"]["rmse"],
        r2=results["lr_metrics"]["r2"],
        actual_vs_predicted=results["actual_vs_predicted"]
    )
    db.add(run_lr)

    run_rf = ModelRun(
        model_type="RandomForestRegressor",
        target_type="fill_level",
        training_rows=results["training_rows"],
        mae=results["rf_metrics"]["mae"],
        rmse=results["rf_metrics"]["rmse"],
        r2=results["rf_metrics"]["r2"],
        feature_importance=results["feature_importance"],
        actual_vs_predicted=results["actual_vs_predicted"],
        residuals=results["residual_distribution"]
    )
    db.add(run_rf)

    run_clf = ModelRun(
        model_type="RandomForestClassifier",
        target_type="overflow",
        training_rows=results["training_rows"],
        accuracy=results["clf_metrics"]["accuracy"],
        precision=results["clf_metrics"]["precision"],
        recall=results["clf_metrics"]["recall"],
        f1=results["clf_metrics"]["f1"],
        confusion_matrix=results["clf_metrics"]["confusion_matrix"]
    )
    db.add(run_clf)
    db.commit()

    # Automatically generate predictions for all bins
    predict_all_bins(db)

    return {
        "status": "success",
        "training_rows": results["training_rows"],
        "linear_regression": results["lr_metrics"],
        "random_forest_regressor": results["rf_metrics"],
        "random_forest_classifier": results["clf_metrics"],
        "feature_importance": results["feature_importance"]
    }

@router.get("/ml/performance")
def get_ml_performance(db: Session = Depends(get_db)):
    runs = db.query(ModelRun).order_by(desc(ModelRun.created_at)).limit(10).all()
    if not runs:
        # Check if saved model exists
        meta_file = os.path.join(MODELS_DIR, "metadata.json")
        if os.path.exists(meta_file):
            import json
            with open(meta_file, "r") as f:
                saved = json.load(f)
            return {
                "models": [],
                "active_regression_model": "RandomForestRegressor",
                "active_classification_model": "RandomForestClassifier",
                "metadata": saved
            }
        return {
            "models": [],
            "active_regression_model": "None",
            "active_classification_model": "None",
            "actual_vs_predicted": [],
            "residual_distribution": []
        }

    latest_rf = next((r for r in runs if r.model_type == "RandomForestRegressor"), None)
    actual_vs_pred = latest_rf.actual_vs_predicted if latest_rf else []
    residuals = latest_rf.residuals if latest_rf else []

    model_responses = [
        ModelRunResponse(
            id=r.id,
            model_type=r.model_type,
            target_type=r.target_type,
            training_rows=r.training_rows,
            mae=round(r.mae, 2) if r.mae is not None else None,
            rmse=round(r.rmse, 2) if r.rmse is not None else None,
            r2=round(r.r2, 3) if r.r2 is not None else None,
            f1=round(r.f1, 3) if r.f1 is not None else None,
            accuracy=round(r.accuracy, 3) if r.accuracy is not None else None,
            precision=round(r.precision, 3) if r.precision is not None else None,
            recall=round(r.recall, 3) if r.recall is not None else None,
            feature_importance=r.feature_importance,
            confusion_matrix=r.confusion_matrix,
            created_at=r.created_at
        )
        for r in runs
    ]

    return {
        "models": model_responses,
        "active_regression_model": "RandomForestRegressor",
        "active_classification_model": "RandomForestClassifier",
        "actual_vs_predicted": actual_vs_pred,
        "residual_distribution": residuals
    }

# ----------------- Predictions & Priorities -----------------
@router.post("/predict", response_model=SinglePredictResponse)
def predict_single_bin(req: SinglePredictRequest, db: Session = Depends(get_db)):
    pred_fill, overflow_prob = pipeline.predict_single(
        current_fill=req.current_fill_level,
        zone=req.location_zone,
        days_since_collection=req.days_since_collection,
        weather=req.weather or "Clear",
        event_flag=req.event_flag or False,
        day_type=req.day_type or "Weekday"
    )

    settings = get_current_settings(db)
    score, risk, explanation = calculate_priority_score(
        predicted_fill=pred_fill,
        overflow_prob=overflow_prob,
        days_since_collection=req.days_since_collection,
        current_fill=req.current_fill_level,
        weights=settings["weights"],
        thresholds=settings["thresholds"]
    )

    return SinglePredictResponse(
        bin_id=req.bin_id,
        current_fill_level=req.current_fill_level,
        predicted_fill_level=pred_fill,
        overflow_probability=overflow_prob,
        risk_level=risk,
        priority_score=score,
        explanation=explanation,
        factors={
            "predicted_fill_weight": settings["weights"]["predicted_fill"],
            "overflow_prob_weight": settings["weights"]["overflow_prob"],
            "days_since_weight": settings["weights"]["days_since_collection"],
            "current_fill_weight": settings["weights"]["current_fill"]
        }
    )

def predict_all_bins(db: Session):
    """Internal helper to compute next-cycle predictions for all bins in DB."""
    bins = db.query(Bin).all()
    if not bins:
        return []

    settings = get_current_settings(db)
    new_predictions = []

    for b in bins:
        # Latest reading
        latest_reading = db.query(SensorReading).filter(
            SensorReading.bin_id == b.bin_id
        ).order_by(desc(SensorReading.timestamp)).first()
        
        curr_fill = latest_reading.fill_level if latest_reading else 20.0
        weather = latest_reading.weather if latest_reading else "Clear"
        event = latest_reading.event_flag if latest_reading else False
        day_type = latest_reading.day_type if latest_reading else "Weekday"

        # Days since collection
        latest_col = db.query(Collection).filter(
            Collection.bin_id == b.bin_id
        ).order_by(desc(Collection.collection_time)).first()
        
        if latest_col:
            days = (datetime.utcnow() - latest_col.collection_time).total_seconds() / 86400.0
        else:
            days = 2.0

        pred_fill, overflow_prob = pipeline.predict_single(
            current_fill=curr_fill,
            zone=b.location_zone,
            days_since_collection=days,
            weather=weather,
            event_flag=event,
            day_type=day_type
        )

        score, risk, explanation = calculate_priority_score(
            predicted_fill=pred_fill,
            overflow_prob=overflow_prob,
            days_since_collection=days,
            current_fill=curr_fill,
            weights=settings["weights"],
            thresholds=settings["thresholds"]
        )

        pred_obj = Prediction(
            bin_id=b.bin_id,
            prediction_time=datetime.utcnow() + timedelta(hours=4),
            predicted_fill_level=pred_fill,
            overflow_probability=overflow_prob,
            risk_level=risk,
            priority_score=score,
            model_version="v1.0-rf",
            explanation=explanation
        )
        new_predictions.append(pred_obj)

        # Check if alert needed
        if risk in ["Critical", "High"] and overflow_prob >= 0.80:
            existing_alert = db.query(Alert).filter(
                Alert.bin_id == b.bin_id,
                Alert.is_resolved == False
            ).first()
            if not existing_alert:
                db.add(Alert(
                    bin_id=b.bin_id,
                    alert_type="OVERFLOW_RISK",
                    severity=risk,
                    message=f"{b.bin_id} ({b.location_zone}): {int(overflow_prob*100)}% overflow risk in next window ({pred_fill:.0f}% fill)."
                ))

    # Clear old predictions and save fresh ones
    db.query(Prediction).delete()
    db.bulk_save_objects(new_predictions)
    db.commit()
    return new_predictions

@router.post("/predict/all")
def generate_all_predictions(db: Session = Depends(get_db)):
    preds = predict_all_bins(db)
    return {"status": "success", "predictions_generated": len(preds)}

@router.get("/priorities", response_model=PriorityListResponse)
def get_priority_list(
    zone: Optional[str] = None,
    risk: Optional[str] = None,
    include_route: bool = True,
    db: Session = Depends(get_db)
):
    # Ensure we have predictions
    pred_count = db.query(Prediction).count()
    if pred_count == 0:
        predict_all_bins(db)

    query = db.query(Prediction, Bin).join(Bin, Prediction.bin_id == Bin.bin_id)
    if zone:
        query = query.filter(Bin.location_zone == zone)
    if risk:
        query = query.filter(Prediction.risk_level == risk)

    results = query.order_by(desc(Prediction.priority_score)).all()

    items = []
    route_candidates = []

    for rank, (pred, b) in enumerate(results, start=1):
        latest_reading = db.query(SensorReading).filter(
            SensorReading.bin_id == b.bin_id
        ).order_by(desc(SensorReading.timestamp)).first()
        curr_fill = latest_reading.fill_level if latest_reading else 20.0

        latest_col = db.query(Collection).filter(
            Collection.bin_id == b.bin_id
        ).order_by(desc(Collection.collection_time)).first()
        
        last_col_str = latest_col.collection_time.strftime("%b %d") if latest_col else "3 days ago"
        days_since = round((datetime.utcnow() - latest_col.collection_time).total_seconds() / 86400.0, 1) if latest_col else 3.0

        action = "Immediate Dispatch" if pred.risk_level == "Critical" else (
            "Next Shift" if pred.risk_level == "High" else (
                "Monitor" if pred.risk_level == "Medium" else "Routine Schedule"
            )
        )

        item = PriorityItemResponse(
            rank=rank,
            bin_id=b.bin_id,
            location=b.address or f"{b.location_zone} St",
            zone=b.location_zone,
            latitude=b.latitude,
            longitude=b.longitude,
            current_fill=curr_fill,
            predicted_fill=pred.predicted_fill_level,
            overflow_probability=pred.overflow_probability,
            risk_level=pred.risk_level,
            last_collection=last_col_str,
            days_since_collection=days_since,
            priority_score=pred.priority_score,
            action=action,
            explanation=pred.explanation or "Priority based on predicted fill and collection interval."
        )
        items.append(item)

        route_candidates.append({
            "bin_id": b.bin_id,
            "zone": b.location_zone,
            "latitude": b.latitude,
            "longitude": b.longitude,
            "risk_level": pred.risk_level,
            "priority_score": pred.priority_score
        })

    route_preview = None
    if include_route and route_candidates:
        route_preview = compute_priority_route(route_candidates, max_stops=20)

    return PriorityListResponse(
        total_count=len(items),
        items=items,
        route_preview=route_preview
    )

# ----------------- Map & Geo View -----------------
@router.get("/map")
def get_map_data(zone: Optional[str] = None, db: Session = Depends(get_db)):
    bins = db.query(Bin).all()
    if zone:
        bins = [b for b in bins if b.location_zone == zone]

    markers = []
    for b in bins:
        latest_reading = db.query(SensorReading).filter(
            SensorReading.bin_id == b.bin_id
        ).order_by(desc(SensorReading.timestamp)).first()
        curr_fill = latest_reading.fill_level if latest_reading else 25.0

        latest_pred = db.query(Prediction).filter(
            Prediction.bin_id == b.bin_id
        ).order_by(desc(Prediction.prediction_time)).first()

        risk = latest_pred.risk_level if latest_pred else ("High" if curr_fill >= 75 else "Low")
        score = latest_pred.priority_score if latest_pred else curr_fill
        pred_fill = latest_pred.predicted_fill_level if latest_pred else curr_fill

        markers.append({
            "bin_id": b.bin_id,
            "latitude": b.latitude,
            "longitude": b.longitude,
            "zone": b.location_zone,
            "address": b.address,
            "current_fill": curr_fill,
            "predicted_fill": pred_fill,
            "overflow_probability": latest_pred.overflow_probability if latest_pred else 0.1,
            "risk_level": risk,
            "priority_score": score,
            "explanation": latest_pred.explanation if latest_pred else "Normal"
        })
    return {"bins": markers, "depot": {"latitude": 27.4924, "longitude": 77.6737, "name": "Mathura Nagar Nigam Central Depot"}}

# ----------------- Alerts -----------------
@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(resolved: bool = False, db: Session = Depends(get_db)):
    alerts = db.query(Alert).filter(Alert.is_resolved == resolved).order_by(desc(Alert.created_at)).all()
    return alerts

@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.is_resolved = True
    db.commit()
    return {"status": "success", "alert_id": alert_id, "is_resolved": True}

# ----------------- Settings -----------------
@router.get("/settings", response_model=AppSettingsSchema)
def get_settings(db: Session = Depends(get_db)):
    s = get_current_settings(db)
    return AppSettingsSchema(
        priority_weights=s["weights"],
        risk_thresholds=s["thresholds"],
        prediction_horizon=s["horizon"],
        active_model=s["active_model"]
    )

@router.post("/settings")
def update_settings(new_settings: AppSettingsSchema, db: Session = Depends(get_db)):
    # Validate weights sum to 100% (within 0.01 tolerance)
    w = new_settings.priority_weights
    w_sum = w.predicted_fill + w.overflow_prob + w.days_since_collection + w.current_fill
    if abs(w_sum - 1.0) > 0.02 and abs(w_sum - 100.0) > 2.0:
        raise HTTPException(status_code=400, detail=f"Priority weights must sum to 100% (or 1.0). Current sum: {w_sum}")

    # Normalize weights to 0.0 - 1.0
    if w_sum > 2.0:
        w.predicted_fill /= 100.0
        w.overflow_prob /= 100.0
        w.days_since_collection /= 100.0
        w.current_fill /= 100.0

    settings_map = {
        "weight_predicted_fill": str(w.predicted_fill),
        "weight_overflow_prob": str(w.overflow_prob),
        "weight_days_since_collection": str(w.days_since_collection),
        "weight_current_fill": str(w.current_fill),
        "threshold_critical": str(new_settings.risk_thresholds.critical),
        "threshold_high": str(new_settings.risk_thresholds.high),
        "threshold_medium": str(new_settings.risk_thresholds.medium),
        "prediction_horizon": new_settings.prediction_horizon,
        "active_model": new_settings.active_model
    }

    for key, val in settings_map.items():
        record = db.query(AppSetting).filter(AppSetting.key == key).first()
        if record:
            record.value = val
        else:
            db.add(AppSetting(key=key, value=val))
    db.commit()

    # Recompute predictions with new weights
    predict_all_bins(db)
    return {"status": "success", "message": "Settings updated and priorities recalculated."}

# ----------------- Dashboard KPIs -----------------
@router.get("/dashboard", response_model=DashboardKPIResponse)
def get_dashboard_kpis(zone: Optional[str] = None, db: Session = Depends(get_db)):
    bins_query = db.query(Bin)
    if zone:
        bins_query = bins_query.filter(Bin.location_zone == zone)
    all_bins = bins_query.all()
    total_bins = len(all_bins)

    if total_bins == 0:
        return DashboardKPIResponse(
            total_bins=0,
            high_risk_bins=0,
            medium_risk_bins=0,
            low_risk_bins=0,
            critical_risk_bins=0,
            average_fill_level=0.0,
            predicted_overflow_count=0,
            active_alerts_count=0,
            risk_distribution={"Critical": 0, "High": 0, "Medium": 0, "Low": 0},
            zone_distribution=[],
            urgent_bins=[],
            recent_alerts=[],
            model_status={"is_trained": False, "model_type": "None"}
        )

    bin_ids = [b.bin_id for b in all_bins]
    
    # Fetch latest predictions
    preds = db.query(Prediction).filter(Prediction.bin_id.in_(bin_ids)).all()
    if not preds:
        preds = predict_all_bins(db)
        preds = [p for p in preds if p.bin_id in bin_ids]

    crit_count = sum(1 for p in preds if p.risk_level == "Critical")
    high_count = sum(1 for p in preds if p.risk_level == "High")
    med_count = sum(1 for p in preds if p.risk_level == "Medium")
    low_count = sum(1 for p in preds if p.risk_level == "Low")
    overflow_count = sum(1 for p in preds if p.predicted_fill_level >= 90.0)

    # Average Fill
    latest_readings = []
    for b_id in bin_ids:
        r = db.query(SensorReading.fill_level).filter(SensorReading.bin_id == b_id).order_by(desc(SensorReading.timestamp)).first()
        if r:
            latest_readings.append(r[0])
    avg_fill = round(float(sum(latest_readings) / len(latest_readings)), 1) if latest_readings else 0.0

    # Zone distribution
    zone_counts = {}
    for b in all_bins:
        zone_counts[b.location_zone] = zone_counts.get(b.location_zone, 0) + 1
    zone_dist = [{"zone": k, "count": v} for k, v in zone_counts.items()]

    # Urgent Bins (Top 5 highest priority)
    urgent_preds = sorted(preds, key=lambda x: x.priority_score, reverse=True)[:5]
    urgent_items = []
    for rank, p in enumerate(urgent_preds, start=1):
        b_obj = next((b for b in all_bins if b.bin_id == p.bin_id), None)
        latest_r = db.query(SensorReading.fill_level).filter(SensorReading.bin_id == p.bin_id).order_by(desc(SensorReading.timestamp)).first()
        curr = latest_r[0] if latest_r else 50.0
        urgent_items.append(PriorityItemResponse(
            rank=rank,
            bin_id=p.bin_id,
            location=b_obj.address if b_obj else "Zone Center",
            zone=b_obj.location_zone if b_obj else "Mixed",
            latitude=b_obj.latitude if b_obj else BASE_LAT,
            longitude=b_obj.longitude if b_obj else BASE_LNG,
            current_fill=curr,
            predicted_fill=p.predicted_fill_level,
            overflow_probability=p.overflow_probability,
            risk_level=p.risk_level,
            last_collection="Yesterday",
            days_since_collection=2.5,
            priority_score=p.priority_score,
            action="Dispatch Truck",
            explanation=p.explanation or "High fill rate"
        ))

    # Recent Alerts
    alerts = db.query(Alert).filter(Alert.is_resolved == False).order_by(desc(Alert.created_at)).limit(5).all()
    alert_resps = [
        AlertResponse(
            id=a.id,
            bin_id=a.bin_id,
            alert_type=a.alert_type,
            severity=a.severity,
            message=a.message,
            is_resolved=a.is_resolved,
            created_at=a.created_at
        ) for a in alerts
    ]

    latest_run = db.query(ModelRun).order_by(desc(ModelRun.created_at)).first()
    model_status = {
        "is_trained": latest_run is not None,
        "model_type": latest_run.model_type if latest_run else "Not Trained",
        "last_trained": latest_run.created_at.isoformat() if latest_run else None,
        "mae": latest_run.mae if latest_run else None,
        "r2": latest_run.r2 if latest_run else None
    }

    return DashboardKPIResponse(
        total_bins=total_bins,
        high_risk_bins=high_count,
        medium_risk_bins=med_count,
        low_risk_bins=low_count,
        critical_risk_bins=crit_count,
        average_fill_level=avg_fill,
        predicted_overflow_count=overflow_count,
        active_alerts_count=len(alerts),
        risk_distribution={
            "Critical": crit_count,
            "High": high_count,
            "Medium": med_count,
            "Low": low_count
        },
        zone_distribution=zone_dist,
        urgent_bins=urgent_items,
        recent_alerts=alert_resps,
        model_status=model_status
    )

# ----------------- CSV Exports -----------------
@router.get("/export/{data_type}")
def export_csv_data(data_type: str, db: Session = Depends(get_db)):
    output = io.StringIO()
    writer = csv.writer(output)

    if data_type == "priority":
        writer.writerow(["Rank", "Bin_ID", "Zone", "Current_Fill_%", "Predicted_Fill_%", "Overflow_Prob_%", "Risk_Level", "Priority_Score", "Action", "Explanation"])
        preds = db.query(Prediction, Bin).join(Bin, Prediction.bin_id == Bin.bin_id).order_by(desc(Prediction.priority_score)).all()
        for idx, (p, b) in enumerate(preds, start=1):
            latest_r = db.query(SensorReading.fill_level).filter(SensorReading.bin_id == b.bin_id).order_by(desc(SensorReading.timestamp)).first()
            curr = latest_r[0] if latest_r else 0.0
            action = "Immediate Dispatch" if p.risk_level == "Critical" else ("Next Shift" if p.risk_level == "High" else "Monitor")
            writer.writerow([idx, b.bin_id, b.location_zone, curr, p.predicted_fill_level, int(p.overflow_probability * 100), p.risk_level, p.priority_score, action, p.explanation])
        filename = f"wastewise_priority_list_{datetime.utcnow().strftime('%Y%m%d')}.csv"

    elif data_type == "dataset":
        writer.writerow(["Bin_ID", "Timestamp", "Fill_Level_%", "Zone", "Weather", "Event_Flag", "Day_Type"])
        readings = db.query(SensorReading).order_by(desc(SensorReading.timestamp)).limit(5000).all()
        bins_map = {b.bin_id: b.location_zone for b in db.query(Bin).all()}
        for r in readings:
            writer.writerow([r.bin_id, r.timestamp.isoformat(), r.fill_level, bins_map.get(r.bin_id, "Mixed"), r.weather, r.event_flag, r.day_type])
        filename = f"wastewise_dataset_{datetime.utcnow().strftime('%Y%m%d')}.csv"

    elif data_type == "predictions":
        writer.writerow(["Bin_ID", "Prediction_Time", "Predicted_Fill_%", "Overflow_Probability", "Risk_Level", "Priority_Score", "Model_Version"])
        preds = db.query(Prediction).all()
        for p in preds:
            writer.writerow([p.bin_id, p.prediction_time.isoformat(), p.predicted_fill_level, p.overflow_probability, p.risk_level, p.priority_score, p.model_version])
        filename = f"wastewise_predictions_{datetime.utcnow().strftime('%Y%m%d')}.csv"

    elif data_type == "metrics":
        writer.writerow(["Model_Type", "Target", "Training_Rows", "MAE", "RMSE", "R2", "Accuracy", "F1", "Created_At"])
        runs = db.query(ModelRun).all()
        for r in runs:
            writer.writerow([r.model_type, r.target_type, r.training_rows, r.mae, r.rmse, r.r2, r.accuracy, r.f1, r.created_at.isoformat()])
        filename = f"wastewise_model_metrics_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    else:
        raise HTTPException(status_code=400, detail="Invalid export type. Choose: priority, dataset, predictions, metrics.")

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ----------------- One-Click Demo Mode -----------------
@router.post("/demo/setup")
def setup_demo_environment(db: Session = Depends(get_db)):
    """
    One-click complete demo initialization:
    1. Checks if project/data/smart_waste.csv exists or generates realistic synthetic data
    2. Ingests into Database
    3. Runs EDA & computes initial stats
    4. Trains Linear Regression & Random Forest models
    5. Computes Predictions and Priority Scores
    6. Generates active smart alerts
    """
    # Clean previous demo tables
    db.query(Alert).delete()
    db.query(Prediction).delete()
    db.query(ModelRun).delete()
    db.query(SensorReading).delete()
    db.query(Collection).delete()
    db.query(Bin).delete()
    db.commit()

    # Check for existing smart_waste.csv
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "smart_waste.csv")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        # Use first 3000 rows for snappy demo performance or all if feasible
        sample_df = df.head(4000)
        num_bins, num_readings = import_dataframe_to_db(sample_df, db)
    else:
        df, _, _ = generate_synthetic_dataset(num_bins=60, num_days=30, readings_per_day=4)
        num_bins, num_readings = import_dataframe_to_db(df, db)

    # Train models
    train_results = train_models(TrainModelRequest(test_size=0.2), db)

    # Generate initial alerts
    db.add(Alert(
        bin_id="BIN001" if db.query(Bin).filter(Bin.bin_id == "BIN001").first() else "BIN_001",
        alert_type="OVERFLOW_RISK",
        severity="Critical",
        message="Predicted overflow within 4 hours (94% fill probability) in Commercial district."
    ))
    db.add(Alert(
        bin_id=None,
        alert_type="ZONE_SURGE",
        severity="High",
        message="Market Zone has 18 bins with fill levels above 80% due to weekend activity."
    ))
    db.commit()

    return {
        "status": "success",
        "message": "Demo mode initialized successfully.",
        "bins_loaded": num_bins,
        "readings_loaded": num_readings,
        "models_trained": ["LinearRegression", "RandomForestRegressor", "RandomForestClassifier"],
        "metrics": {
            "linear_regression_mae": train_results["linear_regression"]["mae"],
            "random_forest_mae": train_results["random_forest_regressor"]["mae"],
            "random_forest_r2": train_results["random_forest_regressor"]["r2"]
        }
    }
