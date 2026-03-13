"""
Weather Service — LeafDoc AI
DTI Project | Innovation #2: Environmental Context Integration

Uses Open-Meteo API (completely FREE, no API key needed!)
Docs: https://open-meteo.com/en/docs
"""

import httpx
from datetime import datetime
from typing import Optional

# ── Disease Risk Rules ─────────────────────────────────────────────────────────
# Based on published plant pathology literature
# Each disease has known temperature + humidity thresholds for spread

DISEASE_RISK_RULES = {
    # Late blights (Phytophthora) — cool + wet
    "late_blight": {
        "diseases": ["Late_blight", "Late blight"],
        "conditions": {"temp_min": 10, "temp_max": 25, "humidity_min": 75, "rain_min": 2},
        "risk_message": "⚠️ Conditions highly favorable for Late Blight spread — cool + wet weather detected.",
        "tip": "Apply preventive copper fungicide immediately. Avoid overhead irrigation."
    },
    # Early blights (Alternaria) — warm + wet/dry cycle
    "early_blight": {
        "diseases": ["Early_blight", "Early blight"],
        "conditions": {"temp_min": 20, "temp_max": 30, "humidity_min": 60},
        "risk_message": "⚠️ Warm humid conditions favor Early Blight. Monitor plants closely.",
        "tip": "Remove lower infected leaves. Apply neem oil or copper spray."
    },
    # Bacterial diseases — warm + wet + wind
    "bacterial": {
        "diseases": ["Bacterial_spot", "Bacterial spot"],
        "conditions": {"temp_min": 22, "temp_max": 32, "humidity_min": 70},
        "risk_message": "⚠️ Warm wet weather promotes bacterial spread. Avoid working with wet plants.",
        "tip": "Apply copper bactericide. Avoid overhead irrigation."
    },
    # Powdery mildew — warm dry + high humidity nights
    "powdery_mildew": {
        "diseases": ["Powdery_mildew", "Powdery mildew"],
        "conditions": {"temp_min": 18, "temp_max": 30, "humidity_min": 50, "humidity_max": 80},
        "risk_message": "⚠️ Conditions suitable for Powdery Mildew. Dry weather + moderate humidity is ideal for this disease.",
        "tip": "Apply sulfur fungicide or potassium bicarbonate spray weekly."
    },
    # Rust diseases — moderate temp + high humidity
    "rust": {
        "diseases": ["rust", "Rust"],
        "conditions": {"temp_min": 15, "temp_max": 25, "humidity_min": 80},
        "risk_message": "⚠️ Cool humid conditions favor rust disease spread.",
        "tip": "Apply sulfur or propiconazole fungicide. Improve air circulation."
    },
    # Viral diseases (spread by insects in heat)
    "viral": {
        "diseases": ["virus", "Virus", "mosaic", "YellowLeaf"],
        "conditions": {"temp_min": 25, "temp_max": 38, "humidity_max": 60},
        "risk_message": "⚠️ Hot dry weather increases whitefly/aphid activity — viral disease vectors are active.",
        "tip": "Apply neem oil spray. Install yellow sticky traps. Use insect-proof nets."
    },
    # Leaf spots — warm wet
    "leaf_spot": {
        "diseases": ["leaf_spot", "Leaf_spot", "Septoria", "Target_Spot", "leaf_scorch"],
        "conditions": {"temp_min": 18, "temp_max": 28, "humidity_min": 65},
        "risk_message": "⚠️ Warm humid conditions promote leaf spot disease spread.",
        "tip": "Improve air circulation. Apply copper or mancozeb fungicide."
    },
    # Apple scab — cool + wet spring
    "scab": {
        "diseases": ["Apple_scab", "scab"],
        "conditions": {"temp_min": 10, "temp_max": 20, "humidity_min": 70, "rain_min": 1},
        "risk_message": "⚠️ Cool wet conditions are peak Apple Scab infection period.",
        "tip": "Apply sulfur fungicide from bud break. Rake and destroy fallen leaves."
    },
}

# ── Indian Cities Geocoding ────────────────────────────────────────────────────
INDIAN_CITIES = {
    "delhi": (28.6139, 77.2090),
    "mumbai": (19.0760, 72.8777),
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "hyderabad": (17.3850, 78.4867),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639),
    "pune": (18.5204, 73.8567),
    "ahmedabad": (23.0225, 72.5714),
    "jaipur": (26.9124, 75.7873),
    "lucknow": (26.8467, 80.9462),
    "kanpur": (26.4499, 80.3319),
    "nagpur": (21.1458, 79.0882),
    "indore": (22.7196, 75.8577),
    "bhopal": (23.2599, 77.4126),
    "patna": (25.5941, 85.1376),
    "agra": (27.1767, 78.0081),
    "varanasi": (25.3176, 82.9739),
    "noida": (28.5355, 77.3910),
    "gurgaon": (28.4595, 77.0266),
    "chandigarh": (30.7333, 76.7794),
    "amritsar": (31.6340, 74.8723),
    "surat": (21.1702, 72.8311),
    "visakhapatnam": (17.6868, 83.2185),
    "coimbatore": (11.0168, 76.9558),
    "greater noida": (28.4744, 77.5040),
    "greater_noida": (28.4744, 77.5040),
}


async def get_coordinates_from_city(city: str) -> Optional[tuple]:
    """Try to get lat/lon from city name."""
    city_clean = city.lower().strip()
    if city_clean in INDIAN_CITIES:
        return INDIAN_CITIES[city_clean]
    # Try Open-Meteo geocoding
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": city, "count": 1, "language": "en", "format": "json"}
            )
            data = resp.json()
            if data.get("results"):
                r = data["results"][0]
                return (r["latitude"], r["longitude"])
    except Exception:
        pass
    return None


async def get_weather(lat: float, lon: float) -> Optional[dict]:
    """
    Fetch current weather from Open-Meteo (free, no API key).
    Returns temperature, humidity, rainfall, windspeed, weather description.
    """
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": [
                        "temperature_2m",
                        "relative_humidity_2m",
                        "precipitation",
                        "wind_speed_10m",
                        "weather_code",
                        "apparent_temperature",
                        "cloud_cover",
                    ],
                    "daily": [
                        "precipitation_sum",
                        "temperature_2m_max",
                        "temperature_2m_min",
                    ],
                    "timezone": "Asia/Kolkata",
                    "forecast_days": 3,
                }
            )
            data = resp.json()
            curr = data.get("current", {})
            daily = data.get("daily", {})

            temp       = curr.get("temperature_2m", 0)
            humidity   = curr.get("relative_humidity_2m", 0)
            rain       = curr.get("precipitation", 0)
            wind       = curr.get("wind_speed_10m", 0)
            feels_like = curr.get("apparent_temperature", temp)
            clouds     = curr.get("cloud_cover", 0)
            wcode      = curr.get("weather_code", 0)

            # 3-day rain forecast
            rain_3day = sum(daily.get("precipitation_sum", [0, 0, 0])[:3])
            temp_max  = max(daily.get("temperature_2m_max", [temp])[:3])
            temp_min  = min(daily.get("temperature_2m_min", [temp])[:3])

            return {
                "temperature":     round(temp, 1),
                "feels_like":      round(feels_like, 1),
                "humidity":        humidity,
                "rainfall_mm":     round(rain, 1),
                "rain_3day_mm":    round(rain_3day, 1),
                "wind_kmh":        round(wind, 1),
                "cloud_cover_pct": clouds,
                "temp_max_3day":   round(temp_max, 1),
                "temp_min_3day":   round(temp_min, 1),
                "condition":       _weather_code_to_text(wcode),
                "condition_icon":  _weather_code_to_icon(wcode),
                "timestamp":       datetime.now().isoformat(),
            }
    except Exception as e:
        print(f"Weather fetch error: {e}")
        return None


def calculate_disease_risk(weather: dict, detected_disease: str) -> dict:
    """
    Calculate disease spread risk based on current weather conditions
    and the detected disease type.
    Returns risk level, score, alert message, and farming tip.
    """
    if not weather:
        return {"level": "Unknown", "score": 0, "message": "", "tip": "", "factors": []}

    temp     = weather["temperature"]
    humidity = weather["humidity"]
    rain     = weather["rainfall_mm"]
    risk_score = 0
    factors = []

    # ── Base risk from humidity ─────────────────────────────────────────────
    if humidity >= 85:
        risk_score += 35
        factors.append(f"Very high humidity ({humidity}%) — ideal for fungal/bacterial spread")
    elif humidity >= 70:
        risk_score += 20
        factors.append(f"High humidity ({humidity}%) — promotes disease spread")
    elif humidity >= 55:
        risk_score += 10
        factors.append(f"Moderate humidity ({humidity}%)")

    # ── Rain contribution ────────────────────────────────────────────────────
    if rain > 5:
        risk_score += 25
        factors.append(f"Heavy rainfall ({rain}mm) — spores spread rapidly in rain")
    elif rain > 1:
        risk_score += 15
        factors.append(f"Recent rainfall ({rain}mm) — wet conditions favor disease")
    elif rain > 0:
        risk_score += 8
        factors.append(f"Light rain ({rain}mm)")

    # ── Temperature contribution ─────────────────────────────────────────────
    if 18 <= temp <= 28:
        risk_score += 20
        factors.append(f"Optimal disease temperature ({temp}°C)")
    elif 10 <= temp <= 32:
        risk_score += 10
        factors.append(f"Moderate temperature ({temp}°C)")

    # ── 3-day rain forecast ───────────────────────────────────────────────────
    if weather.get("rain_3day_mm", 0) > 10:
        risk_score += 15
        factors.append(f"Rain forecast next 3 days ({weather['rain_3day_mm']}mm) — sustained risk")

    # ── Disease-specific risk check ───────────────────────────────────────────
    specific_alert = ""
    specific_tip   = ""
    disease_lower  = detected_disease.lower()

    for rule_key, rule in DISEASE_RISK_RULES.items():
        if any(d.lower() in disease_lower for d in rule["diseases"]):
            cond = rule["conditions"]
            matches = 0
            total   = 0
            if "temp_min" in cond:
                total += 1
                if temp >= cond["temp_min"]: matches += 1
            if "temp_max" in cond:
                total += 1
                if temp <= cond["temp_max"]: matches += 1
            if "humidity_min" in cond:
                total += 1
                if humidity >= cond["humidity_min"]: matches += 1
            if "humidity_max" in cond:
                total += 1
                if humidity <= cond["humidity_max"]: matches += 1
            if "rain_min" in cond:
                total += 1
                if rain >= cond["rain_min"]: matches += 1

            if total > 0 and matches / total >= 0.6:
                risk_score += 20
                specific_alert = rule["risk_message"]
                specific_tip   = rule["tip"]
            break

    # ── Clamp and level ───────────────────────────────────────────────────────
    risk_score = min(risk_score, 100)

    if risk_score >= 70:
        level = "Critical"
        level_color = "#ef4444"
        level_icon  = "🚨"
    elif risk_score >= 45:
        level = "High"
        level_color = "#f97316"
        level_icon  = "⚠️"
    elif risk_score >= 25:
        level = "Moderate"
        level_color = "#eab308"
        level_icon  = "🟡"
    else:
        level = "Low"
        level_color = "#22c55e"
        level_icon  = "✅"

    # ── General message if no specific one ───────────────────────────────────
    if not specific_alert:
        if risk_score >= 45:
            specific_alert = "⚠️ Current weather conditions are favorable for plant disease spread. Increase monitoring frequency."
            specific_tip   = "Inspect plants daily. Apply preventive treatments before rain."
        elif risk_score >= 25:
            specific_alert = "🟡 Moderate disease risk — weather conditions are partially favorable for disease."
            specific_tip   = "Monitor plants every 2–3 days. Ensure good air circulation."
        else:
            specific_alert = "✅ Low disease risk — current weather conditions are not particularly favorable for disease spread."
            specific_tip   = "Continue regular care. Good conditions for preventive spray application."

    return {
        "level":       level,
        "level_color": level_color,
        "level_icon":  level_icon,
        "score":       risk_score,
        "message":     specific_alert,
        "tip":         specific_tip,
        "factors":     factors[:4],  # top 4 factors
    }


def _weather_code_to_text(code: int) -> str:
    """Convert WMO weather code to readable text."""
    if code == 0:           return "Clear sky"
    if code in [1, 2, 3]:  return "Partly cloudy"
    if code in [45, 48]:   return "Foggy"
    if code in [51, 53, 55]: return "Drizzle"
    if code in [61, 63, 65]: return "Rain"
    if code in [71, 73, 75]: return "Snow"
    if code in [80, 81, 82]: return "Rain showers"
    if code in [95, 96, 99]: return "Thunderstorm"
    return "Cloudy"


def _weather_code_to_icon(code: int) -> str:
    """Convert WMO weather code to emoji icon."""
    if code == 0:           return "☀️"
    if code in [1, 2, 3]:  return "⛅"
    if code in [45, 48]:   return "🌫️"
    if code in [51, 53, 55, 61, 63, 65, 80, 81, 82]: return "🌧️"
    if code in [71, 73, 75]: return "❄️"
    if code in [95, 96, 99]: return "⛈️"
    return "☁️"