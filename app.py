import os

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
    uvicorn.run(app, host="0.0.0.0", port=port)
