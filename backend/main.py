"""
Plant Disease Detection — FastAPI Backend v2.0
DTI Project | 38 Disease Classes
Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import torchvision.transforms as transforms
from PIL import Image
import json, io
import numpy as np
from pathlib import Path
import timm
from datetime import datetime
from weather_service import get_weather, get_coordinates_from_city, calculate_disease_risk
# ✅ FIX: Only community_outbreak_service — removed duplicate outbreak_service import
from community_outbreak_service import record_outbreak, get_outbreak_summary, get_national_stats, get_recent_reports

app = FastAPI(
    title="🌿 Plant Disease Detection API v2.0",
    description="EfficientNet-B3 — 38 disease classes across 14 crop types.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Community Reporting Routes ────────────────────────────────────────────────
from pydantic import BaseModel
from typing import Optional

class CommunityReportRequest(BaseModel):
    disease: str
    state: str
    city: Optional[str] = None

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

# ── Complete Disease Database — All 38 Classes ────────────────────────────────
DISEASE_INFO = {

    # ── APPLE (4 classes) ─────────────────────────────────────────────────────
    "Apple___Apple_scab": {
        "description": "Apple scab caused by Venturia inaequalis is the most economically important apple disease worldwide. It affects leaves, fruit, and shoots.",
        "symptoms": ["Olive-green to brown velvety spots on leaves", "Scabby corky lesions on fruit surface", "Distorted fruit with cracked skin", "Premature leaf and fruit drop"],
        "causes": "Venturia inaequalis fungus. Spores released in spring during wet weather. Survives winter in fallen leaves.",
        "organic_treatment": ["Apply sulfur-based fungicide from bud break", "Rake and destroy fallen leaves in autumn", "Prune to improve canopy air circulation", "Copper spray every 7–10 days during wet periods"],
        "chemical_treatment": ["Myclobutanil (Rally) at green tip stage", "Captan fungicide every 7–10 days", "Trifloxystrobin systemic fungicide"],
        "prevention": ["Plant scab-resistant apple varieties", "Annual canopy pruning for airflow", "Avoid overhead irrigation", "Apply dormant copper spray in early spring"],
        "severity": "High"
    },
    "Apple___Black_rot": {
        "description": "Black rot caused by Botryosphaeria obtusa affects apples worldwide. It causes frogeye leaf spot, fruit rot, and limb cankers.",
        "symptoms": ["Purple-bordered spots (frogeye) on leaves", "Dark rotting areas on fruit starting at calyx end", "Mummified black fruit hanging on tree", "Sunken cankers on branches"],
        "causes": "Botryosphaeria obtusa fungus. Survives in mummified fruit and dead bark. Spreads by rain. Stress worsens infection.",
        "organic_treatment": ["Remove all mummified fruit and infected branches", "Copper-based fungicide during growing season", "Prune cankers with sterilized tools", "Improve drainage around tree roots"],
        "chemical_treatment": ["Captan + myclobutanil combination", "Thiophanate-methyl fungicide", "Ziram spray every 7–10 days"],
        "prevention": ["Remove mummies and dead wood in winter", "Avoid injuries to bark during cultivation", "Maintain tree vigor with proper fertilization", "Plant resistant varieties where possible"],
        "severity": "High"
    },
    "Apple___Cedar_apple_rust": {
        "description": "Cedar-apple rust caused by Gymnosporangium juniperi-virginianae requires two hosts — apple and eastern red cedar/juniper — to complete its life cycle.",
        "symptoms": ["Bright orange-yellow spots on upper leaf surface", "Tube-like spore structures on leaf undersides", "Distorted and yellowing leaves", "Orange lesions on young fruit"],
        "causes": "Gymnosporangium juniperi-virginianae fungus alternates between apple and juniper/cedar trees. Spores spread by wind in spring.",
        "organic_treatment": ["Apply sulfur or copper fungicide from pink stage through petal fall", "Remove nearby juniper/cedar trees if possible", "Prune infected shoots and leaves"],
        "chemical_treatment": ["Myclobutanil (Immunox) — most effective", "Propiconazole systemic fungicide", "Fenbuconazole spray every 10–14 days"],
        "prevention": ["Plant rust-resistant apple varieties", "Remove eastern red cedar trees near orchard", "Apply preventive fungicide before spore release", "Monitor nearby cedar trees for orange galls in spring"],
        "severity": "Medium"
    },
    "Apple___healthy": {
        "description": "Your apple plant is healthy! No disease detected. Continue your current orchard management practices.",
        "symptoms": [],
        "causes": "N/A",
        "organic_treatment": ["Apply compost mulch around tree base", "Thin fruit for better air circulation", "Monitor monthly for early signs"],
        "chemical_treatment": [],
        "prevention": ["Annual dormant pruning", "Dormant oil spray in late winter", "Regular soil pH monitoring (6.0–6.5)", "Remove fallen leaves and fruit promptly"],
        "severity": "None"
    },

    # ── BLUEBERRY (1 class) ───────────────────────────────────────────────────
    "Blueberry___healthy": {
        "description": "Your blueberry plant is healthy! No disease signs detected. Good job maintaining your plants.",
        "symptoms": [],
        "causes": "N/A",
        "organic_treatment": ["Maintain soil pH at 4.5–5.5 for blueberries", "Apply pine needle or bark mulch", "Water regularly — blueberries need consistent moisture"],
        "chemical_treatment": [],
        "prevention": ["Test soil pH annually", "Avoid over-fertilizing with nitrogen", "Prune old canes every 2–3 years", "Plant multiple varieties for cross-pollination"],
        "severity": "None"
    },

    # ── CHERRY (2 classes) ────────────────────────────────────────────────────
    "Cherry_(including_sour)___Powdery_mildew": {
        "description": "Cherry powdery mildew caused by Podosphaera clandestina affects leaves, shoots, and fruit of cherry trees. It is a major disease in many growing regions.",
        "symptoms": ["White powdery fungal growth on leaves and shoots", "Curling and distortion of infected leaves", "Rusty brown patches on fruit surface", "Stunted shoot growth"],
        "causes": "Podosphaera clandestina fungus. Spreads via airborne spores. Thrives in warm days (20–27°C) and cool nights with high humidity.",
        "organic_treatment": ["Apply sulfur fungicide every 7–10 days", "Potassium bicarbonate spray", "Neem oil spray weekly as preventive", "Improve air circulation by pruning"],
        "chemical_treatment": ["Myclobutanil systemic fungicide", "Trifloxystrobin spray", "Quinoxyfen preventive fungicide"],
        "prevention": ["Plant mildew-resistant varieties", "Prune for open canopy structure", "Avoid excessive nitrogen fertilization", "Apply dormant oil spray before bud break"],
        "severity": "Medium"
    },
    "Cherry_(including_sour)___healthy": {
        "description": "Your cherry tree is healthy! No powdery mildew or other diseases detected.",
        "symptoms": [],
        "causes": "N/A",
        "organic_treatment": ["Apply compost mulch 5–10cm deep around base", "Deep water weekly during dry periods", "Monitor for aphids on new growth"],
        "chemical_treatment": [],
        "prevention": ["Annual pruning to open canopy", "Whitewash trunk in winter to prevent frost cracks", "Net trees to protect fruit from birds", "Dormant copper spray before bud break"],
        "severity": "None"
    },

    # ── CORN (4 classes) ──────────────────────────────────────────────────────
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "description": "Gray leaf spot caused by Cercospora zeae-maydis is one of the most yield-limiting diseases of corn globally. It thrives in warm, humid conditions.",
        "symptoms": ["Rectangular gray to tan lesions on leaves", "Lesions bordered by leaf veins", "Lesions run parallel to leaf edges", "Severe infection causes entire leaf to die"],
        "causes": "Cercospora zeae-maydis fungus. Survives in corn debris. Spreads via wind. Favored by warm (25–30°C) humid conditions.",
        "organic_treatment": ["Remove and destroy infected crop debris after harvest", "Improve field drainage", "Apply copper-based fungicide at early detection"],
        "chemical_treatment": ["Azoxystrobin (Amistar) — most effective", "Propiconazole spray at tasseling", "Trifloxystrobin + propiconazole combination"],
        "prevention": ["Plant gray leaf spot-resistant hybrids", "Rotate corn with non-host crops for 1–2 years", "Avoid excessive nitrogen", "Ensure good field drainage"],
        "severity": "High"
    },
    "Corn_(maize)___Common_rust_": {
        "description": "Common rust caused by Puccinia sorghi occurs wherever corn is grown. It is generally less damaging than other rusts but can reduce yield significantly in severe years.",
        "symptoms": ["Brick-red to cinnamon-brown pustules scattered on both leaf surfaces", "Yellow halo surrounding pustules", "Pustules turn dark brown-black late in season", "Premature drying of severely infected leaves"],
        "causes": "Puccinia sorghi fungus. Wind-borne spores from southern regions. Favored by cool temperatures (15–22°C) and high humidity.",
        "organic_treatment": ["Apply sulfur-based fungicide at first sign", "Copper spray every 7–10 days", "Remove and destroy heavily infected leaves"],
        "chemical_treatment": ["Propiconazole (Tilt) spray", "Azoxystrobin systemic fungicide", "Tebuconazole at silking stage"],
        "prevention": ["Plant rust-resistant corn hybrids", "Early planting to avoid peak infection periods", "Monitor crops weekly during tasseling", "Scout from edges of field inward"],
        "severity": "Medium"
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "description": "Northern leaf blight caused by Exserohilum turcicum is a major foliar disease of corn in temperate regions. It can cause 30–50% yield loss in severe cases.",
        "symptoms": ["Long cigar-shaped tan to gray-green lesions (2.5–15cm)", "Lesions may have wavy, irregular margins", "Dark green water-soaked border early on", "Multiple lesions can girdle entire leaf"],
        "causes": "Exserohilum turcicum fungus. Overwinters in corn debris. Spores spread by wind and rain. Favored by moderate temps (18–27°C) and leaf wetness.",
        "organic_treatment": ["Crop residue management — bury or remove debris", "Copper fungicide at early detection", "Improve air circulation in dense plantings"],
        "chemical_treatment": ["Azoxystrobin + propiconazole (Quilt Xcel)", "Pyraclostrobin (Headline) at VT stage", "Trifloxystrobin spray every 14 days"],
        "prevention": ["Plant NLB-resistant hybrids — most important control", "Rotate with non-corn crops for 1 year", "Minimize corn-on-corn production", "Apply fungicide at tasseling in high-risk years"],
        "severity": "High"
    },
    "Corn_(maize)___healthy": {
        "description": "Your corn plant is healthy! No disease signs detected. Your field management is on track.",
        "symptoms": [],
        "causes": "N/A",
        "organic_treatment": ["Side-dress nitrogen at knee-high stage", "Maintain adequate soil moisture", "Scout weekly for pest and disease signs"],
        "chemical_treatment": [],
        "prevention": ["Rotate crops annually", "Use disease-resistant hybrids", "Ensure balanced fertilization", "Monitor for aphids and beetles that spread viruses"],
        "severity": "None"
    },

    # ── GRAPE (4 classes) ─────────────────────────────────────────────────────
    "Grape___Black_rot": {
        "description": "Grape black rot caused by Guignardia bidwellii is one of the most destructive grape diseases. Infected fruit becomes completely mummified.",
        "symptoms": ["Tan to brown circular spots with dark border on leaves", "Small black pustules (pycnidia) in center of spots", "Infected berries turn brown then black and shrivel", "Mummified black berries remain attached to cluster"],
        "causes": "Guignardia bidwellii fungus. Overwinters in mummified fruit and infected canes. Spores released during rain. Infects all green tissue.",
        "organic_treatment": ["Remove all mummified berries and infected canes", "Apply copper-based fungicide from bud break", "Ensure good canopy ventilation through shoot positioning"],
        "chemical_treatment": ["Myclobutanil (Rally) every 10–14 days", "Mancozeb protective fungicide", "Tebuconazole systemic fungicide"],
        "prevention": ["Remove all mummies in winter before bud break", "Train vines for good air circulation", "Avoid overhead irrigation", "Apply preventive fungicide program from early season"],
        "severity": "High"
    },
    "Grape___Esca_(Black_Measles)": {
        "description": "Esca (black measles) is a complex trunk disease of grapes associated with multiple wood-infecting fungi. It is a chronic, incurable disease.",
        "symptoms": ["Tiger stripe pattern on leaves (yellow/red between veins)", "Berries show dark spots and crack — black measles", "Sudden vine collapse in hot weather — apoplexy", "Internal wood shows dark streaking and necrosis"],
        "causes": "Complex of Phaeomoniella chlamydospora, Phaeoacremonium, and Fomitiporia fungi. Enters through pruning wounds. No cure once infected.",
        "organic_treatment": ["Paint pruning wounds with wound sealant immediately", "Remove and destroy severely infected vines", "Prune during dry weather to reduce infection risk"],
        "chemical_treatment": ["No effective chemical cure exists", "Apply Trichoderma-based biocontrol to pruning wounds", "Sodium arsenite (banned in many countries)"],
        "prevention": ["Use clean certified planting material", "Seal all pruning wounds within 30 minutes", "Prune during dry conditions", "Disinfect pruning tools between vines with bleach"],
        "severity": "High"
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "description": "Grape leaf blight caused by Isariopsis clavispora causes significant defoliation in hot, humid grape-growing regions including parts of India.",
        "symptoms": ["Dark brown irregular spots on older leaves", "Spots may have yellow halo", "Severe defoliation starting from older leaves", "Weakened vine with reduced fruit quality"],
        "causes": "Isariopsis clavispora fungus. Favored by warm, humid conditions. Common in tropical and subtropical regions.",
        "organic_treatment": ["Apply copper hydroxide spray every 10 days", "Remove and destroy infected leaves", "Improve canopy management for better airflow"],
        "chemical_treatment": ["Mancozeb 75% WP — 2.5g per liter", "Carbendazim fungicide spray", "Copper oxychloride every 7–10 days"],
        "prevention": ["Train vines on trellis for good air circulation", "Avoid overhead irrigation", "Apply preventive copper sprays during humid periods", "Remove fallen leaves from vineyard floor"],
        "severity": "Medium"
    },
    "Grape___healthy": {
        "description": "Your grapevine is healthy! No disease detected. Continue your vineyard management practices.",
        "symptoms": [],
        "causes": "N/A",
        "organic_treatment": ["Apply compost around vine base in spring", "Maintain balanced nutrition — avoid excess nitrogen", "Train shoots for open canopy"],
        "chemical_treatment": [],
        "prevention": ["Annual dormant pruning — seal wounds immediately", "Apply dormant sulfur or copper spray", "Monitor for leafhoppers and mites", "Ensure good drainage around vine roots"],
        "severity": "None"
    },

    # ── ORANGE (1 class) ──────────────────────────────────────────────────────
    "Orange___Haunglongbing_(Citrus_greening)": {
        "description": "Citrus greening (HLB) caused by Candidatus Liberibacter asiaticus is the most devastating citrus disease globally. There is currently NO cure.",
        "symptoms": ["Asymmetric yellow mottling on leaves (blotchy mottle)", "Small, lopsided, bitter fruit with green area at bottom", "Twig and branch dieback", "Stunted growth and general decline"],
        "causes": "Caused by bacteria Candidatus Liberibacter asiaticus spread by Asian citrus psyllid insect. Once infected, tree cannot be cured.",
        "organic_treatment": ["Remove and destroy infected trees immediately to prevent spread", "Control Asian citrus psyllid with neem oil sprays", "Apply micronutrient foliar sprays to extend productive life of infected trees"],
        "chemical_treatment": ["Imidacloprid for psyllid control (soil drench or foliar)", "Thiamethoxam systemic insecticide for vector control", "Thermotherapy (heat treatment) — experimental only"],
        "prevention": ["Purchase only certified disease-free nursery stock", "Install fine mesh screens in nurseries", "Control psyllid populations aggressively with insecticides", "Report suspected cases to agricultural authorities immediately"],
        "severity": "High"
    },

    # ── PEACH (2 classes) ─────────────────────────────────────────────────────
    "Peach___Bacterial_spot": {
        "description": "Peach bacterial spot caused by Xanthomonas arboricola pv. pruni affects leaves, fruit, and twigs of peach and other stone fruits.",
        "symptoms": ["Small water-soaked spots on leaves becoming angular and brown", "Spots drop out leaving shot-hole appearance", "Sunken dark spots on fruit — reduces market value", "Twig cankers with gummy ooze"],
        "causes": "Xanthomonas arboricola pv. pruni bacteria. Spreads via rain splash. Favored by warm (24–28°C) wet weather and wind-driven rain.",
        "organic_treatment": ["Apply copper-based bactericide from petal fall", "Avoid overhead irrigation", "Prune to improve air circulation in canopy"],
        "chemical_treatment": ["Copper hydroxide + mancozeb spray", "Oxytetracycline antibiotic spray (where permitted)", "Copper octanoate every 7–10 days during wet weather"],
        "prevention": ["Plant resistant peach varieties", "Site orchards to minimize exposure to prevailing winds", "Avoid excessive nitrogen fertilization", "Apply copper dormant spray in autumn"],
        "severity": "Medium"
    },
    "Peach___healthy": {
        "description": "Your peach tree is healthy! No bacterial spot or other disease detected.",
        "symptoms": [],
        "causes": "N/A",
        "organic_treatment": ["Thin fruit to one per cluster for better sizing", "Apply compost mulch around drip line", "Deep water during dry periods"],
        "chemical_treatment": [],
        "prevention": ["Apply dormant copper spray before bud swell", "Prune for open vase shape to improve airflow", "Remove and destroy mummified fruit", "Whitewash trunk to prevent sunscald"],
        "severity": "None"
    },

    # ── PEPPER (2 classes) ────────────────────────────────────────────────────
    "Pepper__bell___Bacterial_spot": {
        "description": "Bacterial spot caused by Xanthomonas bacteria is one of the most damaging pepper diseases. Thrives in warm, wet, windy conditions.",
        "symptoms": ["Small water-soaked spots turning brown/black on leaves", "Spots surrounded by yellow halo", "Raised scab-like lesions on fruit", "Premature leaf drop in severe cases"],
        "causes": "Xanthomonas campestris pv. vesicatoria. Spreads through rain splash, wind, contaminated tools, and infected seeds.",
        "organic_treatment": ["Copper-based bactericide every 7 days", "Remove and destroy infected plant parts immediately", "Avoid overhead irrigation", "Apply neem oil spray as preventive"],
        "chemical_treatment": ["Copper oxychloride 50% WP — spray every 7–10 days", "Streptomycin sulfate (follow local regulations)", "Mancozeb + copper combination fungicide"],
        "prevention": ["Use certified disease-free seeds", "Rotate crops for 2–3 years", "Maintain proper plant spacing for air circulation", "Avoid working in garden when plants are wet"],
        "severity": "High"
    },
    "Pepper__bell___healthy": {
        "description": "Your pepper plant is healthy! No disease signs detected.",
        "symptoms": [],
        "causes": "N/A",
        "organic_treatment": ["Continue regular watering and fertilization", "Monitor weekly for early disease signs", "Apply compost to maintain soil health"],
        "chemical_treatment": [],
        "prevention": ["Water at soil level to prevent spread", "Mulch around plants to prevent soil splash", "Ensure good air circulation between plants"],
        "severity": "None"
    },

    # ── POTATO (3 classes) ────────────────────────────────────────────────────
    "Potato___Early_blight": {
        "description": "Early blight caused by Alternaria solani is one of the most common potato diseases worldwide, appearing first on older lower leaves.",
        "symptoms": ["Dark brown circular spots with concentric rings (target pattern)", "Yellow area surrounding spots", "Lower/older leaves affected first", "Dark sunken lesions on stems"],
        "causes": "Alternaria solani fungus. Spreads by wind and rain splash. Favored by warm days (24–29°C) and cool nights with heavy dew.",
        "organic_treatment": ["Copper-based fungicide every 7–10 days", "Neem oil spray weekly", "Remove infected leaves and dispose away from field"],
        "chemical_treatment": ["Mancozeb 75% WP at 2.5g per liter", "Chlorothalonil spray every 7 days", "Azoxystrobin systemic fungicide"],
        "prevention": ["Use certified disease-free seed tubers", "3-year crop rotation", "Avoid excessive nitrogen", "Hill up plants to protect tubers"],
        "severity": "Medium"
    },
    "Potato___Late_blight": {
        "description": "Late blight caused by Phytophthora infestans is the most devastating potato disease — it caused the Irish Potato Famine. Spreads extremely rapidly.",
        "symptoms": ["Water-soaked pale green to brown spots on leaves", "White mold on underside of leaves in humid conditions", "Dark brown lesions on stems", "Reddish-brown dry rot inside infected tubers"],
        "causes": "Phytophthora infestans oomycete. Airborne spores spread rapidly. Thrives at 10–20°C with high humidity. Can destroy a field in days.",
        "organic_treatment": ["Apply copper hydroxide immediately upon detection", "Remove and destroy ALL infected plant material", "Stop all overhead irrigation completely"],
        "chemical_treatment": ["Metalaxyl + Mancozeb (Ridomil Gold) — most effective", "Cymoxanil + Mancozeb every 5–7 days", "Dimethomorph in rotation to prevent resistance"],
        "prevention": ["Use late-blight resistant varieties", "Avoid planting in low-lying areas", "Destroy all volunteer potato plants", "Monitor weather — spray preventively before rain"],
        "severity": "High"
    },
    "Potato___healthy": {
        "description": "Your potato plant looks healthy! No disease signs detected.",
        "symptoms": [],
        "causes": "N/A",
        "organic_treatment": ["Apply compost for soil health", "Regular hilling to protect tubers", "Monitor weekly especially during monsoon"],
        "chemical_treatment": [],
        "prevention": ["Use certified seed potatoes", "Maintain proper spacing (30–45cm)", "Ensure good drainage", "Apply preventive copper spray before monsoon"],
        "severity": "None"
    },

    # ── RASPBERRY (1 class) ───────────────────────────────────────────────────
    "Raspberry___healthy": {
        "description": "Your raspberry plant is healthy! No disease detected.",
        "symptoms": [],
        "causes": "N/A",
        "organic_treatment": ["Apply straw mulch to maintain moisture", "Feed with balanced organic fertilizer in spring", "Remove old floricanes after fruiting"],
        "chemical_treatment": [],
        "prevention": ["Prune for good air circulation between canes", "Avoid waterlogged soil — plant in raised beds if needed", "Remove and destroy any virus-infected plants"],
        "severity": "None"
    },

    # ── SOYBEAN (1 class) ─────────────────────────────────────────────────────
    "Soybean___healthy": {
        "description": "Your soybean plant is healthy! No disease detected. Good field management.",
        "symptoms": [],
        "causes": "N/A",
        "organic_treatment": ["Inoculate seed with Rhizobium bacteria for nitrogen fixation", "Apply micronutrients — especially iron and manganese", "Monitor regularly for aphid and bean beetle infestations"],
        "chemical_treatment": [],
        "prevention": ["Rotate with non-legume crops every 2 years", "Use certified disease-free seed", "Ensure proper plant populations for yield", "Scout for sudden death syndrome symptoms"],
        "severity": "None"
    },

    # ── SQUASH (1 class) ──────────────────────────────────────────────────────
    "Squash___Powdery_mildew": {
        "description": "Squash powdery mildew caused by Podosphaera xanthii and Erysiphe cichoracearum is extremely common. It affects all cucurbits — squash, pumpkin, cucumber, melon.",
        "symptoms": ["White powdery spots on upper leaf surface", "Spots enlarge to cover entire leaf", "Yellowing and browning of infected leaves", "Plant weakens and fruit production drops"],
        "causes": "Podosphaera xanthii fungus. Spreads via airborne spores. Thrives in warm (20–30°C) dry weather with high humidity. Does NOT need wet leaves to infect.",
        "organic_treatment": ["Apply potassium bicarbonate spray every 5–7 days", "Neem oil spray weekly", "Diluted milk spray (40% milk: 60% water) weekly", "Remove heavily infected leaves immediately"],
        "chemical_treatment": ["Sulfur-based fungicide every 7 days", "Myclobutanil systemic fungicide", "Quinoxyfen preventive spray"],
        "prevention": ["Plant powdery mildew-resistant varieties", "Space plants widely for air circulation", "Avoid overhead watering", "Plant in full sun — shade worsens disease"],
        "severity": "Medium"
    },

    # ── STRAWBERRY (2 classes) ────────────────────────────────────────────────
    "Strawberry___Leaf_scorch": {
        "description": "Strawberry leaf scorch caused by Diplocarpon earlianum appears as purple-red spots that eventually cause leaf margins to look scorched or burned.",
        "symptoms": ["Small purple to red spots on leaf upper surface", "Spots enlarge and centers turn gray-brown", "Leaf margins appear scorched/burned in severe cases", "Premature leaf death reducing plant vigor"],
        "causes": "Diplocarpon earlianum fungus. Spreads via water splash. Favored by warm (20–25°C) humid conditions. Survives in infected leaves.",
        "organic_treatment": ["Remove and destroy infected leaves", "Apply copper fungicide every 7–10 days", "Avoid overhead irrigation — use drip irrigation", "Improve bed drainage"],
        "chemical_treatment": ["Captan fungicide spray", "Myclobutanil every 10–14 days", "Azoxystrobin systemic fungicide"],
        "prevention": ["Plant resistant strawberry varieties", "Use raised beds for better drainage", "Renovate beds after fruiting by mowing and thinning", "Remove old leaves in autumn before new growth"],
        "severity": "Medium"
    },
    "Strawberry___healthy": {
        "description": "Your strawberry plant is healthy! No leaf scorch or other diseases detected.",
        "symptoms": [],
        "causes": "N/A",
        "organic_treatment": ["Apply straw mulch to keep berries clean and retain moisture", "Feed with balanced fertilizer after fruiting", "Remove runners unless propagating"],
        "chemical_treatment": [],
        "prevention": ["Replace plants every 3 years to maintain productivity", "Use drip irrigation to keep foliage dry", "Remove and destroy old leaves after harvest", "Maintain weed-free beds"],
        "severity": "None"
    },

    # ── TOMATO (10 classes) ───────────────────────────────────────────────────
    "Tomato_Bacterial_spot": {
        "description": "Tomato bacterial spot caused by Xanthomonas species affects leaves, stems, and fruits. Most severe during warm, wet, windy weather.",
        "symptoms": ["Small dark water-soaked spots on leaves", "Spots turn brown with yellow halo", "Raised rough scabby spots on fruit", "Severely infected leaves turn yellow and drop"],
        "causes": "Xanthomonas perforans bacteria. Spreads via rain, irrigation, contaminated tools, and infected transplants.",
        "organic_treatment": ["Copper-based bactericide every 7 days", "Remove infected leaves and fruits immediately", "Use drip irrigation instead of overhead watering"],
        "chemical_treatment": ["Copper hydroxide 77% WP — 3g per liter", "Streptomycin + Copper combination spray", "Kasugamycin bactericide"],
        "prevention": ["Purchase transplants from reputable nurseries", "Stake plants to improve air circulation", "Mulch heavily to prevent soil splash"],
        "severity": "High"
    },
    "Tomato_Early_blight": {
        "description": "Tomato early blight caused by Alternaria solani is extremely common. Starts on older leaves near the soil and moves upward.",
        "symptoms": ["Dark brown spots with concentric rings (bullseye pattern)", "Yellow chlorotic zone surrounding spots", "Lower leaves affected first", "Dark sunken lesions on stems near soil"],
        "causes": "Alternaria solani fungus. Survives in soil and plant debris. Spreads by wind and rain. Favored by alternating wet and dry conditions.",
        "organic_treatment": ["Neem oil spray every 7 days", "Copper oxychloride spray", "Remove infected lower leaves", "Apply baking soda solution as mild fungicide"],
        "chemical_treatment": ["Mancozeb 75% WP at 2.5g per liter", "Azoxystrobin systemic protection", "Chlorothalonil every 7–10 days"],
        "prevention": ["Use disease-resistant tomato varieties", "Avoid overhead watering — use drip irrigation", "Remove plant debris after harvest", "Mulch to prevent soil splash"],
        "severity": "Medium"
    },
    "Tomato_Late_blight": {
        "description": "Late blight caused by Phytophthora infestans is one of the fastest spreading plant diseases. Can destroy entire field in 48 hours.",
        "symptoms": ["Greasy water-soaked grey-green spots on leaves", "White fuzzy mold on leaf undersides in humid weather", "Dark brown to black firm lesions on fruits", "Rapid wilting and collapse of entire plant"],
        "causes": "Phytophthora infestans oomycete. Spreads explosively via airborne spores in cool (10–20°C) humid conditions.",
        "organic_treatment": ["Apply copper hydroxide immediately", "Remove and bag all infected material — never compost", "Stop all overhead irrigation immediately"],
        "chemical_treatment": ["Metalaxyl + Mancozeb (Ridomil Gold MZ) — most effective", "Fenamidone + Mancozeb spray", "Cymoxanil 8% + Mancozeb 64% WP every 5 days"],
        "prevention": ["Plant late-blight resistant varieties", "Ensure excellent drainage and air circulation", "Apply preventive fungicide before monsoon season", "Monitor weather — cool + wet = high risk"],
        "severity": "High"
    },
    "Tomato_Leaf_Mold": {
        "description": "Tomato leaf mold caused by Passalora fulva mainly affects greenhouse tomatoes but occurs in humid field conditions.",
        "symptoms": ["Pale green to yellow spots on upper leaf surface", "Olive-green to brown velvety mold on leaf underside", "Infected leaves curl, wither, and drop"],
        "causes": "Passalora fulva fungus. Thrives in high humidity (>85%) at 22–25°C. Common in greenhouses.",
        "organic_treatment": ["Improve ventilation immediately", "Reduce humidity by spacing plants wider", "Copper-based fungicide every 7 days"],
        "chemical_treatment": ["Mancozeb 75% WP every 7–10 days", "Difenoconazole systemic fungicide", "Chlorothalonil spray"],
        "prevention": ["Use resistant tomato varieties", "Maintain humidity below 85%", "Ensure good plant spacing", "Remove lower leaves to improve air movement"],
        "severity": "Medium"
    },
    "Tomato_Septoria_leaf_spot": {
        "description": "Septoria leaf spot caused by Septoria lycopersici rarely kills plants but causes severe defoliation reducing yield.",
        "symptoms": ["Many small circular spots (3–5mm) with dark border and grey center", "Tiny dark specks visible in center of spots", "Lower leaves affected first", "Heavy defoliation exposes fruit to sunscald"],
        "causes": "Septoria lycopersici fungus. Spreads via rain splash. Survives on tomato debris. Favored by warm (20–25°C) wet weather.",
        "organic_treatment": ["Remove infected lower leaves as soon as spots appear", "Copper fungicide every 7–10 days", "Mulch soil to prevent splash"],
        "chemical_treatment": ["Mancozeb 75% WP every 7 days", "Chlorothalonil spray", "Azoxystrobin systemic for severe cases"],
        "prevention": ["Use drip irrigation", "Stake plants for better air circulation", "Clean up all plant debris after harvest", "Rotate crops — wait 3 years before planting tomatoes again"],
        "severity": "Medium"
    },
    "Tomato_Spider_mites_Two_spotted_spider_mite": {
        "description": "Two-spotted spider mites (Tetranychus urticae) are tiny pests that thrive in hot, dry conditions and can rapidly defoliate plants.",
        "symptoms": ["Tiny yellow or white stippling on upper leaf surface", "Fine silky webbing on leaf undersides", "Leaves turn bronze, yellow, then dry out", "Rapid plant decline in severe infestation"],
        "causes": "Tetranychus urticae mites. Thrives in hot (27–35°C) dry conditions. Pesticide overuse kills natural predators causing outbreaks.",
        "organic_treatment": ["Spray forceful water jets on leaf undersides", "Neem oil + dish soap spray every 3–5 days", "Apply insecticidal soap solution", "Introduce predatory mites as biological control"],
        "chemical_treatment": ["Abamectin (Vertimec) miticide", "Spiromesifen (Oberon) kills eggs and adults", "Fenazaquin miticide — rotate to prevent resistance"],
        "prevention": ["Maintain adequate soil moisture", "Avoid excessive nitrogen fertilization", "Preserve natural predators", "Inspect leaf undersides weekly"],
        "severity": "High"
    },
    "Tomato__Target_Spot": {
        "description": "Target spot caused by Corynespora cassiicola affects tomato leaves, stems, and fruits. Increasingly common in tropical regions including India.",
        "symptoms": ["Brown circular spots with concentric rings (target pattern)", "Spots enlarge and merge causing large dead areas", "Dark brown sunken lesions on stems", "Fruit spots cause post-harvest rot"],
        "causes": "Corynespora cassiicola fungus. Favored by warm (25–30°C) humid conditions.",
        "organic_treatment": ["Copper-based fungicide every 7–10 days", "Remove and destroy infected leaves", "Improve air circulation through pruning"],
        "chemical_treatment": ["Mancozeb + Carbendazim combination", "Tebuconazole systemic fungicide", "Azoxystrobin every 10–14 days"],
        "prevention": ["Use drip irrigation", "Remove plant debris after harvest", "Stake and prune for air circulation"],
        "severity": "Medium"
    },
    "Tomato__Tomato_YellowLeaf__Curl_Virus": {
        "description": "Tomato Yellow Leaf Curl Virus (TYLCV) transmitted by whiteflies can cause total crop loss. Very common in India. No cure once infected.",
        "symptoms": ["Upward curling and cupping of leaves", "Yellow margins on leaves", "Stunted bushy plant growth", "Flowers drop without setting fruit"],
        "causes": "TYLCV virus transmitted by silverleaf whitefly (Bemisia tabaci). No cure — prevention is critical.",
        "organic_treatment": ["Remove and destroy infected plants immediately", "Neem oil spray to control whitefly", "Yellow sticky traps to monitor and reduce whiteflies"],
        "chemical_treatment": ["Imidacloprid (Confidor) soil drench for whitefly", "Thiamethoxam (Actara) foliar spray", "Spirotetramat for whitefly nymphs"],
        "prevention": ["Use TYLCV-resistant varieties — most important step", "Cover seedlings with insect-proof nets", "Remove weeds around field", "Plant early before whitefly population builds"],
        "severity": "High"
    },
    "Tomato__Tomato_mosaic_virus": {
        "description": "Tomato mosaic virus (ToMV) spreads through contact — hands, tools, and tobacco. Extremely stable — survives for years in plant debris.",
        "symptoms": ["Mosaic pattern of light and dark green on leaves", "Distorted fern-like or narrow leaves", "Stunted plant growth", "Fruit shows yellow spots or internal browning"],
        "causes": "Tomato mosaic virus (ToMV). Spreads through mechanical contact. Survives for years in dried plant debris and soil.",
        "organic_treatment": ["No cure — remove and destroy infected plants", "Wash hands with soap before touching plants", "Dip tools in 1:9 bleach solution between plants"],
        "chemical_treatment": ["No chemical cure for viral diseases", "Apply insecticides to control aphid vectors"],
        "prevention": ["Use ToMV-resistant varieties", "Disinfect tools with bleach regularly", "Wash hands before and after working with plants"],
        "severity": "High"
    },
    "Tomato_healthy": {
        "description": "Your tomato plant is healthy! No disease detected. Keep up the good work!",
        "symptoms": [],
        "causes": "N/A",
        "organic_treatment": ["Continue drip irrigation", "Apply compost or vermicompost monthly", "Monitor weekly for early pest or disease signs"],
        "chemical_treatment": [],
        "prevention": ["Stake plants as they grow", "Remove suckers and lower leaves touching soil", "Preventive neem oil spray every 15 days"],
        "severity": "None"
    }
}

def get_disease_info(class_name: str) -> dict:
    """Match class name to disease info — handles underscore/space variations."""
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
            model = timm.create_model("efficientnet_b3", pretrained=False, num_classes=num_classes)
            checkpoint = torch.load(MODEL_PATH, map_location=device)
            model.load_state_dict(checkpoint["model_state_dict"])
            model.to(device)
            model.eval()
            model_state.update({"model": model, "class_names": class_names, "loaded": True})
            print(f"✅ Model loaded! Classes: {num_classes}, Device: {device}")
        except Exception as e:
            print(f"⚠️  Could not load model: {e}")
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
    return {"message": "🌿 Plant Disease Detection API v2.0", "model_loaded": model_state["loaded"], "docs": "/docs"}

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
    return {
        "success": True,
        "location": {"lat": lat, "lon": lon, "city": city or ""},
        "weather": weather,
        "disease_risk": risk
    }

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
    return {
        "success": True,
        "location": {"lat": lat, "lon": lon, "city": city or ""},
        "disease": disease,
        "weather": weather,
        "disease_risk": risk
    }

# ── Community Outbreak Routes ──────────────────────────────────────────────────
from pydantic import BaseModel
from typing import Optional

class CommunityReportRequest(BaseModel):
    disease: str
    state: str
    city: Optional[str] = None

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)