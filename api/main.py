from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from api.db import get_connection

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
    """Return all holes with summary metadata, from the database."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT hole_id, region, latitude, longitude, total_depth_m
                FROM hole
                ORDER BY hole_id;
            """)
            holes = cur.fetchall()
    finally:
        conn.close()
    return {
        "count": len(holes),
        "holes": holes
    }


@app.get("/holes/{hole_id}")
def get_hole(hole_id: str):
    """Return metadata for one specific hole."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT hole_id, region, latitude, longitude, total_depth_m
                FROM hole
                WHERE hole_id = %s;
            """, (hole_id,))
            hole = cur.fetchone()
    finally:
        conn.close()
    if not hole:
        raise HTTPException(status_code=404, detail=f"Hole {hole_id} not found")
    return hole


@app.get("/holes/{hole_id}/intervals")
def get_hole_intervals(hole_id: str, min_confidence: Optional[float] = Query(None)):
    """Return the classified depth intervals for one hole.

    min_confidence filters to intervals whose confidence_error is at or
    below the given threshold (lower Error means higher trust).
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if min_confidence is not None:
                cur.execute("""
                    SELECT depth_from_m, depth_to_m, label, confidence,
                           reason, rule_fired, final_mask, confidence_error
                    FROM classification
                    WHERE hole_id = %s AND confidence_error <= %s
                    ORDER BY depth_from_m;
                """, (hole_id, min_confidence))
            else:
                cur.execute("""
                    SELECT depth_from_m, depth_to_m, label, confidence,
                           reason, rule_fired, final_mask, confidence_error
                    FROM classification
                    WHERE hole_id = %s
                    ORDER BY depth_from_m;
                """, (hole_id,))
            intervals = cur.fetchall()
    finally:
        conn.close()

    if not intervals:
        raise HTTPException(status_code=404, detail=f"No intervals found for {hole_id}")

    return {
        "hole_id": hole_id,
        "count": len(intervals),
        "intervals": intervals
    }