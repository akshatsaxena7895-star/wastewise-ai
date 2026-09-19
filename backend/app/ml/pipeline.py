import os
import json
from datetime import datetime
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional
import joblib

from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)
from sklearn.preprocessing import OneHotEncoder

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

class MLPipeline:
    def __init__(self):
        self.feature_columns = []
        self.categorical_columns = ["location_zone", "weather", "day_type"]
        self.numerical_columns = [
            "hour", "day_of_week", "day_of_month", "is_weekend",
            "days_since_collection", "fill_level",
            "fill_lag_1", "fill_lag_2", "rolling_mean_3", "rolling_mean_7",
            "event_flag"
        ]
        self.encoder: Optional[OneHotEncoder] = None
        self.regressor = None
        self.classifier = None
        self.metadata = {}

    def extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extracts temporal, lag, and rolling features per bin_id chronologically.
        """
        df = df.copy()
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values(by=["bin_id", "timestamp"]).reset_index(drop=True)

        # Basic temporal features
        df["hour"] = df["timestamp"].dt.hour
        df["day_of_week"] = df["timestamp"].dt.dayofweek
        df["day_of_month"] = df["timestamp"].dt.day
        df["month"] = df["timestamp"].dt.month
        df["is_weekend"] = df["day_of_week"].apply(lambda x: 1 if x >= 5 else 0)
        
        # Standardize day_type
        if "day_type" not in df.columns:
            df["day_type"] = df["is_weekend"].apply(lambda x: "Weekend" if x == 1 else "Weekday")
        else:
            df["day_type"] = df["day_type"].astype(str)

        if "weather" not in df.columns:
            if "weather_flag" in df.columns:
                df["weather"] = df["weather_flag"].apply(lambda x: "Rain" if x == 1 else "Clear")
            else:
                df["weather"] = "Clear"
        
        if "event_flag" not in df.columns:
            df["event_flag"] = 0
        else:
            df["event_flag"] = df["event_flag"].astype(int)

        # Days since collection calculation if missing
        if "days_since_collection" not in df.columns or df["days_since_collection"].isnull().any():
            if "last_collection" in df.columns:
                df["last_collection"] = pd.to_datetime(df["last_collection"])
                diff = (df["timestamp"] - df["last_collection"]).dt.total_seconds() / 86400.0
                df["days_since_collection"] = diff.clip(lower=0.0).fillna(1.0)
            else:
                df["days_since_collection"] = 1.0

        # Lags and Rolling features per bin
        df["fill_lag_1"] = df.groupby("bin_id")["fill_level"].shift(1)
        df["fill_lag_2"] = df.groupby("bin_id")["fill_level"].shift(2)
        
        # Rolling averages (using lag values to prevent target contamination)
        df["rolling_mean_3"] = df.groupby("bin_id")["fill_level"].transform(
            lambda x: x.shift(1).rolling(window=3, min_periods=1).mean()
        )
        df["rolling_mean_7"] = df.groupby("bin_id")["fill_level"].transform(
            lambda x: x.shift(1).rolling(window=7, min_periods=1).mean()
        )

        # Target: Next period fill level
        df["target_fill"] = df.groupby("bin_id")["fill_level"].shift(-1)
        df["target_overflow"] = (df["target_fill"] >= 90.0).astype(int)

        # Impute starting lag values
        df["fill_lag_1"] = df["fill_lag_1"].fillna(df["fill_level"])
        df["fill_lag_2"] = df["fill_lag_2"].fillna(df["fill_lag_1"])
        df["rolling_mean_3"] = df["rolling_mean_3"].fillna(df["fill_level"])
        df["rolling_mean_7"] = df["rolling_mean_7"].fillna(df["fill_level"])

        # Drop only the last record per bin where target_fill is NaN
        valid_df = df.dropna(subset=["target_fill"]).reset_index(drop=True)
        return valid_df

    def prepare_data_matrix(self, df: pd.DataFrame, fit_encoder: bool = False) -> Tuple[np.ndarray, list]:
        """
        One-hot encodes categorical features and merges with numericals.
        """
        cat_df = df[self.categorical_columns].astype(str)
        if fit_encoder or self.encoder is None:
            self.encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
            cat_encoded = self.encoder.fit_transform(cat_df)
            cat_names = list(self.encoder.get_feature_names_out(self.categorical_columns))
        else:
            cat_encoded = self.encoder.transform(cat_df)
            cat_names = list(self.encoder.get_feature_names_out(self.categorical_columns))

        num_data = df[self.numerical_columns].values
        X = np.hstack([num_data, cat_encoded])
        feature_names = self.numerical_columns + cat_names
        self.feature_columns = feature_names
        return X, feature_names

    def train_and_evaluate(self, raw_df: pd.DataFrame, test_size: float = 0.2) -> Dict[str, Any]:
        """
        Runs chronological train/test split and trains Linear Regression,
        Random Forest Regressor, and Random Forest Classifier.
        """
        featured_df = self.extract_features(raw_df)
        if len(featured_df) < 50:
            raise ValueError(f"Insufficient records for training: {len(featured_df)} found. Need at least 50.")

        X, feature_names = self.prepare_data_matrix(featured_df, fit_encoder=True)
        y_reg = featured_df["target_fill"].values
        y_clf = featured_df["target_overflow"].values

        # Chronological Split (avoid future leakage)
        split_idx = int(len(featured_df) * (1 - test_size))
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_reg_train, y_reg_test = y_reg[:split_idx], y_reg[split_idx:]
        y_clf_train, y_clf_test = y_clf[:split_idx], y_clf[split_idx:]
        test_timestamps = featured_df["timestamp"].iloc[split_idx:].dt.strftime("%Y-%m-%d %H:%M").tolist()
        test_bins = featured_df["bin_id"].iloc[split_idx:].tolist()

        # 1. Linear Regression Baseline
        lr = LinearRegression()
        lr.fit(X_train, y_reg_train)
        lr_pred = lr.predict(X_test)
        lr_mae = float(mean_absolute_error(y_reg_test, lr_pred))
        lr_rmse = float(np.sqrt(mean_squared_error(y_reg_test, lr_pred)))
        lr_r2 = float(r2_score(y_reg_test, lr_pred))

        # 2. Random Forest Regressor (Main)
        rf_reg = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
        rf_reg.fit(X_train, y_reg_train)
        rf_pred = rf_reg.predict(X_test)
        rf_mae = float(mean_absolute_error(y_reg_test, rf_pred))
        rf_rmse = float(np.sqrt(mean_squared_error(y_reg_test, rf_pred)))
        rf_r2 = float(r2_score(y_reg_test, rf_pred))

        # Feature Importances for RF Regressor
        importances = rf_reg.feature_importances_
        sorted_indices = np.argsort(importances)[::-1]
        feature_importance_list = [
            {"feature": feature_names[i], "importance": round(float(importances[i]), 4)}
            for i in sorted_indices[:15]
        ]

        # 3. Random Forest Classifier for Overflow
        rf_clf = RandomForestClassifier(n_estimators=80, max_depth=10, random_state=42, class_weight="balanced")
        rf_clf.fit(X_train, y_clf_train)
        clf_pred = rf_clf.predict(X_test)
        clf_acc = float(accuracy_score(y_clf_test, clf_pred))
        clf_prec = float(precision_score(y_clf_test, clf_pred, zero_division=0))
        clf_rec = float(recall_score(y_clf_test, clf_pred, zero_division=0))
        clf_f1 = float(f1_score(y_clf_test, clf_pred, zero_division=0))
        cm = confusion_matrix(y_clf_test, clf_pred).tolist()

        # Build sample actual vs predicted (last 40 points for clear visualization)
        sample_step = max(1, len(y_reg_test) // 40)
        actual_vs_pred = []
        residual_distribution = []
        for i in range(0, len(y_reg_test), sample_step):
            act = round(float(y_reg_test[i]), 1)
            pred = round(float(rf_pred[i]), 1)
            actual_vs_pred.append({
                "timestamp": test_timestamps[i] if i < len(test_timestamps) else f"T{i}",
                "bin_id": test_bins[i] if i < len(test_bins) else "BIN",
                "actual": act,
                "predicted": pred,
                "error": round(pred - act, 1)
            })

        # Residuals sampling
        residuals = rf_pred - y_reg_test
        hist, bin_edges = np.histogram(residuals, bins=12)
        for i in range(len(hist)):
            residual_distribution.append({
                "range": f"{bin_edges[i]:.1f} to {bin_edges[i+1]:.1f}",
                "count": int(hist[i])
            })

        # Save active models
        self.regressor = rf_reg
        self.classifier = rf_clf
        joblib.dump(rf_reg, os.path.join(MODELS_DIR, "best_regressor.joblib"))
        joblib.dump(rf_clf, os.path.join(MODELS_DIR, "best_classifier.joblib"))
        joblib.dump(self.encoder, os.path.join(MODELS_DIR, "feature_encoder.joblib"))

        self.metadata = {
            "training_rows": len(X_train),
            "test_rows": len(X_test),
            "trained_at": datetime.utcnow().isoformat(),
            "models": {
                "LinearRegression": {
                    "mae": round(lr_mae, 2),
                    "rmse": round(lr_rmse, 2),
                    "r2": round(lr_r2, 3),
                },
                "RandomForestRegressor": {
                    "mae": round(rf_mae, 2),
                    "rmse": round(rf_rmse, 2),
                    "r2": round(rf_r2, 3),
                },
                "RandomForestClassifier": {
                    "accuracy": round(clf_acc, 3),
                    "precision": round(clf_prec, 3),
                    "recall": round(clf_rec, 3),
                    "f1": round(clf_f1, 3),
                    "confusion_matrix": cm
                }
            }
        }
        with open(os.path.join(MODELS_DIR, "metadata.json"), "w") as f:
            json.dump(self.metadata, f, indent=2)

        return {
            "lr_metrics": {"mae": lr_mae, "rmse": lr_rmse, "r2": lr_r2},
            "rf_metrics": {"mae": rf_mae, "rmse": rf_rmse, "r2": rf_r2},
            "clf_metrics": {
                "accuracy": clf_acc,
                "precision": clf_prec,
                "recall": clf_rec,
                "f1": clf_f1,
                "confusion_matrix": cm
            },
            "feature_importance": feature_importance_list,
            "actual_vs_predicted": actual_vs_pred,
            "residual_distribution": residual_distribution,
            "training_rows": len(X_train)
        }

    def predict_single(
        self,
        current_fill: float,
        zone: str,
        days_since_collection: float,
        weather: str = "Clear",
        event_flag: bool = False,
        day_type: str = "Weekday",
        hour: int = 14
    ) -> Tuple[float, float]:
        """
        Predicts next fill level and overflow probability for given bin state.
        """
        # Load models if not in memory
        if self.regressor is None:
            reg_path = os.path.join(MODELS_DIR, "best_regressor.joblib")
            enc_path = os.path.join(MODELS_DIR, "feature_encoder.joblib")
            clf_path = os.path.join(MODELS_DIR, "best_classifier.joblib")
            if os.path.exists(reg_path) and os.path.exists(enc_path):
                self.regressor = joblib.load(reg_path)
                self.encoder = joblib.load(enc_path)
                if os.path.exists(clf_path):
                    self.classifier = joblib.load(clf_path)
            else:
                # Rule-based fallback if ML model has not yet been trained
                rate_map = {"Market": 8.0, "Commercial": 6.5, "IT Park": 5.0, "Residential": 4.0, "Industrial": 4.5, "Mixed": 5.5}
                rate = rate_map.get(zone, 5.0)
                if weather in ["Rain", "Storm"]:
                    rate *= 1.25
                if event_flag:
                    rate *= 1.5
                pred_fill = min(100.0, current_fill + rate)
                prob = min(0.99, max(0.01, (pred_fill - 60.0) / 40.0)) if pred_fill >= 60 else 0.05
                return round(pred_fill, 1), round(prob, 2)

        # Build feature row
        is_weekend = 1 if day_type == "Weekend" else 0
        cat_df = pd.DataFrame([{
            "location_zone": zone,
            "weather": weather,
            "day_type": day_type
        }])
        cat_encoded = self.encoder.transform(cat_df)

        num_vals = np.array([[
            hour, 2, 15, is_weekend,
            days_since_collection, current_fill,
            current_fill, current_fill, current_fill, current_fill,
            1 if event_flag else 0
        ]])
        X_single = np.hstack([num_vals, cat_encoded])

        pred_fill = float(self.regressor.predict(X_single)[0])
        pred_fill = max(0.0, min(100.0, round(pred_fill, 1)))

        if self.classifier is not None:
            proba = self.classifier.predict_proba(X_single)[0]
            # probability of overflow (class 1)
            overflow_prob = float(proba[1]) if len(proba) > 1 else (1.0 if pred_fill >= 90 else 0.0)
        else:
            overflow_prob = min(0.99, max(0.01, (pred_fill - 70.0) / 30.0)) if pred_fill >= 70 else 0.05

        return pred_fill, round(overflow_prob, 2)

pipeline = MLPipeline()
