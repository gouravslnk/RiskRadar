from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import (
    EARTHQUAKE_DATA,
    EARTHQUAKE_MODEL,
    PROJECT_ROOT,
    WILDFIRE_MODEL,
)
from backend.earthquake_service import predict_earthquake
from backend.flood_service import flood_risk_for_location, get_model_status
from backend.hotspots import get_hotspots
from backend.route_service import safest_path_for_location
from backend.wildfire_service import predict_wildfire
from backend.schemas import EarthquakeRequest, LocationRequest, RouteRequest


def _sanitize_path(path) -> str:
    try:
        return str(path.relative_to(PROJECT_ROOT)).replace("\\", "/")
    except Exception:
        return getattr(path, "name", str(path))


app = FastAPI(
    title="RiskRadar API",
    description="RiskRadar multi-hazard disaster prediction and mitigation API.",
    version="1.0.0",
)

frontend_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://aapda-ai-disaster-management-projec.vercel.app",
        *frontend_origins,
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/api/health")
def health() -> dict[str, object]:
    flood_status = get_model_status().__dict__.copy()
    if "checkpoint_path" in flood_status:
        flood_status["checkpoint_path"] = _sanitize_path(flood_status["checkpoint_path"])

    return {
        "status": "ok",
        "flood_model": flood_status,
        "earthquake_model": {
            "model_path": _sanitize_path(EARTHQUAKE_MODEL),
            "model_exists": EARTHQUAKE_MODEL.exists(),
            "data_path": _sanitize_path(EARTHQUAKE_DATA),
            "data_exists": EARTHQUAKE_DATA.exists(),
        },
        "wildfire_model": {
            "path": _sanitize_path(WILDFIRE_MODEL),
            "exists": WILDFIRE_MODEL.exists(),
        },
    }


@app.post("/api/flood/location")
def flood_location(payload: LocationRequest) -> dict[str, object]:
    return flood_risk_for_location(payload.latitude, payload.longitude)


@app.post("/api/earthquake/predict")
def earthquake_prediction(payload: EarthquakeRequest) -> dict[str, object]:
    return predict_earthquake(payload.latitude, payload.longitude, payload.depth)


@app.post("/api/wildfire/predict")
def wildfire_prediction(payload: LocationRequest) -> dict[str, object]:
    return predict_wildfire(payload.latitude, payload.longitude)


@app.get("/api/hotspots")
def hotspots() -> dict[str, list[dict[str, object]]]:
    return get_hotspots()


@app.post("/api/route/safest")
def safest_route(payload: RouteRequest) -> dict[str, object]:
    return safest_path_for_location(
        disaster=payload.disaster,
        latitude=payload.latitude,
        longitude=payload.longitude,
        depth=payload.depth,
    )


@app.post("/api/hazards/analyze")
def analyze_all_hazards(payload: EarthquakeRequest) -> dict[str, object]:
    flood_res = flood_risk_for_location(payload.latitude, payload.longitude)
    earthquake_res = predict_earthquake(payload.latitude, payload.longitude, payload.depth)
    wildfire_res = predict_wildfire(payload.latitude, payload.longitude)

    risks = [
        ("flood", float(flood_res["risk_score"])),
        ("earthquake", float(earthquake_res["risk_score"])),
        ("wildfire", float(wildfire_res["risk_score"])),
    ]
    risks.sort(key=lambda x: x[1], reverse=True)
    dominant_disaster = risks[0][0]
    max_risk_score = risks[0][1]

    route_res = safest_path_for_location(
        disaster=dominant_disaster,
        latitude=payload.latitude,
        longitude=payload.longitude,
        depth=payload.depth,
    )

    return {
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "depth": payload.depth,
        "dominant_disaster": dominant_disaster,
        "dominant_risk_score": round(max_risk_score, 3),
        "max_risk_score": round(max_risk_score, 3),
        "flood": flood_res,
        "earthquake": earthquake_res,
        "wildfire": wildfire_res,
        "route": route_res,
    }
