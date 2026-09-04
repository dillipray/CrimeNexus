import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import auth, cases, search, graph, alerts, review, reports, audit

app = FastAPI(
    title="NexusIntel API — AI-Powered Criminal Network Analysis System",
    description="Backend services for SIH 2026 Problem Statement #26189. Implements graph analytics, anomaly detection, semantic search, and audit trail.",
    version="1.0.0",
)

# Enable CORS for local Vite dev server and general access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(cases.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(graph.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(review.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "NexusIntel AI Engine",
        "dual_mode": "online",
        "disclaimer": "AI-assisted analytical system for authorized human review; not a final legal conclusion.",
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
