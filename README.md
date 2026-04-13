# 🌿 LeafDoc AI — Plant Disease Detection System

> AI-powered plant disease detection for Indian farmers. SWIN Transformer · 38 disease classes · 14 crop types · 73.19% real-world accuracy

**Team:** Aman Chaudhary · Parth Rawat · Aditya Raj Singh · Rohit Upadhyay
**Institution:** Bennett University — DTI Project 2025-26

---

## ⚡ Quick Start (Read this first)

The project has two parts that run simultaneously:
- **Backend** → runs on `http://localhost:8000`
- **Frontend** → runs on `http://localhost:5173`

You need **two terminal windows open at the same time.**

---

## 🔧 Prerequisites

Install these before starting:

| Tool | Download | Check version |
|------|----------|---------------|
| Python 3.10+ | https://python.org/downloads | `python --version` |
| Node.js 18+ | https://nodejs.org | `node --version` |
| Git | https://git-scm.com | `git --version` |

---

## 📥 Step 1 — Download the Project

```bash
git clone https://github.com/AmanChaudhary684/plant_disease_detection.git
cd plant_disease_detection
```

Or download the ZIP from GitHub → Extract it → Open the folder.

---

## 🤖 Step 2 — Download the AI Model (Required)

> ⚠️ The model file is too large for GitHub (~300MB). You must download it separately.

**Download from Google Drive:**
👉 [Download best_model.pth and model_metadata.json](https://drive.google.com/drive/folders/YOUR_FOLDER_ID)

After downloading, place **both files** inside the `backend/` folder:

```
plant_disease_detection/
└── backend/
    ├── best_model.pth          ← place here
    ├── model_metadata.json     ← place here
    ├── main.py
    └── ...
```

> **Without the model files:** The backend still runs but in "demo mode" — it returns a hardcoded prediction instead of real AI diagnosis. The app will work but detection won't be real.

---

## 🐍 Step 3 — Set Up the Backend

Open **Terminal 1** and run these commands:

### Windows

```bash
cd plant_disease_detection\backend

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# You should see (venv) at the start of your terminal line
# Install dependencies
pip install -r requirements.txt

# Start the backend
python -m uvicorn main:app --reload --port 8000
```

### Mac / Linux

```bash
cd plant_disease_detection/backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend
uvicorn main:app --reload --port 8000
```

### ✅ Success looks like:

```
✅ SWIN Transformer loaded! Classes: 38, Device: cpu
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

> If you see `⚠️ Model files not found. Running in demo mode.` — the model files are missing. Go back to Step 2.

**Keep this terminal open.** Do not close it.

---

## 🌐 Step 4 — Set Up the Frontend

Open **Terminal 2** (a new terminal window) and run:

```bash
cd plant_disease_detection\plant-disease-frontend

# Install dependencies (do this once)
npm install

# Start the frontend
npm run dev
```

### ✅ Success looks like:

```
  VITE v5.x.x  ready in 800ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Keep this terminal open too.**

---

## 🚀 Step 5 — Open the App

Open your browser and go to:

```
http://localhost:5173
```

Sign in with Google → you're ready to detect plant diseases!

---

## ❌ Common Errors and Fixes

### `'vite' is not recognized` (Frontend)

**Cause:** `npm install` was never run — `node_modules` folder is missing.

**Fix:**
```bash
cd plant-disease-frontend
npm install
npm run dev
```

---

### `The system cannot find the path specified` (venv activate)

**Cause:** Virtual environment was never created.

**Fix:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

### `⚠️ Model files not found. Running in demo mode.`

**Cause:** `best_model.pth` and `model_metadata.json` are missing from the `backend/` folder.

**Fix:** Download them from the Google Drive link in Step 2 and place them in `backend/`.

---

### `ModuleNotFoundError: No module named 'timm'` or similar

**Cause:** Dependencies not installed, or virtual environment not activated.

**Fix:**
```bash
# Make sure venv is activated first — you should see (venv) in terminal
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux

# Then install
pip install -r requirements.txt
```

---

### Backend runs but frontend can't connect to it

**Cause:** Backend not running, or running on wrong port.

**Fix:** Make sure backend is running on port 8000 (`http://127.0.0.1:8000`). Check Terminal 1 is still open and showing "Uvicorn running."

---

### `npm install` fails with permission errors (Windows)

**Fix:** Run Terminal as Administrator, or use:
```bash
npm install --force
```

---

### Firebase login not working / Google sign-in fails

**Cause:** Firebase is configured for the deployed domain. For local development:

**Fix:** Contact the team for the local Firebase config, or use the deployed version at the production URL.

---

## 📁 Project Structure

```
plant_disease_detection/
│
├── backend/                        # FastAPI Python backend
│   ├── main.py                     # Main API — all routes + SWIN model
│   ├── weather_service.py          # Open-Meteo weather + risk scoring
│   ├── community_outbreak_service.py  # SQLite outbreak map
│   ├── requirements.txt            # Python dependencies
│   ├── best_model.pth              # ⬅ Model file (download separately)
│   ├── model_metadata.json         # ⬅ Class names (download separately)
│   ├── class_names.json
│   └── outbreak.db                 # SQLite database (auto-created)
│
├── plant-disease-frontend/         # React + Vite frontend
│   ├── src/
│   │   ├── AppNew.jsx              # Main app with React Router
│   │   ├── App.jsx                 # Original dark-theme version
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── DiagnosePage.jsx
│   │   │   ├── ResultPage.jsx
│   │   │   ├── MapPage.jsx
│   │   │   ├── IoTPage.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   └── ProgressionPage.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── WeatherWidget.jsx
│   │   ├── OutbreakMap.jsx
│   │   ├── OfflineMode.jsx         # ONNX offline inference
│   │   ├── IoTSimulator.jsx
│   │   ├── ProgressionTracker.jsx
│   │   ├── CropCalendar.jsx
│   │   ├── DiseaseStages.jsx
│   │   ├── PDFExport.jsx
│   │   ├── CommunityReport.jsx
│   │   ├── translations.js         # English + Hindi translations
│   │   └── firebase.js
│   ├── package.json
│   └── vite.config.js
│
├── render.yaml                     # Deployment config (Render.com)
└── README.md
```

---

## 🔌 API Endpoints

Once backend is running, visit `http://localhost:8000/docs` for the interactive API docs.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/detect` | Upload leaf image → get disease prediction |
| POST | `/api/detect/gradcam` | Same + Grad-CAM heatmap |
| GET | `/api/weather/risk?city=Delhi` | Weather-based disease risk |
| GET | `/api/community/map` | All outbreak reports |
| POST | `/api/community/report` | Submit outbreak report |
| GET | `/api/diseases` | List all 38 disease classes |
| GET | `/api/health` | Check if backend is running |

---

## 🧠 ML Model Details

| Property | Value |
|----------|-------|
| Architecture | SWIN Transformer (swin_base_patch4_window7_224) |
| Parameters | 86.8 million |
| Training images | 8,237 (PlantDoc + web-sourced real-world) |
| Disease classes | 38 across 14 crop types |
| Lab accuracy | 99.74% |
| Real-world accuracy | 73.19% |
| Input size | 224 × 224 pixels |
| Framework | PyTorch + timm |

### Model Version History

| Version | Architecture | Data | Real-World Accuracy |
|---------|-------------|------|---------------------|
| v1 | EfficientNet-B3 | PlantVillage (lab only) | 35.74% — severe overfitting |
| v2 | EfficientNet-B3 | PlantDoc + web-sourced | 60.85% |
| v3 (current) | SWIN Transformer | 8,237 curated real images | **73.19%** |

---

## 🌐 Deployment

The app is deployed at:
- **Backend:** Render.com (configured via `render.yaml`)
- **Frontend:** Vite build served via Render static site

For your own deployment, see `render.yaml` for the configuration.

---

## 📚 References

- Krishna et al. (2025). Plant Leaf Disease Detection Using Deep Learning: A Multi-Dataset Approach. MDPI J. https://doi.org/10.3390/j8010004
- Liu et al. (2021). Swin Transformer: Hierarchical Vision Transformer using Shifted Windows. ICCV 2021.
- PlantDoc Dataset: https://github.com/pratikkayal/PlantDoc-Dataset
- PlantVillage Dataset: https://arxiv.org/abs/1511.08060

---

## 👥 Team

| Name | Role | Enrollment |
|------|------|------------|
| Aman Chaudhary | ML Lead | S24CSEU1348 |
| Parth Rawat | Backend Lead | S24CSEU1345 |
| Aditya Raj Singh | Frontend Lead | S24CSEU1357 |
| Rohit Upadhyay | Research Lead | S24CSEU1359 |

**Mentor:** Pratima Singh
**Institution:** Bennett University, Greater Noida — DTI Project 2025-26

---

*For issues, open a GitHub Issue or contact the team.*
