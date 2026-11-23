---
title: RiskRadar API
colorFrom: blue
colorTo: red
sdk: gradio
app_file: app.py
pinned: false
---

# Risk Radar

Risk Radar is an AI-powered disaster-risk monitoring project that brings together flood, earthquake, and wildfire analysis in one web dashboard. It combines trained ML models with live environmental data and regional risk rules to present location-based risk levels, hotspots, safety guidance, and safer-route suggestions.

> **Disclaimer:** This is an academic decision-support project. It is not an official disaster-warning or emergency-response system. Always follow alerts and instructions from local authorities.

## Features

- **Flood analysis:** A U-Net model can segment flooded pixels from two-band Sentinel-1 SAR TIFF satellite imagery.
- **Flood location risk:** Uses current rainfall, 24-hour and 72-hour precipitation, and flood-prone regional factors.
- **Earthquake analysis:** Uses an LSTM-based sequence model with recent earthquake-event features, depth, and seismic-zone priors.
- **Wildfire analysis:** Uses an XGBoost classifier with Fire Radiative Power (FRP), recent fire history, and regional wildfire priors.
- **Dashboard:** Displays risk percentage, risk level, hotspots, advice, and model/data-source status.
- **Safer-route suggestion:** Uses a risk-weighted A* search with OSRM road routing when available.

## Architecture

```text
React + Vite frontend
        |
        v
FastAPI backend
  |       |       |
  v       v       v
Flood   Earthquake Wildfire
U-Net   LSTM       XGBoost
  |       |       |
Satellite USGS/local NASA FIRMS/local
data      data      data
```

## Models

| Hazard | Model | Input | Output |
|---|---|---|---|
| Flood | Small U-Net (PyTorch) | Two-band Sentinel-1 SAR TIFF | Pixel-wise flood probability and binary flood mask |
| Earthquake | LSTM (TensorFlow/Keras) | Last 50 earthquake events and engineered sequence features | Estimated next-magnitude pattern and risk score |
| Wildfire | XGBoost classifier | Grid-cell location, FRP, and recent fire-history features | Next-day fire probability blended into a risk score |

### Flood: U-Net segmentation

- Uses India-focused Sentinel-1 SAR image/mask pairs from a Sen1Floods11-style dataset.
- Input format: two SAR bands shaped as `(2, H, W)`.
- Labels: `1` flood, `0` non-flood, and `-1` ignored/unlabelled pixels.
- Pre-processing: invalid values are replaced, each band is clipped to its 1st-99th percentile range, then normalized to `0-1`.
- Training uses random `256 x 256` patches, flips, and 90-degree rotations.
- The saved checkpoint is `outputs/checkpoints/best_unet.pt`.

**Important:** The dashboard flood percentage is a separate location-risk calculation. It does not automatically run the U-Net, because U-Net inference requires a compatible Sentinel-1 TIFF image.

### Earthquake: LSTM sequence model

- Uses time, latitude, longitude, depth, magnitude, days since the previous event, rolling mean, rolling maximum, and magnitude gradient.
- The model processes the most recent 50 events to estimate the next magnitude pattern.
- The backend prefers recent regional USGS data, but falls back to the local historical dataset if enough live events are unavailable.
- Saved model: `services/earthquake/model/earthquake_model.h5`.

### Wildfire: XGBoost classifier

- Uses NASA FIRMS VIIRS fire records.
- Groups detections into 0.1-degree latitude/longitude grid cells.
- Features: `lat_bin`, `lon_bin`, `frp`, `fire_last_1d`, `fire_last_3d`, and `fire_last_7d`.
- The target is whether a fire is detected in the same grid cell on the next day.
- Saved model: `services/wildfire/model/model.pkl`.

## Project Structure

```text
RiskRadar/
├── backend/                 # FastAPI application and unified hazard service
├── frontend/                # React + Vite + Leaflet dashboard
├── services/                # Three core hazard modules (data, model, training)
│   ├── earthquake/          # LSTM sequence model, data, and training notebook
│   ├── flood/               # U-Net SAR segmentation model, data docs, and training code
│   └── wildfire/            # XGBoost classifier, fire data, and training pipeline
├── requirements.txt         # Python dependencies
├── run_backend.bat / .ps1   # Starts FastAPI backend on port 8000
└── run_frontend.bat / .ps1  # Starts Vite frontend on port 5173
```

## Setup

### Prerequisites

- Python 3.10 or later
- Node.js 18 or later
- npm

### 1. Create and activate the Python environment

```powershell
python -m venv .venv --system-site-packages
.\.venv\Scripts\Activate.ps1
```

### 2. Install backend dependencies

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 3. Install frontend dependencies

```powershell
cd frontend
npm install
cd ..
```

## Run Locally

Open two PowerShell terminals in the project root.

### Terminal 1: Backend

```powershell
.\run_backend.ps1
```

Backend URL: `http://127.0.0.1:8000`  
API documentation: `http://127.0.0.1:8000/docs`

### Terminal 2: Frontend

```powershell
.\run_frontend.ps1
```

Dashboard URL: `http://127.0.0.1:5173`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Checks availability of models and data artifacts. |
| `POST` | `/api/flood/location` | Returns rainfall and regional-prior flood risk for coordinates. |
| `POST` | `/api/earthquake/predict` | Returns earthquake magnitude-pattern estimate and risk. |
| `POST` | `/api/wildfire/predict` | Returns wildfire risk for coordinates. |
| `GET` | `/api/hotspots` | Returns ranked hotspot watchlists. |
| `POST` | `/api/route/safest` | Returns a suggested lower-risk route when risk is high. |

### Example requests

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://127.0.0.1:8000/api/flood/location" `
  -ContentType "application/json" `
  -Body '{"latitude":26.1445,"longitude":91.7362}'
```

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://127.0.0.1:8000/api/earthquake/predict" `
  -ContentType "application/json" `
  -Body '{"latitude":28.6139,"longitude":77.2090,"depth":15}'
```

## Train the Flood Model

Expected dataset layout:

```text
dataset/dataset/sen1floods11_india/
├── images/       # *_S1Hand.tif
├── masks/        # *_LabelHand.tif
├── weak_images/  # *_S1Weak.tif (optional)
└── weak_masks/   # *_S1OtsuLabelWeak.tif (optional)
```

Quick CPU smoke test:

```powershell
python services/flood/training/train.py --epochs 1 --patches-per-image 2 --batch-size 4 --device cpu
```

Longer training run:

```powershell
python services/flood/training/train.py --epochs 25 --patch-size 256 --patches-per-image 24 --batch-size 8 --use-weak
```

The best checkpoint is saved to `services/flood/model/best_unet.pt`.

## Predict a Flood Mask

```powershell
python services/flood/training/predict.py `
  --checkpoint services/flood/model/best_unet.pt `
  --input dataset/dataset/sen1floods11_india/images/India_1017769_S1Hand.tif `
  --output services/flood/model/predictions/India_1017769_pred.tif
```

The command writes:

- a binary mask TIFF: `0` non-flood and `1` flood;
- a probability TIFF with one flood probability per pixel.

## Data Sources and References

- [Sen1Floods11 flood dataset](https://github.com/cloudtostreet/Sen1Floods11)
- [Sentinel-1 mission](https://sentinel.esa.int/web/sentinel/missions/sentinel-1)
- [USGS Earthquake Catalog API](https://earthquake.usgs.gov/fdsnws/event/1/)
- [NASA FIRMS fire data](https://firms.modaps.eosdis.nasa.gov/)
- [Open-Meteo weather API](https://open-meteo.com/en/docs)
- [U-Net paper](https://arxiv.org/abs/1505.04597)
- [XGBoost paper](https://arxiv.org/abs/1603.02754)

## Limitations and Future Work

- The flood U-Net requires a supplied SAR image and is not yet connected to automatic satellite-image acquisition for every location query.
- The earthquake module is a research prototype; earthquake forecasting is inherently uncertain.
- Wildfire predictions depend on historical coverage and availability of live FIRMS data.
- Route suggestions are heuristic and do not account for real-time road closures, flood depth, fire spread, or official evacuation orders.
- Future work can add model calibration, stronger validation, scheduled satellite-data ingestion, user authentication, caching, and scalable background inference workers.
