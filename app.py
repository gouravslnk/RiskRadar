import gradio as gr
from backend.main import app, health


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
app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
