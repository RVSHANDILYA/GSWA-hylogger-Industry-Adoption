from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="GSWA HyLogger API",
    description="API for the GSWA HyLogger Industry Adoption capstone project",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dummy data for now. Sprint 2 replaces this with real database queries.
DUMMY_HOLES = [
    {
        "hole_id": "05GJD001",
        "region": "Kalgoorlie",
        "latitude": -30.71,
        "longitude": 121.39,
        "total_depth_m": 210,
        "intervals_classified": 6
    },
    {
        "hole_id": "07LAV003",
        "region": "Laverton",
        "latitude": -28.62,
        "longitude": 122.41,
        "total_depth_m": 180,
        "intervals_classified": 5
    },
]

DUMMY_INTERVALS = {
    "05GJD001": [
        {"depth_from_m": 0, "depth_to_m": 30, "label": "Waste rock", "confidence": 0.72},
        {"depth_from_m": 30, "depth_to_m": 70, "label": "Altered zone", "confidence": 0.81},
        {"depth_from_m": 70, "depth_to_m": 110, "label": "Altered zone", "confidence": 0.85},
        {"depth_from_m": 110, "depth_to_m": 150, "label": "Unclassified", "confidence": 0.40},
        {"depth_from_m": 150, "depth_to_m": 180, "label": "Possible ore zone", "confidence": 0.67},
        {"depth_from_m": 180, "depth_to_m": 210, "label": "Possible ore zone", "confidence": 0.74},
    ]
}


@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "service": "GSWA HyLogger API",
        "version": "0.1.0"
    }


@app.get("/health")
def health():
    """Used by Docker to check the service is alive."""
    return {"status": "healthy"}


@app.get("/holes")
def list_holes():
    """Return all processed holes with summary metadata."""
    return {
        "count": len(DUMMY_HOLES),
        "holes": DUMMY_HOLES
    }


@app.get("/holes/{hole_id}")
def get_hole(hole_id: str):
    """Return metadata for one specific hole."""
    for hole in DUMMY_HOLES:
        if hole["hole_id"] == hole_id:
            return hole
    raise HTTPException(status_code=404, detail=f"Hole {hole_id} not found")


@app.get("/holes/{hole_id}/intervals")
def get_hole_intervals(hole_id: str):
    """Return the classified depth intervals for one hole."""
    if hole_id not in DUMMY_INTERVALS:
        raise HTTPException(status_code=404, detail=f"No intervals found for {hole_id}")
    return {
        "hole_id": hole_id,
        "count": len(DUMMY_INTERVALS[hole_id]),
        "intervals": DUMMY_INTERVALS[hole_id]
    }