import os
import socket

# Prevent Gradio 5/6 SSR proxy from intercepting port 7860
os.environ["GRADIO_SSR_MODE"] = "false"

import gradio as gr
from backend.main import app as fastapi_app, health


# Interactive status view when opened in Hugging Face Space UI
with gr.Blocks(title="RiskRadar Multi-Hazard API") as demo:
    gr.Markdown("# 🛰️ RiskRadar Multi-Hazard AI API")
    gr.Markdown(
        "Backend services are **active**. All REST API endpoints (`/api/hazards/analyze`, "
        "`/api/health`, `/api/hotspots`, `/api/route/safest`) are available for the frontend."
    )
    with gr.Row():
        btn = gr.Button("Run System Health Check", variant="primary")
    health_output = gr.JSON(label="Live Service Telemetry")
    btn.click(fn=health, inputs=[], outputs=health_output)

# Mount Gradio onto the existing FastAPI application
# This keeps all FastAPI endpoints intact while fulfilling Hugging Face's Gradio requirement!
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    
    # Check if host supervisor is already listening on this port
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    in_use = (s.connect_ex(("127.0.0.1", port)) == 0)
    s.close()
    
    if not in_use:
        uvicorn.run(app, host="0.0.0.0", port=port)
    else:
        import time
        # Keep process alive if managed externally
        while True:
            time.sleep(3600)
