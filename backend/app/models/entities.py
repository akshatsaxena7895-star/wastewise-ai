from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class Bin(Base):
    __tablename__ = "bins"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    bin_id = Column(String(50), unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_zone = Column(String(50), nullable=False, index=True) # Residential, Commercial, Market, Industrial, IT Park, Mixed
    capacity = Column(Float, default=100.0) # Liters or standard unit
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    readings = relationship("SensorReading", back_populates="bin", cascade="all, delete-orphan")
    collections = relationship("Collection", back_populates="bin", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="bin", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="bin", cascade="all, delete-orphan")

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    bin_id = Column(String(50), ForeignKey("bins.bin_id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    fill_level = Column(Float, nullable=False) # 0 to 100%
    weather = Column(String(50), default="Clear") # Clear, Rain, Overcast, Storm
    event_flag = Column(Boolean, default=False)
    day_type = Column(String(50), default="Weekday") # Weekday, Weekend, Holiday
    created_at = Column(DateTime, default=datetime.utcnow)

    bin = relationship("Bin", back_populates="readings")

class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    bin_id = Column(String(50), ForeignKey("bins.bin_id"), nullable=False, index=True)
    collection_time = Column(DateTime, nullable=False, index=True)
    fill_before_collection = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    bin = relationship("Bin", back_populates="collections")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    bin_id = Column(String(50), ForeignKey("bins.bin_id"), nullable=False, index=True)
    prediction_time = Column(DateTime, nullable=False, index=True)
    predicted_fill_level = Column(Float, nullable=False)
    overflow_probability = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False) # Critical, High, Medium, Low
    priority_score = Column(Float, nullable=False)
    model_version = Column(String(50), default="v1.0")
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    bin = relationship("Bin", back_populates="predictions")

class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_type = Column(String(50), nullable=False) # LinearRegression, RandomForestRegressor, RandomForestClassifier, etc.
    target_type = Column(String(50), default="fill_level") # fill_level or overflow
    training_rows = Column(Integer, nullable=False)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    r2 = Column(Float, nullable=True)
    f1 = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    feature_importance = Column(JSON, nullable=True) # list of {feature, importance}
    confusion_matrix = Column(JSON, nullable=True) # [[tn, fp], [fn, tp]]
    actual_vs_predicted = Column(JSON, nullable=True) # sample list of {actual, predicted, timestamp}
    residuals = Column(JSON, nullable=True) # sample list of residual errors
    created_at = Column(DateTime, default=datetime.utcnow)

class AppSetting(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    bin_id = Column(String(50), ForeignKey("bins.bin_id"), nullable=True, index=True)
    alert_type = Column(String(50), nullable=False) # OVERFLOW_RISK, ZONE_SURGE, CRITICAL_FILL, STALE_BIN
    severity = Column(String(20), default="High") # Critical, High, Medium, Low
    message = Column(String(255), nullable=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    bin = relationship("Bin", back_populates="alerts")
