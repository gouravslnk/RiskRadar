from __future__ import annotations

import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SERVICES_DIR = PROJECT_ROOT / "services"

# 1. Flood
FLOOD_DIR = SERVICES_DIR / "flood"
FLOOD_CHECKPOINT = FLOOD_DIR / "model" / "best_unet.pt"
FLOOD_DATA_ROOT = FLOOD_DIR / "data"

# 2. Earthquake
EARTHQUAKE_DIR = SERVICES_DIR / "earthquake"
if not EARTHQUAKE_DIR.exists():
    EARTHQUAKE_DIR = PROJECT_ROOT / "earthquake"
EARTHQUAKE_MODEL = EARTHQUAKE_DIR / "model" / "earthquake_model.h5"
if not EARTHQUAKE_MODEL.exists():
    EARTHQUAKE_MODEL = EARTHQUAKE_DIR / "earthquake_model.h5"
if not EARTHQUAKE_MODEL.exists():
    EARTHQUAKE_MODEL = EARTHQUAKE_DIR / "smarter_earthquake_model.h5"

EARTHQUAKE_DATA = EARTHQUAKE_DIR / "data" / "cleaned_earthquake_data.csv"
if not EARTHQUAKE_DATA.exists():
    EARTHQUAKE_DATA = EARTHQUAKE_DIR / "cleaned_earthquake_data.csv"

USE_EARTHQUAKE_MODEL = os.getenv("USE_EARTHQUAKE_MODEL", "true").lower() in {"1", "true", "yes", "on"}

# 3. Wildfire
WILDFIRE_DIR = SERVICES_DIR / "wildfire"
if not WILDFIRE_DIR.exists():
    WILDFIRE_DIR = PROJECT_ROOT / "wildfire"
if not WILDFIRE_DIR.exists():
    WILDFIRE_DIR = PROJECT_ROOT / "firemodel"

WILDFIRE_MODEL = WILDFIRE_DIR / "model" / "model.pkl"
if not WILDFIRE_MODEL.exists():
    WILDFIRE_MODEL = WILDFIRE_DIR / "model.pkl"

WILDFIRE_DATA = WILDFIRE_DIR / "data" / "fires.csv"

WILDFIRE_METADATA = WILDFIRE_DIR / "model" / "metadata.json"
if not WILDFIRE_METADATA.exists():
    WILDFIRE_METADATA = WILDFIRE_DIR / "metadata.json"

WILDFIRE_FEATURES = WILDFIRE_DIR / "model" / "features.json"
if not WILDFIRE_FEATURES.exists():
    WILDFIRE_FEATURES = WILDFIRE_DIR / "features.json"

WILDFIRE_REPORT = WILDFIRE_DIR / "model" / "model_report.txt"
if not WILDFIRE_REPORT.exists():
    WILDFIRE_REPORT = WILDFIRE_DIR / "model_report.txt"

FIRMS_API_KEY = os.getenv("FIRMS_API_KEY")
FIRMS_DATASET = "VIIRS_SNPP_NRT"
