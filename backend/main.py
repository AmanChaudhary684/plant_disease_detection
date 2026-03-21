"""
Plant Disease Detection — FastAPI Backend v3.0
DTI Project | 38 Disease Classes | SWIN Transformer
Run: uvicorn main:app --reload --port 8000
"""

import base64
from fastapi.responses import JSONResponse
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import json, io
import numpy as np
from pathlib import Path
import timm
from datetime import datetime
from weather_service import get_weather, get_coordinates_from_city, calculate_disease_risk
from community_outbreak_service import (
    record_outbreak, get_outbreak_summary, get_national_stats,
    get_recent_reports, get_weekly_outbreak_summary, get_timeseries_trend
)
from pydantic import BaseModel
from typing import Optional

app = FastAPI(
    title="🌿 Plant Disease Detection API v3.0",
    description="SWIN Transformer — 38 disease classes across 14 crop types. Real-world accuracy: 73.19%",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Community Request Model ───────────────────────────────────────────────────
class CommunityReportRequest(BaseModel):
    disease: str
    state: str
    city: Optional[str] = None

# ── Community Routes ──────────────────────────────────────────────────────────
@app.post("/api/community/report")
async def submit_community_report(req: CommunityReportRequest):
    if not req.disease or not req.state:
        return {"success": False, "reason": "disease and state required"}
    result = record_outbreak(disease=req.disease, state=req.state, city=req.city, source="user")
    return {
        "success": result["success"],
        "state": result.get("state"),
        "message": f"Report submitted for {result.get('state')}!"
    }

@app.get("/api/community/map")
async def get_community_map():
    summary = get_outbreak_summary()
    return {"success": True, "data": summary, "total_states": len(summary)}

@app.get("/api/community/stats")
async def get_community_stats():
    return {"success": True, "data": get_national_stats()}

@app.get("/api/community/recent")
async def get_recent_community_reports(limit: int = 20):
    return {"success": True, "data": get_recent_reports(limit=limit)}

@app.get("/api/community/map/week")
async def get_weekly_map(weeks_ago: int = 0):
    if weeks_ago < 0 or weeks_ago > 11:
        weeks_ago = max(0, min(11, weeks_ago))
    data = get_weekly_outbreak_summary(weeks_ago=weeks_ago)
    return {"success": True, **data}

@app.get("/api/community/map/timeseries")
async def get_timeseries_map(weeks: int = 4):
    if weeks < 2 or weeks > 12:
        weeks = max(2, min(12, weeks))
    data = get_timeseries_trend(num_weeks=weeks)
    return {"success": True, **data}


# ── Disease Database ──────────────────────────────────────────────────────────
DISEASE_INFO = {
    "Apple___Apple_scab": {
        "description": "Apple scab caused by Venturia inaequalis is the most economically important apple disease worldwide.",
        "symptoms": ["Olive-green to brown velvety spots on leaves", "Scabby corky lesions on fruit surface", "Distorted fruit with cracked skin", "Premature leaf and fruit drop"],
        "causes": "Venturia inaequalis fungus. Spores released in spring during wet weather.",
        "organic_treatment": ["Apply sulfur-based fungicide from bud break", "Rake and destroy fallen leaves in autumn", "Prune to improve canopy air circulation"],
        "chemical_treatment": ["Myclobutanil (Rally) — 1.0g per liter water, apply at green tip stage, repeat every 10-14 days", "Captan 50% WP — 2.5g per liter water, spray every 7-10 days", "Trifloxystrobin (Flint) — 0.5g per liter water, every 14 days max 3 sprays"],
        "prevention": ["Plant scab-resistant apple varieties", "Annual canopy pruning for airflow", "Avoid overhead irrigation"],
        "severity": "High"
    },
    "Apple___Black_rot": {
        "description": "Black rot caused by Botryosphaeria obtusa affects apples worldwide causing frogeye leaf spot, fruit rot, and limb cankers.",
        "symptoms": ["Purple-bordered spots (frogeye) on leaves", "Dark rotting areas on fruit", "Mummified black fruit hanging on tree", "Sunken cankers on branches"],
        "causes": "Botryosphaeria obtusa fungus. Survives in mummified fruit and dead bark.",
        "organic_treatment": ["Remove all mummified fruit and infected branches", "Copper-based fungicide during growing season", "Prune cankers with sterilized tools"],
        "chemical_treatment": ["Captan 50% WP + Myclobutanil — Captan 2.5g/L + Myclobutanil 1.0g/L, spray every 7-10 days", "Thiophanate-methyl 70% WP — 1.5g per liter water, apply every 10-14 days", "Ziram 76% WDF — 3.0g per liter water, every 7-10 days"],
        "prevention": ["Remove mummies and dead wood in winter", "Avoid injuries to bark", "Maintain tree vigor with proper fertilization"],
        "severity": "High"
    },
    "Apple___Cedar_apple_rust": {
        "description": "Cedar-apple rust requires two hosts — apple and eastern red cedar/juniper — to complete its life cycle.",
        "symptoms": ["Bright orange-yellow spots on upper leaf surface", "Tube-like spore structures on leaf undersides", "Distorted and yellowing leaves", "Orange lesions on young fruit"],
        "causes": "Gymnosporangium juniperi-virginianae fungus alternates between apple and juniper trees.",
        "organic_treatment": ["Apply sulfur or copper fungicide from pink stage through petal fall", "Remove nearby juniper/cedar trees if possible", "Prune infected shoots"],
        "chemical_treatment": ["Myclobutanil (Immunox) — 1.5g per liter water, apply from pink bud stage every 10-14 days", "Propiconazole 25% EC — 1.0ml per liter water, spray every 14 days", "Fenbuconazole (Indar) — 1.2ml per liter water, max 4 sprays per season"],
        "prevention": ["Plant rust-resistant apple varieties", "Remove eastern red cedar trees near orchard", "Apply preventive fungicide before spore release"],
        "severity": "Medium"
    },
    "Apple___healthy": {"description": "Your apple plant is healthy!", "symptoms": [], "causes": "N/A", "organic_treatment": ["Apply compost mulch", "Monitor monthly"], "chemical_treatment": [], "prevention": ["Annual dormant pruning", "Dormant oil spray in late winter"], "severity": "None"},
    "Blueberry___healthy": {"description": "Your blueberry plant is healthy!", "symptoms": [], "causes": "N/A", "organic_treatment": ["Maintain soil pH at 4.5-5.5", "Apply pine needle mulch"], "chemical_treatment": [], "prevention": ["Test soil pH annually", "Prune old canes every 2-3 years"], "severity": "None"},
    "Cherry_(including_sour)___Powdery_mildew": {
        "description": "Cherry powdery mildew caused by Podosphaera clandestina affects leaves, shoots, and fruit.",
        "symptoms": ["White powdery fungal growth on leaves", "Curling and distortion of infected leaves", "Rusty brown patches on fruit", "Stunted shoot growth"],
        "causes": "Podosphaera clandestina fungus. Thrives in warm days (20-27 degrees C) and cool nights.",
        "organic_treatment": ["Apply sulfur fungicide every 7-10 days", "Potassium bicarbonate spray", "Neem oil spray weekly"],
        "chemical_treatment": ["Myclobutanil 24.9% EC — 1.0ml per liter water, apply every 10-14 days max 5 sprays", "Trifloxystrobin 50% WG — 0.5g per liter water, spray every 14 days", "Quinoxyfen 25% EC — 0.5ml per liter water, preventive, every 10-14 days"],
        "prevention": ["Plant mildew-resistant varieties", "Prune for open canopy structure", "Avoid excessive nitrogen"],
        "severity": "Medium"
    },
    "Cherry_(including_sour)___healthy": {"description": "Your cherry tree is healthy!", "symptoms": [], "causes": "N/A", "organic_treatment": ["Apply compost mulch", "Deep water weekly"], "chemical_treatment": [], "prevention": ["Annual pruning to open canopy", "Dormant copper spray before bud break"], "severity": "None"},
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "description": "Gray leaf spot caused by Cercospora zeae-maydis is one of the most yield-limiting diseases of corn globally.",
        "symptoms": ["Rectangular gray to tan lesions on leaves", "Lesions bordered by leaf veins", "Lesions run parallel to leaf edges", "Severe infection causes entire leaf to die"],
        "causes": "Cercospora zeae-maydis fungus. Favored by warm (25-30 degrees C) humid conditions.",
        "organic_treatment": ["Remove and destroy infected crop debris", "Improve field drainage", "Apply copper-based fungicide at early detection"],
        "chemical_treatment": ["Azoxystrobin 23% SC (Amistar) — 1.0ml per liter water, apply at tasseling stage", "Propiconazole 25% EC (Tilt) — 1.0ml per liter water, spray at first sign repeat after 14 days", "Trifloxystrobin + Propiconazole (Quilt Xcel) — 1.5ml per liter water, every 14 days"],
        "prevention": ["Plant resistant hybrids", "Rotate corn with non-host crops", "Avoid excessive nitrogen"],
        "severity": "High"
    },
    "Corn_(maize)___Common_rust_": {
        "description": "Common rust caused by Puccinia sorghi can reduce yield significantly in severe years.",
        "symptoms": ["Brick-red to cinnamon-brown pustules on both leaf surfaces", "Yellow halo surrounding pustules", "Pustules turn dark brown-black late in season"],
        "causes": "Puccinia sorghi fungus. Wind-borne spores. Favored by cool temperatures (15-22 degrees C).",
        "organic_treatment": ["Apply sulfur-based fungicide at first sign", "Copper spray every 7-10 days"],
        "chemical_treatment": ["Propiconazole 25% EC (Tilt) — 1.0ml per liter water, spray at first pustule appearance", "Azoxystrobin 23% SC — 1.0ml per liter water, apply at silking stage", "Tebuconazole 25.9% EC — 1.0ml per liter water, repeat after 14 days"],
        "prevention": ["Plant rust-resistant corn hybrids", "Early planting to avoid peak infection periods"],
        "severity": "Medium"
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "description": "Northern leaf blight can cause 30-50% yield loss in severe cases.",
        "symptoms": ["Long cigar-shaped tan to gray-green lesions (2.5-15cm)", "Dark green water-soaked border early on", "Multiple lesions can girdle entire leaf"],
        "causes": "Exserohilum turcicum fungus. Favored by moderate temps (18-27 degrees C) and leaf wetness.",
        "organic_treatment": ["Crop residue management — bury or remove debris", "Copper fungicide at early detection"],
        "chemical_treatment": ["Azoxystrobin + Propiconazole (Quilt Xcel) — 1.5ml per liter water, apply at VT stage", "Pyraclostrobin 23.6% EC (Headline) — 1.0ml per liter water, apply at VT stage", "Trifloxystrobin 50% WG — 0.5g per liter water, max 2 applications"],
        "prevention": ["Plant NLB-resistant hybrids", "Rotate with non-corn crops for 1 year"],
        "severity": "High"
    },
    "Corn_(maize)___healthy": {"description": "Your corn plant is healthy!", "symptoms": [], "causes": "N/A", "organic_treatment": ["Maintain adequate soil moisture", "Scout weekly for pest signs"], "chemical_treatment": [], "prevention": ["Rotate crops annually", "Use disease-resistant hybrids"], "severity": "None"},
    "Grape___Black_rot": {
        "description": "Grape black rot caused by Guignardia bidwellii. Infected fruit becomes completely mummified.",
        "symptoms": ["Tan to brown circular spots with dark border on leaves", "Small black pustules in center of spots", "Infected berries turn brown then black and shrivel"],
        "causes": "Guignardia bidwellii fungus. Overwinters in mummified fruit. Spores released during rain.",
        "organic_treatment": ["Remove all mummified berries and infected canes", "Apply copper-based fungicide from bud break"],
        "chemical_treatment": ["Myclobutanil (Rally) — 1.0g per liter water, apply every 10-14 days from bud break", "Mancozeb 75% WP — 2.5g per liter water, protective spray every 7-10 days", "Tebuconazole 25.9% EC — 1.0ml per liter water, max 4 sprays per season"],
        "prevention": ["Remove all mummies in winter", "Train vines for good air circulation", "Avoid overhead irrigation"],
        "severity": "High"
    },
    "Grape___Esca_(Black_Measles)": {
        "description": "Esca (black measles) is a complex trunk disease. It is a chronic, incurable disease.",
        "symptoms": ["Tiger stripe pattern on leaves", "Berries show dark spots and crack", "Sudden vine collapse in hot weather — apoplexy"],
        "causes": "Complex of wood-infecting fungi. Enters through pruning wounds. No cure once infected.",
        "organic_treatment": ["Paint pruning wounds with wound sealant immediately", "Remove and destroy severely infected vines"],
        "chemical_treatment": ["Trichoderma-based biocontrol (Trichodex) — 10g per liter water, apply to pruning wounds", "Thiophanate-methyl 70% WP — 2.0g per liter water, apply as wound protectant", "Note: No systemic cure exists"],
        "prevention": ["Seal all pruning wounds within 30 minutes", "Disinfect pruning tools between vines with 1% bleach"],
        "severity": "High"
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "description": "Grape leaf blight causes significant defoliation in hot, humid regions including parts of India.",
        "symptoms": ["Dark brown irregular spots on older leaves", "Spots may have yellow halo", "Severe defoliation starting from older leaves"],
        "causes": "Isariopsis clavispora fungus. Favored by warm, humid conditions.",
        "organic_treatment": ["Apply copper hydroxide spray every 10 days", "Remove and destroy infected leaves"],
        "chemical_treatment": ["Mancozeb 75% WP — 2.5g per liter water, spray every 7-10 days", "Carbendazim 50% WP — 1.0g per liter water, apply every 10-14 days", "Copper oxychloride 50% WP — 3.0g per liter water, every 7-10 days"],
        "prevention": ["Train vines on trellis for good air circulation", "Avoid overhead irrigation"],
        "severity": "Medium"
    },
    "Grape___healthy": {"description": "Your grapevine is healthy!", "symptoms": [], "causes": "N/A", "organic_treatment": ["Apply compost around vine base in spring"], "chemical_treatment": [], "prevention": ["Annual dormant pruning — seal wounds immediately"], "severity": "None"},
    "Orange___Haunglongbing_(Citrus_greening)": {
        "description": "Citrus greening (HLB) is the most devastating citrus disease globally. There is currently NO cure.",
        "symptoms": ["Asymmetric yellow mottling on leaves (blotchy mottle)", "Small lopsided bitter fruit", "Twig and branch dieback", "Stunted growth and general decline"],
        "causes": "Caused by bacteria spread by Asian citrus psyllid. Once infected, tree cannot be cured.",
        "organic_treatment": ["Remove and destroy infected trees immediately", "Control Asian citrus psyllid with neem oil — 5ml per liter water"],
        "chemical_treatment": ["Imidacloprid 17.8% SL (Confidor) — 0.5ml per liter water for foliar spray for psyllid control", "Thiamethoxam 25% WG (Actara) — 0.4g per liter water, spray every 21 days", "Spirotetramat 15% OD (Movento) — 1.5ml per liter water, apply every 30 days"],
        "prevention": ["Purchase only certified disease-free nursery stock", "Control psyllid populations aggressively", "Report suspected cases to agricultural authorities immediately"],
        "severity": "High"
    },
    "Peach___Bacterial_spot": {
        "description": "Peach bacterial spot affects leaves, fruit, and twigs of peach and stone fruits.",
        "symptoms": ["Small water-soaked spots on leaves becoming angular and brown", "Spots drop out leaving shot-hole appearance", "Sunken dark spots on fruit"],
        "causes": "Xanthomonas arboricola pv. pruni bacteria. Favored by warm (24-28 degrees C) wet weather.",
        "organic_treatment": ["Apply copper-based bactericide from petal fall", "Avoid overhead irrigation"],
        "chemical_treatment": ["Copper hydroxide 77% WP + Mancozeb — Copper 3.0g/L + Mancozeb 2.0g/L, spray every 7-10 days", "Oxytetracycline (where permitted) — 1.5g per liter water, every 7 days", "Copper octanoate 10% EC — 2.0ml per liter water, every 7-10 days"],
        "prevention": ["Plant resistant peach varieties", "Avoid excessive nitrogen fertilization"],
        "severity": "Medium"
    },
    "Peach___healthy": {"description": "Your peach tree is healthy!", "symptoms": [], "causes": "N/A", "organic_treatment": ["Thin fruit for better sizing", "Apply compost mulch"], "chemical_treatment": [], "prevention": ["Apply dormant copper spray before bud swell"], "severity": "None"},
    "Pepper__bell___Bacterial_spot": {
        "description": "Bacterial spot is one of the most damaging pepper diseases. Thrives in warm, wet, windy conditions.",
        "symptoms": ["Small water-soaked spots turning brown/black on leaves", "Spots surrounded by yellow halo", "Raised scab-like lesions on fruit"],
        "causes": "Xanthomonas campestris pv. vesicatoria. Spreads through rain splash and contaminated tools.",
        "organic_treatment": ["Copper-based bactericide every 7 days", "Remove and destroy infected plant parts immediately"],
        "chemical_treatment": ["Copper oxychloride 50% WP — 3.0g per liter water, spray every 7-10 days", "Streptomycin sulfate 90% SP — 0.5g per liter water, apply every 7 days", "Mancozeb 75% WP + Copper oxychloride — Mancozeb 2.0g/L + Copper 1.5g/L, every 7 days"],
        "prevention": ["Use certified disease-free seeds", "Rotate crops for 2-3 years", "Maintain proper plant spacing"],
        "severity": "High"
    },
    "Pepper__bell___healthy": {"description": "Your pepper plant is healthy!", "symptoms": [], "causes": "N/A", "organic_treatment": ["Continue regular watering and fertilization"], "chemical_treatment": [], "prevention": ["Water at soil level to prevent spread"], "severity": "None"},
    "Potato___Early_blight": {
        "description": "Early blight caused by Alternaria solani is one of the most common potato diseases worldwide.",
        "symptoms": ["Dark brown circular spots with concentric rings (target pattern)", "Yellow area surrounding spots", "Lower/older leaves affected first"],
        "causes": "Alternaria solani fungus. Favored by warm days (24-29 degrees C) and cool nights with heavy dew.",
        "organic_treatment": ["Copper-based fungicide every 7-10 days", "Neem oil spray weekly", "Remove infected leaves"],
        "chemical_treatment": ["Mancozeb 75% WP — 2.5g per liter water, protective spray every 7 days", "Chlorothalonil 75% WP — 2.0g per liter water, broad-spectrum, spray every 7 days", "Azoxystrobin 23% SC — 1.0ml per liter water, apply every 10-14 days max 3 sprays"],
        "prevention": ["Use certified disease-free seed tubers", "3-year crop rotation", "Avoid excessive nitrogen"],
        "severity": "Medium"
    },
    "Potato___Late_blight": {
        "description": "Late blight caused by Phytophthora infestans — it caused the Irish Potato Famine. Spreads extremely rapidly.",
        "symptoms": ["Water-soaked pale green to brown spots on leaves", "White mold on underside of leaves in humid conditions", "Dark brown lesions on stems", "Reddish-brown dry rot inside infected tubers"],
        "causes": "Phytophthora infestans oomycete. Thrives at 10-20 degrees C with high humidity. Can destroy a field in days.",
        "organic_treatment": ["Apply copper hydroxide immediately upon detection", "Remove and destroy ALL infected plant material", "Stop all overhead irrigation completely"],
        "chemical_treatment": ["Metalaxyl 8% + Mancozeb 64% WP (Ridomil Gold MZ) — 2.5g per liter water, spray every 5-7 days", "Cymoxanil 8% + Mancozeb 64% WP — 3.0g per liter water, spray every 5-7 days", "Dimethomorph 50% WP — 1.0g per liter water, rotate with other fungicides, apply every 7 days"],
        "prevention": ["Use late-blight resistant varieties", "Avoid planting in low-lying areas", "Monitor weather — spray preventively before rain"],
        "severity": "High"
    },
    "Potato___healthy": {"description": "Your potato plant looks healthy!", "symptoms": [], "causes": "N/A", "organic_treatment": ["Apply compost for soil health", "Regular hilling to protect tubers"], "chemical_treatment": [], "prevention": ["Use certified seed potatoes", "Maintain proper spacing (30-45cm)"], "severity": "None"},
    "Raspberry___healthy": {"description": "Your raspberry plant is healthy!", "symptoms": [], "causes": "N/A", "organic_treatment": ["Apply straw mulch", "Remove old floricanes after fruiting"], "chemical_treatment": [], "prevention": ["Prune for good air circulation between canes"], "severity": "None"},
    "Soybean___healthy": {"description": "Your soybean plant is healthy!", "symptoms": [], "causes": "N/A", "organic_treatment": ["Inoculate seed with Rhizobium bacteria"], "chemical_treatment": [], "prevention": ["Rotate with non-legume crops every 2 years"], "severity": "None"},
    "Squash___Powdery_mildew": {
        "description": "Squash powdery mildew affects all cucurbits — squash, pumpkin, cucumber, melon.",
        "symptoms": ["White powdery spots on upper leaf surface", "Spots enlarge to cover entire leaf", "Yellowing and browning of infected leaves", "Plant weakens and fruit production drops"],
        "causes": "Podosphaera xanthii fungus. Thrives in warm (20-30 degrees C) dry weather with high humidity.",
        "organic_treatment": ["Apply potassium bicarbonate spray every 5-7 days", "Neem oil spray weekly", "Diluted milk spray (40% milk: 60% water) weekly"],
        "chemical_treatment": ["Sulfur 80% WG — 3.0g per liter water, spray every 7 days, do not apply above 32 degrees C", "Myclobutanil 24.9% EC — 1.0ml per liter water, apply every 10-14 days max 4 sprays", "Quinoxyfen 25% EC — 0.5ml per liter water, preventive spray every 10-14 days"],
        "prevention": ["Plant powdery mildew-resistant varieties", "Space plants widely for air circulation", "Avoid overhead watering"],
        "severity": "Medium"
    },
    "Strawberry___Leaf_scorch": {
        "description": "Strawberry leaf scorch causes purple-red spots that eventually cause leaf margins to look scorched.",
        "symptoms": ["Small purple to red spots on leaf upper surface", "Spots enlarge and centers turn gray-brown", "Leaf margins appear scorched/burned in severe cases"],
        "causes": "Diplocarpon earlianum fungus. Spreads via water splash. Favored by warm (20-25 degrees C) humid conditions.",
        "organic_treatment": ["Remove and destroy infected leaves", "Apply copper fungicide every 7-10 days", "Avoid overhead irrigation"],
        "chemical_treatment": ["Captan 50% WP — 2.5g per liter water, protective spray every 7 days", "Myclobutanil 24.9% EC — 1.0ml per liter water, apply every 10-14 days", "Azoxystrobin 23% SC — 1.0ml per liter water, apply every 10-14 days"],
        "prevention": ["Plant resistant strawberry varieties", "Use raised beds for better drainage"],
        "severity": "Medium"
    },
    "Strawberry___healthy": {"description": "Your strawberry plant is healthy!", "symptoms": [], "causes": "N/A", "organic_treatment": ["Apply straw mulch to keep berries clean"], "chemical_treatment": [], "prevention": ["Replace plants every 3 years", "Use drip irrigation to keep foliage dry"], "severity": "None"},
    "Tomato___Bacterial_spot": {
        "description": "Tomato bacterial spot affects leaves, stems, and fruits. Most severe during warm, wet, windy weather.",
        "symptoms": ["Small dark water-soaked spots on leaves", "Spots turn brown with yellow halo", "Raised rough scabby spots on fruit"],
        "causes": "Xanthomonas perforans bacteria. Spreads via rain, irrigation, contaminated tools.",
        "organic_treatment": ["Copper-based bactericide every 7 days", "Remove infected leaves and fruits immediately"],
        "chemical_treatment": ["Copper hydroxide 77% WP — 3.0g per liter water, spray every 7 days", "Streptomycin sulfate 90% SP + Copper hydroxide — Streptomycin 0.5g/L + Copper 2.0g/L, every 7 days", "Kasugamycin 3% SL — 2.0ml per liter water, spray every 7-10 days"],
        "prevention": ["Purchase transplants from reputable nurseries", "Stake plants to improve air circulation"],
        "severity": "High"
    },
    "Tomato___Early_blight": {
        "description": "Tomato early blight starts on older leaves near the soil and moves upward.",
        "symptoms": ["Dark brown spots with concentric rings (bullseye pattern)", "Yellow chlorotic zone surrounding spots", "Lower leaves affected first"],
        "causes": "Alternaria solani fungus. Spreads by wind and rain.",
        "organic_treatment": ["Neem oil spray every 7 days — 5ml per liter water", "Copper oxychloride spray", "Remove infected lower leaves"],
        "chemical_treatment": ["Mancozeb 75% WP — 2.5g per liter water, protective spray every 7 days", "Azoxystrobin 23% SC — 1.0ml per liter water, apply every 10-14 days max 4 sprays", "Chlorothalonil 75% WP — 2.0g per liter water, spray every 7-10 days"],
        "prevention": ["Use disease-resistant tomato varieties", "Avoid overhead watering", "Remove plant debris after harvest"],
        "severity": "Medium"
    },
    "Tomato___Late_blight": {
        "description": "Late blight caused by Phytophthora infestans. Can destroy entire field in 48 hours.",
        "symptoms": ["Greasy water-soaked grey-green spots on leaves", "White fuzzy mold on leaf undersides", "Rapid wilting and collapse of entire plant"],
        "causes": "Phytophthora infestans oomycete. Spreads explosively in cool (10-20 degrees C) humid conditions.",
        "organic_treatment": ["Apply copper hydroxide immediately — 3.0g per liter water", "Remove and bag all infected material", "Stop all overhead irrigation"],
        "chemical_treatment": ["Metalaxyl 8% + Mancozeb 64% WP (Ridomil Gold MZ) — 2.5g per liter water, spray every 5-7 days", "Fenamidone 10% + Mancozeb 50% WG — 3.0g per liter water, spray every 7 days", "Cymoxanil 8% + Mancozeb 64% WP — 3.0g per liter water, rotate fungicides to prevent resistance"],
        "prevention": ["Plant late-blight resistant varieties", "Apply preventive fungicide before monsoon season"],
        "severity": "High"
    },
    "Tomato___Leaf_Mold": {
        "description": "Tomato leaf mold mainly affects greenhouse tomatoes but occurs in humid field conditions.",
        "symptoms": ["Pale green to yellow spots on upper leaf surface", "Olive-green to brown velvety mold on leaf underside", "Infected leaves curl, wither, and drop"],
        "causes": "Passalora fulva fungus. Thrives in high humidity (above 85%) at 22-25 degrees C.",
        "organic_treatment": ["Improve ventilation immediately", "Copper-based fungicide every 7 days — 3.0g per liter water"],
        "chemical_treatment": ["Mancozeb 75% WP — 2.5g per liter water, spray every 7-10 days", "Difenoconazole 25% EC — 0.5ml per liter water, apply every 10-14 days", "Chlorothalonil 75% WP — 2.0g per liter water, spray every 7-10 days"],
        "prevention": ["Use resistant tomato varieties", "Maintain humidity below 85%"],
        "severity": "Medium"
    },
    "Tomato___Septoria_leaf_spot": {
        "description": "Septoria leaf spot rarely kills plants but causes severe defoliation reducing yield.",
        "symptoms": ["Many small circular spots (3-5mm) with dark border and grey center", "Lower leaves affected first", "Heavy defoliation exposes fruit to sunscald"],
        "causes": "Septoria lycopersici fungus. Spreads via rain splash.",
        "organic_treatment": ["Remove infected lower leaves", "Copper fungicide every 7-10 days — 3.0g per liter water"],
        "chemical_treatment": ["Mancozeb 75% WP — 2.5g per liter water, spray every 7 days", "Chlorothalonil 75% WP — 2.0g per liter water, spray every 7-10 days", "Azoxystrobin 23% SC — 1.0ml per liter water, apply every 10-14 days"],
        "prevention": ["Use drip irrigation", "Stake plants for better air circulation", "Rotate crops — wait 3 years"],
        "severity": "Medium"
    },
    "Tomato___Spider_mites_Two_spotted_spider_mite": {
        "description": "Two-spotted spider mites thrive in hot, dry conditions and can rapidly defoliate plants.",
        "symptoms": ["Tiny yellow or white stippling on upper leaf surface", "Fine silky webbing on leaf undersides", "Leaves turn bronze, yellow, then dry out"],
        "causes": "Tetranychus urticae mites. Thrives in hot (27-35 degrees C) dry conditions.",
        "organic_treatment": ["Spray forceful water jets on leaf undersides", "Neem oil + dish soap spray every 3-5 days — 5ml neem oil + 2ml soap per liter"],
        "chemical_treatment": ["Abamectin 1.9% EC (Vertimec) — 0.5ml per liter water, spray on leaf undersides every 7 days", "Spiromesifen 22.9% SC (Oberon) — 1.0ml per liter water, kills eggs and adults, every 14 days", "Fenazaquin 10% EC — 1.5ml per liter water, rotate with other miticides, every 14 days"],
        "prevention": ["Maintain adequate soil moisture", "Avoid excessive nitrogen fertilization"],
        "severity": "High"
    },
    "Tomato___Target_Spot": {
        "description": "Target spot caused by Corynespora cassiicola affects tomato leaves, stems, and fruits.",
        "symptoms": ["Brown circular spots with concentric rings (target pattern)", "Spots enlarge and merge causing large dead areas", "Fruit spots cause post-harvest rot"],
        "causes": "Corynespora cassiicola fungus. Favored by warm (25-30 degrees C) humid conditions.",
        "organic_treatment": ["Copper-based fungicide every 7-10 days", "Remove and destroy infected leaves"],
        "chemical_treatment": ["Mancozeb 75% WP + Carbendazim 50% WP — Mancozeb 2.0g/L + Carbendazim 1.0g/L, spray every 7-10 days", "Tebuconazole 25.9% EC — 1.0ml per liter water, apply every 10-14 days", "Azoxystrobin 23% SC — 1.0ml per liter water, spray every 10-14 days"],
        "prevention": ["Use drip irrigation", "Remove plant debris after harvest"],
        "severity": "Medium"
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "description": "TYLCV transmitted by whiteflies can cause total crop loss. No cure once infected.",
        "symptoms": ["Upward curling and cupping of leaves", "Yellow margins on leaves", "Stunted bushy plant growth", "Flowers drop without setting fruit"],
        "causes": "TYLCV virus transmitted by silverleaf whitefly (Bemisia tabaci). No cure.",
        "organic_treatment": ["Remove and destroy infected plants immediately", "Neem oil spray — 5ml per liter water weekly", "Yellow sticky traps — 25 traps per hectare"],
        "chemical_treatment": ["Imidacloprid 17.8% SL (Confidor) — 0.5ml per liter water for whitefly control", "Thiamethoxam 25% WG (Actara) — 0.4g per liter water, spray every 14-21 days", "Spirotetramat 15% OD (Movento) — 1.5ml per liter water, apply every 21-28 days"],
        "prevention": ["Use TYLCV-resistant varieties", "Cover seedlings with insect-proof nets (50 mesh)", "Remove weeds around field"],
        "severity": "High"
    },
    "Tomato___Tomato_mosaic_virus": {
        "description": "Tomato mosaic virus (ToMV) spreads through contact. Extremely stable — survives for years in plant debris.",
        "symptoms": ["Mosaic pattern of light and dark green on leaves", "Distorted fern-like or narrow leaves", "Stunted plant growth"],
        "causes": "Tomato mosaic virus (ToMV). Spreads through mechanical contact.",
        "organic_treatment": ["No cure — remove and destroy infected plants", "Wash hands with soap before touching plants"],
        "chemical_treatment": ["No direct chemical cure for viral diseases exists", "Imidacloprid 17.8% SL — 0.5ml per liter water, to control aphid vectors, spray every 14 days", "Mineral oil spray — 10ml per liter water, to reduce mechanical transmission"],
        "prevention": ["Use ToMV-resistant varieties", "Disinfect tools with 10% bleach solution", "Do not use tobacco products near tomato plants"],
        "severity": "High"
    },
    "Tomato___healthy": {"description": "Your tomato plant is healthy!", "symptoms": [], "causes": "N/A", "organic_treatment": ["Continue drip irrigation", "Apply compost monthly"], "chemical_treatment": [], "prevention": ["Stake plants as they grow", "Preventive neem oil spray every 15 days"], "severity": "None"},
    # Alternate key names for compatibility
    "Tomato_Bacterial_spot": {"description": "Tomato bacterial spot.", "symptoms": ["Small dark water-soaked spots on leaves", "Raised rough scabby spots on fruit"], "causes": "Xanthomonas perforans bacteria.", "organic_treatment": ["Copper-based bactericide every 7 days"], "chemical_treatment": ["Copper hydroxide 77% WP — 3.0g per liter water, spray every 7 days"], "prevention": ["Stake plants to improve air circulation"], "severity": "High"},
    "Tomato_Early_blight": {"description": "Tomato early blight.", "symptoms": ["Dark brown spots with concentric rings", "Lower leaves affected first"], "causes": "Alternaria solani fungus.", "organic_treatment": ["Neem oil spray every 7 days"], "chemical_treatment": ["Mancozeb 75% WP — 2.5g per liter water, spray every 7 days"], "prevention": ["Avoid overhead watering"], "severity": "Medium"},
    "Tomato_Late_blight": {"description": "Tomato late blight.", "symptoms": ["Greasy water-soaked spots on leaves", "Rapid wilting"], "causes": "Phytophthora infestans oomycete.", "organic_treatment": ["Apply copper hydroxide immediately"], "chemical_treatment": ["Metalaxyl 8% + Mancozeb 64% WP — 2.5g per liter water, spray every 5-7 days"], "prevention": ["Plant late-blight resistant varieties"], "severity": "High"},
    "Tomato_Leaf_Mold": {"description": "Tomato leaf mold.", "symptoms": ["Pale green to yellow spots on upper leaf surface", "Velvety mold on leaf underside"], "causes": "Passalora fulva fungus.", "organic_treatment": ["Improve ventilation immediately"], "chemical_treatment": ["Mancozeb 75% WP — 2.5g per liter water, spray every 7-10 days"], "prevention": ["Maintain humidity below 85%"], "severity": "Medium"},
    "Tomato_Septoria_leaf_spot": {"description": "Septoria leaf spot.", "symptoms": ["Small circular spots with dark border and grey center"], "causes": "Septoria lycopersici fungus.", "organic_treatment": ["Remove infected lower leaves"], "chemical_treatment": ["Mancozeb 75% WP — 2.5g per liter water, spray every 7 days"], "prevention": ["Rotate crops — wait 3 years"], "severity": "Medium"},
    "Tomato_Spider_mites_Two_spotted_spider_mite": {"description": "Two-spotted spider mites.", "symptoms": ["Tiny yellow stippling on leaves", "Fine silky webbing on leaf undersides"], "causes": "Tetranychus urticae mites.", "organic_treatment": ["Neem oil + soap spray every 3-5 days"], "chemical_treatment": ["Abamectin 1.9% EC — 0.5ml per liter water, spray on leaf undersides every 7 days"], "prevention": ["Maintain adequate soil moisture"], "severity": "High"},
    "Tomato__Target_Spot": {"description": "Target spot.", "symptoms": ["Brown circular spots with concentric rings"], "causes": "Corynespora cassiicola fungus.", "organic_treatment": ["Copper-based fungicide every 7-10 days"], "chemical_treatment": ["Mancozeb 75% WP + Carbendazim — Mancozeb 2.0g/L + Carbendazim 1.0g/L, every 7-10 days"], "prevention": ["Use drip irrigation"], "severity": "Medium"},
    "Tomato__Tomato_YellowLeaf__Curl_Virus": {"description": "TYLCV — no cure once infected.", "symptoms": ["Upward curling of leaves", "Yellow margins", "Stunted growth"], "causes": "TYLCV virus via whitefly.", "organic_treatment": ["Remove and destroy infected plants"], "chemical_treatment": ["Imidacloprid 17.8% SL — 0.5ml per liter water for whitefly control"], "prevention": ["Use TYLCV-resistant varieties"], "severity": "High"},
    "Tomato__Tomato_mosaic_virus": {"description": "Tomato mosaic virus.", "symptoms": ["Mosaic pattern on leaves", "Distorted narrow leaves"], "causes": "ToMV spreads through contact.", "organic_treatment": ["No cure — remove infected plants"], "chemical_treatment": ["No direct chemical cure", "Imidacloprid 17.8% SL — 0.5ml per liter water for aphid control"], "prevention": ["Use ToMV-resistant varieties", "Disinfect tools with 10% bleach"], "severity": "High"},
    "Tomato_healthy": {"description": "Your tomato plant is healthy!", "symptoms": [], "causes": "N/A", "organic_treatment": ["Continue drip irrigation"], "chemical_treatment": [], "prevention": ["Stake plants as they grow"], "severity": "None"},
}


def get_disease_info(class_name: str) -> dict:
    if class_name in DISEASE_INFO:
        return DISEASE_INFO[class_name]
    normalized = class_name.replace(" ", "_").replace("-", "_")
    for key in DISEASE_INFO:
        if key.replace(" ", "_") == normalized:
            return DISEASE_INFO[key]
    class_lower = class_name.lower()
    for key in DISEASE_INFO:
        if key.lower() in class_lower or class_lower in key.lower():
            return DISEASE_INFO[key]
    parts = class_name.replace("___", " ").replace("_", " ").split()
    plant = parts[0] if parts else "Plant"
    return {
        "description": f"Disease detected in {plant}. Please consult a local agricultural expert.",
        "symptoms": ["Visual disease symptoms detected in leaf image"],
        "causes": "Consult agricultural extension resources for details.",
        "organic_treatment": ["Isolate affected plants", "Consult local agricultural expert"],
        "chemical_treatment": ["Consult local agricultural expert"],
        "prevention": ["Regular monitoring", "Good agricultural practices"],
        "severity": "Unknown"
    }

# ── SWIN Transformer Model Definition ────────────────────────────────────────
class SWINWithDropout(nn.Module):
    def __init__(self, base, num_classes, dropout=0.3):
        super().__init__()
        self.base      = base
        in_features    = base.num_features
        self.dropout   = nn.Dropout(p=dropout)
        self.head      = nn.Linear(in_features, num_classes)

    def forward(self, x):
        return self.head(self.dropout(self.base(x)))

# ── Model State ───────────────────────────────────────────────────────────────
model_state = {"model": None, "class_names": None, "device": None, "loaded": False}

@app.on_event("startup")
async def load_model():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model_state["device"] = device
    MODEL_PATH    = Path("best_model.pth")
    METADATA_PATH = Path("model_metadata.json")

    if MODEL_PATH.exists() and METADATA_PATH.exists():
        try:
            with open(METADATA_PATH) as f:
                metadata = json.load(f)
            class_names = metadata["class_names"]
            num_classes  = metadata["num_classes"]

            # ── Load SWIN Transformer ──────────────────────────────────────────
            swin_base = timm.create_model(
                'swin_base_patch4_window7_224',
                pretrained=False,
                num_classes=0   # remove head — we add our own
            )
            model = SWINWithDropout(swin_base, num_classes=num_classes, dropout=0.3)
            checkpoint = torch.load(MODEL_PATH, map_location=device)
            model.load_state_dict(checkpoint['model_state_dict'])
            model.to(device)
            model.eval()
            model_state.update({"model": model, "class_names": class_names, "loaded": True})
            print(f"✅ SWIN Transformer loaded! Classes: {num_classes}, Device: {device}")

        except Exception as e:
            print(f"⚠️  Could not load SWIN model: {e}")
            print("   Falling back to EfficientNet-B3...")
            try:
                # Fallback to EfficientNet-B3 if SWIN fails
                with open(METADATA_PATH) as f:
                    metadata = json.load(f)
                class_names = metadata["class_names"]
                num_classes  = metadata["num_classes"]
                model = timm.create_model("efficientnet_b3", pretrained=False, num_classes=num_classes)
                checkpoint = torch.load(MODEL_PATH, map_location=device)
                state_dict = checkpoint["model_state_dict"]
                if any(k.startswith("base.") for k in state_dict.keys()):
                    new_state_dict = {}
                    for k, v in state_dict.items():
                        if k.startswith("base."):
                            new_k = k[len("base."):].replace("classifier.1.", "classifier.")
                            new_state_dict[new_k] = v
                    state_dict = new_state_dict
                model.load_state_dict(state_dict)
                model.to(device)
                model.eval()
                model_state.update({"model": model, "class_names": class_names, "loaded": True})
                print(f"✅ EfficientNet-B3 fallback loaded! Classes: {num_classes}")
            except Exception as e2:
                print(f"⚠️  Fallback also failed: {e2}")
    else:
        print("⚠️  Model files not found. Running in demo mode.")

IMG_TRANSFORM = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

@app.get("/")
def root():
    return {"message": "🌿 Plant Disease Detection API v3.0 — SWIN Transformer", "model_loaded": model_state["loaded"], "docs": "/docs"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "model_loaded": model_state["loaded"], "device": str(model_state["device"]), "timestamp": datetime.now().isoformat()}

@app.get("/api/diseases")
def get_all_diseases():
    classes = model_state["class_names"] or list(DISEASE_INFO.keys())
    diseases = [{"id": cls, "display_name": cls.replace("___", " — ").replace("_", " "), **get_disease_info(cls)} for cls in classes]
    return {"diseases": diseases, "total": len(diseases)}

@app.post("/api/detect")
async def detect_disease(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload JPG or PNG.")
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        if model_state["loaded"] and model_state["model"]:
            tensor = IMG_TRANSFORM(img).unsqueeze(0).to(model_state["device"])
            with torch.no_grad():
                logits = model_state["model"](tensor)
                probs  = torch.softmax(logits, dim=1)[0]
            top_probs, top_idxs = probs.topk(5)
            predictions = [
                {"class_id": model_state["class_names"][idx.item()],
                 "display_name": model_state["class_names"][idx.item()].replace("___", " — ").replace("_", " "),
                 "confidence": round(prob.item() * 100, 2),
                 "confidence_raw": prob.item()}
                for prob, idx in zip(top_probs, top_idxs)
            ]
        else:
            predictions = [{"class_id": "Tomato_Early_blight", "display_name": "Tomato — Early blight", "confidence": 87.3, "confidence_raw": 0.873}]

        top_class    = predictions[0]["class_id"]
        disease_info = get_disease_info(top_class)
        is_healthy   = "healthy" in top_class.lower()

        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "image_info": {"filename": file.filename, "size_bytes": len(contents)},
            "diagnosis": {
                "top_prediction": predictions[0],
                "all_predictions": predictions,
                "is_healthy": is_healthy,
                "confidence_level": ("High" if predictions[0]["confidence"] > 80 else "Medium" if predictions[0]["confidence"] > 60 else "Low — consider expert consultation"),
            },
            "disease_info": disease_info,
            "disclaimer": "This is an AI-based preliminary diagnosis. For high-value crops, please consult a certified agricultural expert."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/api/diseases/{disease_id}")
def get_disease_detail(disease_id: str):
    return {"disease_id": disease_id, "display_name": disease_id.replace("___", " — ").replace("_", " "), **get_disease_info(disease_id)}

# ── Weather Routes ─────────────────────────────────────────────────────────────
@app.get("/api/weather")
async def get_weather_data(lat: float = None, lon: float = None, city: str = None):
    if city and (lat is None or lon is None):
        coords = await get_coordinates_from_city(city)
        if coords:
            lat, lon = coords
        else:
            raise HTTPException(status_code=404, detail=f"City '{city}' not found.")
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Provide ?lat=&lon= or ?city=")
    weather = await get_weather(lat, lon)
    if not weather:
        raise HTTPException(status_code=503, detail="Weather service unavailable.")
    risk = calculate_disease_risk(weather, "")
    return {"success": True, "location": {"lat": lat, "lon": lon, "city": city or ""}, "weather": weather, "disease_risk": risk}

@app.get("/api/weather/risk")
async def get_weather_risk(lat: float = None, lon: float = None, city: str = None, disease: str = ""):
    if city and (lat is None or lon is None):
        coords = await get_coordinates_from_city(city)
        if coords:
            lat, lon = coords
        else:
            raise HTTPException(status_code=404, detail=f"City '{city}' not found.")
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Provide ?lat=&lon= or ?city=")
    weather = await get_weather(lat, lon)
    if not weather:
        return {"success": False, "message": "Weather data unavailable", "weather": None, "disease_risk": None}
    risk = calculate_disease_risk(weather, disease)
    return {"success": True, "location": {"lat": lat, "lon": lon, "city": city or ""}, "disease": disease, "weather": weather, "disease_risk": risk}

def generate_gradcam(model, img_tensor, device, class_idx=None):
    """
    Generate Grad-CAM heatmap for SWIN Transformer.
    Works with both SWIN and EfficientNet-B3.
    Returns heatmap as numpy array (224x224, values 0-1).
    """
    model.eval()
    img_tensor = img_tensor.to(device)
    img_tensor.requires_grad_(False)
 
    gradients = []
    activations = []
 
    # ── Hook functions ─────────────────────────────────────────────────────────
    def save_gradient(grad):
        gradients.append(grad)
 
    def save_activation(module, input, output):
        activations.append(output)
        output.register_hook(save_gradient)
 
    # ── Find the last feature layer ────────────────────────────────────────────
    # For SWIN: hook into the last layer of base model
    # For EfficientNet: hook into last conv block
    hook_handle = None
 
    try:
        # Try SWIN architecture first
        if hasattr(model, 'base') and hasattr(model.base, 'layers'):
            # SWIN Transformer — hook last layer norm
            target_layer = model.base.layers[-1]
            hook_handle   = target_layer.register_forward_hook(save_activation)
        elif hasattr(model, 'blocks'):
            # EfficientNet-B3 direct
            target_layer = model.blocks[-1]
            hook_handle   = target_layer.register_forward_hook(save_activation)
        else:
            # Generic fallback
            layers = list(model.children())
            target_layer = layers[-2] if len(layers) > 1 else layers[-1]
            hook_handle   = target_layer.register_forward_hook(save_activation)
    except Exception:
        return None
 
    # ── Forward pass ───────────────────────────────────────────────────────────
    img_tensor.requires_grad_(True)
    try:
        output = model(img_tensor)
    except Exception:
        if hook_handle: hook_handle.remove()
        return None
 
    if hook_handle:
        hook_handle.remove()
 
    if not activations:
        return None
 
    # ── Get target class ───────────────────────────────────────────────────────
    if class_idx is None:
        class_idx = output.argmax(dim=1).item()
 
    # ── Backward pass for gradients ────────────────────────────────────────────
    model.zero_grad()
    score = output[0, class_idx]
    score.backward()
 
    if not gradients:
        return None
 
    # ── Compute Grad-CAM ───────────────────────────────────────────────────────
    grad   = gradients[0].detach().cpu()   # shape varies by model
    activ  = activations[0].detach().cpu()
 
    # Handle SWIN output shape: [B, H*W, C] or [B, C, H, W]
    if grad.dim() == 3:
        # SWIN: [B, seq_len, channels] → reshape to spatial
        B, seq_len, C = grad.shape
        H = W = int(seq_len ** 0.5)
        if H * W != seq_len:
            # Not square — use global average
            weights = grad.mean(dim=1)        # [B, C]
            cam     = (weights.unsqueeze(1) * activ).sum(dim=2)  # [B, seq_len]
            cam     = cam[0].reshape(int(seq_len**0.5), -1)
        else:
            grad_reshaped  = grad[0].reshape(H, W, C).permute(2, 0, 1)   # [C, H, W]
            activ_reshaped = activ[0].reshape(H, W, C).permute(2, 0, 1)  # [C, H, W]
            weights = grad_reshaped.mean(dim=(1, 2))   # [C]
            cam     = (weights[:, None, None] * activ_reshaped).sum(dim=0)  # [H, W]
    elif grad.dim() == 4:
        # Conv: [B, C, H, W]
        weights = grad[0].mean(dim=(1, 2))    # [C]
        cam     = (weights[:, None, None] * activ[0]).sum(dim=0)  # [H, W]
    else:
        return None
 
    # ── Normalize heatmap ──────────────────────────────────────────────────────
    cam = cam.numpy()
    cam = np.maximum(cam, 0)   # ReLU
    if cam.max() > 0:
        cam = cam / cam.max()
    else:
        cam = np.zeros_like(cam)
 
    # Resize to 224x224
    import cv2
    cam_resized = cv2.resize(cam.astype(np.float32), (224, 224))
 
    return cam_resized
 
 
def apply_colormap(heatmap, original_img_array, alpha=0.45):
    """
    Overlay heatmap on original image using jet colormap.
    Returns blended image as numpy array (224x224x3, uint8).
    """
    import cv2
 
    # Apply colormap (jet: blue=low, green=medium, red=high activation)
    heatmap_uint8 = np.uint8(255 * heatmap)
    colored_map   = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    colored_map   = cv2.cvtColor(colored_map, cv2.COLOR_BGR2RGB)
 
    # Resize original image to 224x224
    orig_resized = cv2.resize(original_img_array, (224, 224))
 
    # Blend
    blended = (alpha * colored_map + (1 - alpha) * orig_resized).astype(np.uint8)
    return blended
 
 
@app.post("/api/detect/gradcam")
async def detect_with_gradcam(file: UploadFile = File(...)):
    """
    Disease detection + Grad-CAM heatmap visualization.
    Returns diagnosis + base64 heatmap image.
    """
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type.")
 
    try:
        import cv2
        contents = await file.read()
        pil_img  = Image.open(io.BytesIO(contents)).convert("RGB")
        img_array = np.array(pil_img)
 
        if not model_state["loaded"] or not model_state["model"]:
            raise HTTPException(status_code=503, detail="Model not loaded.")
 
        # ── Standard detection ─────────────────────────────────────────────────
        tensor = IMG_TRANSFORM(pil_img).unsqueeze(0).to(model_state["device"])
 
        with torch.no_grad():
            logits = model_state["model"](tensor)
            probs  = torch.softmax(logits, dim=1)[0]
 
        top_probs, top_idxs = probs.topk(5)
        predictions = [
            {
                "class_id":       model_state["class_names"][idx.item()],
                "display_name":   model_state["class_names"][idx.item()].replace("___", " — ").replace("_", " "),
                "confidence":     round(prob.item() * 100, 2),
                "confidence_raw": prob.item()
            }
            for prob, idx in zip(top_probs, top_idxs)
        ]
 
        top_class    = predictions[0]["class_id"]
        top_class_idx = top_idxs[0].item()
        disease_info = get_disease_info(top_class)
        is_healthy   = "healthy" in top_class.lower()
 
        # ── Grad-CAM ───────────────────────────────────────────────────────────
        gradcam_b64   = None
        heatmap_only_b64 = None
 
        try:
            # Need gradient-enabled tensor
            tensor_grad = IMG_TRANSFORM(pil_img).unsqueeze(0)
            heatmap = generate_gradcam(
                model_state["model"], tensor_grad,
                model_state["device"], class_idx=top_class_idx
            )
 
            if heatmap is not None:
                # Overlay on original image
                blended = apply_colormap(heatmap, img_array, alpha=0.45)
 
                # Convert blended to base64
                blended_pil = Image.fromarray(blended)
                buf = io.BytesIO()
                blended_pil.save(buf, format="JPEG", quality=90)
                gradcam_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
 
                # Heatmap only (for separate display)
                heatmap_uint8  = np.uint8(255 * heatmap)
                import cv2 as cv2_inner
                colored        = cv2_inner.applyColorMap(heatmap_uint8, cv2_inner.COLORMAP_JET)
                colored_rgb    = cv2_inner.cvtColor(colored, cv2_inner.COLOR_BGR2RGB)
                heatmap_pil    = Image.fromarray(colored_rgb)
                buf2 = io.BytesIO()
                heatmap_pil.save(buf2, format="JPEG", quality=85)
                heatmap_only_b64 = "data:image/jpeg;base64," + base64.b64encode(buf2.getvalue()).decode()
 
        except Exception as grad_err:
            print(f"Grad-CAM generation failed: {grad_err}")
            # Detection still works even if Grad-CAM fails
 
        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "image_info": {"filename": file.filename, "size_bytes": len(contents)},
            "diagnosis": {
                "top_prediction":    predictions[0],
                "all_predictions":   predictions,
                "is_healthy":        is_healthy,
                "confidence_level":  (
                    "High"   if predictions[0]["confidence"] > 80 else
                    "Medium" if predictions[0]["confidence"] > 60 else
                    "Low — consider expert consultation"
                ),
            },
            "disease_info":    disease_info,
            "gradcam": {
                "available":      gradcam_b64 is not None,
                "overlay_image":  gradcam_b64,        # original + heatmap blended
                "heatmap_image":  heatmap_only_b64,   # pure heatmap
                "description":    "Red/yellow areas show where the AI detected disease patterns. Blue areas are less relevant to the diagnosis.",
            },
            "disclaimer": "This is an AI-based preliminary diagnosis. For high-value crops, please consult a certified agricultural expert."
        }
 
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)