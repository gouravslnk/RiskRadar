# How to Run RiskRadar

### Option 1: Using .bat scripts (Recommended - No PowerShell permissions needed)
Terminal 1 (Backend):
.\run_backend.bat

Terminal 2 (Frontend):
.\run_frontend.bat

---

### Option 2: Direct Commands
Terminal 1 (Backend):
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

Terminal 2 (Frontend):
cd frontend
npm run dev

---

### Option 3: PowerShell .ps1 Scripts
If PowerShell blocks .ps1 scripts, run this once in PowerShell:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

Then you can run:
.\run_backend.ps1
.\run_frontend.ps1
