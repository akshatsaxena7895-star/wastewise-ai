from typing import Dict, Any, Tuple

DEFAULT_WEIGHTS = {
    "predicted_fill": 0.50,
    "overflow_prob": 0.25,
    "days_since_collection": 0.15,
    "current_fill": 0.10
}

DEFAULT_THRESHOLDS = {
    "critical": 90.0,
    "high": 75.0,
    "medium": 50.0
}

def calculate_priority_score(
    predicted_fill: float,
    overflow_prob: float,
    days_since_collection: float,
    current_fill: float,
    weights: Dict[str, float] = None,
    thresholds: Dict[str, float] = None
) -> Tuple[float, str, str]:
    """
    Calculates transparent priority score (0-100), risk category, and grounded explanation.
    Formula:
      Score = 100 * (w_pred * (pred/100) + w_over * prob + w_days * min(1.0, days/7.0) + w_curr * (curr/100))
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS
    if thresholds is None:
        thresholds = DEFAULT_THRESHOLDS

    w_pred = weights.get("predicted_fill", 0.50)
    w_over = weights.get("overflow_prob", 0.25)
    w_days = weights.get("days_since_collection", 0.15)
    w_curr = weights.get("current_fill", 0.10)

    # Normalization
    norm_pred = max(0.0, min(1.0, predicted_fill / 100.0))
    norm_over = max(0.0, min(1.0, overflow_prob))
    norm_days = max(0.0, min(1.0, days_since_collection / 7.0))
    norm_curr = max(0.0, min(1.0, current_fill / 100.0))

    raw_score = (
        (w_pred * norm_pred) +
        (w_over * norm_over) +
        (w_days * norm_days) +
        (w_curr * norm_curr)
    ) * 100.0

    priority_score = round(max(0.0, min(100.0, raw_score)), 1)

    # Risk classification
    crit_th = thresholds.get("critical", 90.0)
    high_th = thresholds.get("high", 75.0)
    med_th = thresholds.get("medium", 50.0)

    if priority_score >= crit_th or predicted_fill >= 92.0:
        risk_level = "Critical"
    elif priority_score >= high_th or predicted_fill >= 78.0:
        risk_level = "High"
    elif priority_score >= med_th:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Feature-grounded explanation
    reasons = []
    if predicted_fill >= 90.0:
        reasons.append(f"predicted overflow at {predicted_fill:.0f}%")
    elif predicted_fill >= 75.0:
        reasons.append(f"high predicted fill ({predicted_fill:.0f}%)")
    
    if days_since_collection >= 3.0:
        reasons.append(f"{days_since_collection:.1f} days without collection")
    elif days_since_collection <= 0.5:
        reasons.append("recently emptied")

    if overflow_prob >= 0.70:
        reasons.append(f"{int(overflow_prob * 100)}% overflow probability")

    if not reasons:
        explanation = f"Nominal fill rate ({predicted_fill:.0f}%), low immediate risk."
    else:
        explanation = f"{risk_level} urgency due to " + ", and ".join(reasons) + "."

    return priority_score, risk_level, explanation
