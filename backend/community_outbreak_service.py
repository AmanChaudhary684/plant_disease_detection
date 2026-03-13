"""
community_outbreak_service.py — LeafDoc AI
SQLite primary storage + JSON fallback for community disease reports.
Copy this file to backend/ and replace outbreak_service.py
"""

import json, sqlite3, random
from datetime import datetime
from pathlib import Path
from collections import defaultdict
from typing import Optional

DB_PATH       = Path("outbreak.db")
JSON_FALLBACK = Path("outbreak_data.json")

INDIA_STATES = {
    "Uttar Pradesh":    {"lat": 26.85, "lon": 80.91, "abbr": "UP"},
    "Maharashtra":      {"lat": 19.75, "lon": 75.71, "abbr": "MH"},
    "Bihar":            {"lat": 25.09, "lon": 85.31, "abbr": "BR"},
    "West Bengal":      {"lat": 22.98, "lon": 87.85, "abbr": "WB"},
    "Madhya Pradesh":   {"lat": 22.97, "lon": 78.65, "abbr": "MP"},
    "Tamil Nadu":       {"lat": 11.12, "lon": 78.65, "abbr": "TN"},
    "Rajasthan":        {"lat": 27.02, "lon": 74.21, "abbr": "RJ"},
    "Karnataka":        {"lat": 15.31, "lon": 75.71, "abbr": "KA"},
    "Gujarat":          {"lat": 22.25, "lon": 71.19, "abbr": "GJ"},
    "Andhra Pradesh":   {"lat": 15.91, "lon": 79.73, "abbr": "AP"},
    "Odisha":           {"lat": 20.94, "lon": 85.09, "abbr": "OD"},
    "Telangana":        {"lat": 18.11, "lon": 79.01, "abbr": "TG"},
    "Kerala":           {"lat": 10.85, "lon": 76.27, "abbr": "KL"},
    "Jharkhand":        {"lat": 23.61, "lon": 85.27, "abbr": "JH"},
    "Assam":            {"lat": 26.20, "lon": 92.93, "abbr": "AS"},
    "Punjab":           {"lat": 31.14, "lon": 75.34, "abbr": "PB"},
    "Haryana":          {"lat": 29.05, "lon": 76.09, "abbr": "HR"},
    "Chhattisgarh":     {"lat": 21.27, "lon": 81.86, "abbr": "CG"},
    "Uttarakhand":      {"lat": 30.06, "lon": 79.54, "abbr": "UK"},
    "Himachal Pradesh": {"lat": 31.10, "lon": 77.17, "abbr": "HP"},
    "Delhi":            {"lat": 28.61, "lon": 77.20, "abbr": "DL"},
    "Jammu & Kashmir":  {"lat": 33.72, "lon": 76.57, "abbr": "JK"},
}

CITY_TO_STATE = {
    "delhi": "Delhi", "new delhi": "Delhi",
    "noida": "Uttar Pradesh", "lucknow": "Uttar Pradesh", "agra": "Uttar Pradesh",
    "kanpur": "Uttar Pradesh", "varanasi": "Uttar Pradesh", "meerut": "Uttar Pradesh",
    "mumbai": "Maharashtra", "pune": "Maharashtra", "nagpur": "Maharashtra",
    "nashik": "Maharashtra", "aurangabad": "Maharashtra",
    "kolkata": "West Bengal", "howrah": "West Bengal",
    "patna": "Bihar", "gaya": "Bihar", "muzaffarpur": "Bihar",
    "bhopal": "Madhya Pradesh", "indore": "Madhya Pradesh", "gwalior": "Madhya Pradesh",
    "chennai": "Tamil Nadu", "coimbatore": "Tamil Nadu", "madurai": "Tamil Nadu",
    "jaipur": "Rajasthan", "jodhpur": "Rajasthan", "udaipur": "Rajasthan",
    "bangalore": "Karnataka", "bengaluru": "Karnataka", "mysore": "Karnataka",
    "ahmedabad": "Gujarat", "surat": "Gujarat", "vadodara": "Gujarat",
    "hyderabad": "Telangana", "warangal": "Telangana",
    "visakhapatnam": "Andhra Pradesh", "vijayawada": "Andhra Pradesh",
    "kochi": "Kerala", "thiruvananthapuram": "Kerala", "kozhikode": "Kerala",
    "bhubaneswar": "Odisha", "cuttack": "Odisha",
    "ranchi": "Jharkhand", "jamshedpur": "Jharkhand",
    "guwahati": "Assam",
    "chandigarh": "Punjab", "ludhiana": "Punjab", "amritsar": "Punjab",
    "gurgaon": "Haryana", "faridabad": "Haryana",
    "raipur": "Chhattisgarh",
    "dehradun": "Uttarakhand", "haridwar": "Uttarakhand",
    "shimla": "Himachal Pradesh", "dharamshala": "Himachal Pradesh",
    "srinagar": "Jammu & Kashmir", "jammu": "Jammu & Kashmir",
}

SEED_DATA = [
    {"state": "Uttar Pradesh",    "disease": "Tomato___Late_blight",                     "count": 47},
    {"state": "Uttar Pradesh",    "disease": "Potato___Late_blight",                      "count": 38},
    {"state": "Uttar Pradesh",    "disease": "Tomato___Early_blight",                     "count": 29},
    {"state": "Uttar Pradesh",    "disease": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",     "count": 21},
    {"state": "Maharashtra",      "disease": "Grape___Black_rot",                          "count": 34},
    {"state": "Maharashtra",      "disease": "Tomato___Bacterial_spot",                    "count": 26},
    {"state": "Maharashtra",      "disease": "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "count": 19},
    {"state": "Karnataka",        "disease": "Tomato___Early_blight",                      "count": 31},
    {"state": "Karnataka",        "disease": "Pepper,_bell___Bacterial_spot",              "count": 22},
    {"state": "Tamil Nadu",       "disease": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",     "count": 41},
    {"state": "Tamil Nadu",       "disease": "Tomato___Leaf_Mold",                         "count": 18},
    {"state": "Punjab",           "disease": "Corn_(maize)___Common_rust_",                "count": 28},
    {"state": "Punjab",           "disease": "Potato___Early_blight",                      "count": 23},
    {"state": "Haryana",          "disease": "Corn_(maize)___Northern_Leaf_Blight",        "count": 19},
    {"state": "West Bengal",      "disease": "Tomato___Septoria_leaf_spot",                "count": 24},
    {"state": "West Bengal",      "disease": "Potato___Late_blight",                       "count": 33},
    {"state": "Andhra Pradesh",   "disease": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",     "count": 37},
    {"state": "Telangana",        "disease": "Tomato___Bacterial_spot",                    "count": 29},
    {"state": "Gujarat",          "disease": "Squash___Powdery_mildew",                    "count": 16},
    {"state": "Himachal Pradesh", "disease": "Apple___Apple_scab",                         "count": 42},
    {"state": "Himachal Pradesh", "disease": "Apple___Cedar_apple_rust",                   "count": 18},
    {"state": "Rajasthan",        "disease": "Tomato___Tomato_mosaic_virus",               "count": 12},
    {"state": "Kerala",           "disease": "Tomato___Leaf_Mold",                         "count": 22},
    {"state": "Kerala",           "disease": "Pepper,_bell___Bacterial_spot",              "count": 17},
    {"state": "Madhya Pradesh",   "disease": "Corn_(maize)___Common_rust_",                "count": 21},
]


# ── SQLite ─────────────────────────────────────────────────────────────────────
def _get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    conn = _get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            disease   TEXT NOT NULL,
            state     TEXT NOT NULL,
            city      TEXT,
            source    TEXT DEFAULT 'user',
            timestamp TEXT NOT NULL
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_state   ON reports(state)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_source  ON reports(source)")
    conn.commit()
    seeded = conn.execute("SELECT COUNT(*) FROM reports WHERE source='seed'").fetchone()[0]
    if seeded == 0:
        rows = []
        for entry in SEED_DATA:
            for _ in range(entry["count"]):
                days_ago = random.randint(0, 180)
                month = max(1, min(12, 7 - days_ago // 30))
                day   = max(1, min(28, days_ago % 28 + 1))
                ts    = datetime(2025, month, day).isoformat()
                rows.append((entry["disease"], entry["state"], None, "seed", ts))
        conn.executemany(
            "INSERT INTO reports (disease,state,city,source,timestamp) VALUES (?,?,?,?,?)",
            rows
        )
        conn.commit()
        print(f"Seeded {len(rows)} baseline reports")
    conn.close()


# ── JSON fallback ──────────────────────────────────────────────────────────────
def _json_append(disease, state, city):
    try:
        data = []
        if JSON_FALLBACK.exists():
            with open(JSON_FALLBACK) as f:
                data = json.load(f)
        data.append({"disease": disease, "state": state, "city": city,
                     "source": "user", "timestamp": datetime.now().isoformat()})
        with open(JSON_FALLBACK, "w") as f:
            json.dump(data[-10000:], f)
    except Exception as e:
        print(f"JSON fallback error: {e}")


def _json_read(source_filter=None):
    if not JSON_FALLBACK.exists():
        return []
    try:
        with open(JSON_FALLBACK) as f:
            data = json.load(f)
        if source_filter:
            return [r for r in data if r.get("source") == source_filter]
        return data
    except Exception:
        return []


# ── Internal read ──────────────────────────────────────────────────────────────
def _get_all_reports(source_filter=None):
    try:
        _init_db()
        conn = _get_db()
        if source_filter:
            rows = conn.execute(
                "SELECT * FROM reports WHERE source=?", (source_filter,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM reports").fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"SQLite read failed, using JSON: {e}")
        return _json_read(source_filter)


# ── Public API ─────────────────────────────────────────────────────────────────
def record_outbreak(disease: str, state: str, city: Optional[str] = None, source: str = "user"):
    if not disease or "healthy" in disease.lower():
        return {"success": False, "reason": "healthy plants not reported"}

    resolved_state = state
    if city and not resolved_state:
        resolved_state = CITY_TO_STATE.get(city.lower().strip(), "Unknown")
    if not resolved_state:
        resolved_state = "Unknown"

    try:
        _init_db()
        conn = _get_db()
        conn.execute(
            "INSERT INTO reports (disease,state,city,source,timestamp) VALUES (?,?,?,?,?)",
            (disease, resolved_state, city, source, datetime.now().isoformat())
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"SQLite write failed, using JSON fallback: {e}")
        _json_append(disease, resolved_state, city)

    return {"success": True, "state": resolved_state}


def get_outbreak_summary():
    rows = _get_all_reports()
    state_disease = defaultdict(lambda: defaultdict(int))
    state_last    = defaultdict(str)
    state_user    = defaultdict(int)

    for r in rows:
        s = r["state"]
        if s not in INDIA_STATES:
            continue
        state_disease[s][r["disease"]] += 1
        if r["timestamp"] > state_last[s]:
            state_last[s] = r["timestamp"]
        if r.get("source") == "user":
            state_user[s] += 1

    result = {}
    for state, diseases in state_disease.items():
        total = sum(diseases.values())
        if total == 0:
            continue
        top3 = sorted(diseases.items(), key=lambda x: x[1], reverse=True)[:3]
        if total >= 60:   sev = "Critical"
        elif total >= 30: sev = "High"
        elif total >= 10: sev = "Moderate"
        else:             sev = "Low"
        info = INDIA_STATES[state]
        result[state] = {
            "state":        state,
            "abbr":         info["abbr"],
            "lat":          info["lat"],
            "lon":          info["lon"],
            "total_reports": total,
            "user_reports":  state_user[state],
            "severity":     sev,
            "top_disease":  top3[0][0].replace("___", " — ").replace("_", " "),
            "top_count":    top3[0][1],
            "last_reported": state_last[state],
            "top_diseases": [
                {"name": d[0].replace("___", " — ").replace("_", " "), "count": d[1]}
                for d in top3
            ],
        }
    return result


def get_national_stats():
    rows = _get_all_reports()
    disease_totals = defaultdict(int)
    user_total = 0
    for r in rows:
        disease_totals[r["disease"]] += 1
        if r.get("source") == "user":
            user_total += 1
    top5 = sorted(disease_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    states_hit = len(set(r["state"] for r in rows if r["state"] in INDIA_STATES))
    return {
        "total_reports":   sum(disease_totals.values()),
        "user_reports":    user_total,
        "states_affected": states_hit,
        "top_diseases":    [{"name": d[0].replace("___"," — ").replace("_"," "), "count": d[1]} for d in top5],
        "last_updated":    datetime.now().isoformat(),
    }


def get_recent_reports(limit=20):
    rows = _get_all_reports(source_filter="user")
    rows_sorted = sorted(rows, key=lambda x: x["timestamp"], reverse=True)[:limit]
    return [
        {
            "disease":   r["disease"].replace("___", " — ").replace("_", " "),
            "state":     r["state"],
            "timestamp": r["timestamp"],
        }
        for r in rows_sorted
    ]


try:
    _init_db()
except Exception as e:
    print(f"DB init warning: {e}")