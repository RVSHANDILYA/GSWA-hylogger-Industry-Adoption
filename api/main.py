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
    """Return all holes with summary metadata."""
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            # LEFT JOIN so a hole with no classified intervals still appears,
            # with a count of 0. The site's hole cards print this count.
            cur.execute("""
                SELECT
                    h.hole_id,
                    h.region,
                    h.latitude,
                    h.longitude,
                    h.total_depth_m,
                    COUNT(c.class_id) AS intervals_classified
                FROM hole h
                LEFT JOIN classification c ON c.hole_id = h.hole_id
                GROUP BY h.hole_id, h.region, h.latitude, h.longitude, h.total_depth_m
                ORDER BY h.hole_id;
            """)

            holes = cur.fetchall()

    finally:
        conn.close()

    return {
        "count": len(holes),
        "holes": [
            {
                "hole_id": row["hole_id"],
                "region": row["region"],
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "total_depth_m": row["total_depth_m"],
                "intervals_classified": row["intervals_classified"],
            }
            for row in holes
        ]
    }


@app.get("/holes/{hole_id}")
def get_hole(hole_id: str):
    """Return metadata for one specific hole."""

    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    hole_id,
                    region,
                    latitude,
                    longitude,
                    total_depth_m
                FROM hole
                WHERE hole_id = %s;
            """, (hole_id,))

            hole = cur.fetchone()

    finally:
        conn.close()

    if not hole:
        raise HTTPException(
            status_code=404,
            detail=f"Hole {hole_id} not found"
        )

    return {
        "hole_id": hole["hole_id"],
        "region": hole["region"],
        "latitude": hole["latitude"],
        "longitude": hole["longitude"],
        "total_depth_m": hole["total_depth_m"],
    }


@app.get("/holes/{hole_id}/intervals")
def get_hole_intervals(
    hole_id: str,
    min_confidence: Optional[float] = Query(None)
):
    """
    Return classified depth intervals for one hole, each with its mineral
    composition attached.

    min_confidence filters intervals using confidence_error.
    Lower Error means higher confidence.
    """

    conn = get_connection()

    try:
        with conn.cursor() as cur:

            if min_confidence is not None:
                cur.execute("""
                    SELECT
                        depth_from_m,
                        depth_to_m,
                        label,
                        confidence,
                        reason,
                        rule_fired,
                        final_mask,
                        confidence_error
                    FROM classification
                    WHERE hole_id = %s
                    AND confidence_error <= %s
                    ORDER BY depth_from_m;
                """, (hole_id, min_confidence))

            else:
                cur.execute("""
                    SELECT
                        depth_from_m,
                        depth_to_m,
                        label,
                        confidence,
                        reason,
                        rule_fired,
                        final_mask,
                        confidence_error
                    FROM classification
                    WHERE hole_id = %s
                    ORDER BY depth_from_m;
                """, (hole_id,))

            intervals = cur.fetchall()

            # Mineral composition lives in a separate table, keyed the same
            # way as classification (hole_id, depth_from_m, depth_to_m).
            # Fetch it once for the whole hole and group it in Python rather
            # than one extra query per interval.
            cur.execute("""
                SELECT
                    depth_from_m,
                    depth_to_m,
                    mineral,
                    mineral_pct
                FROM interval
                WHERE hole_id = %s;
            """, (hole_id,))

            mineral_rows = cur.fetchall()

    finally:
        conn.close()

    if not intervals:
        raise HTTPException(
            status_code=404,
            detail=f"No intervals found for {hole_id}"
        )

    minerals_by_depth = {}
    for row in mineral_rows:
        key = (row["depth_from_m"], row["depth_to_m"])
        minerals_by_depth.setdefault(key, []).append({
            "name": row["mineral"],
            "percentage": row["mineral_pct"],
        })

    return {
        "hole_id": hole_id,
        "count": len(intervals),
        "intervals": [
            {
                "depth_from_m": row["depth_from_m"],
                "depth_to_m": row["depth_to_m"],
                "label": row["label"],
                "confidence": row["confidence"],
                "reason": row["reason"],
                "rule_fired": row["rule_fired"],
                "final_mask": row["final_mask"],
                "confidence_error": row["confidence_error"],
                "minerals": minerals_by_depth.get(
                    (row["depth_from_m"], row["depth_to_m"]), []
                ),
            }
            for row in intervals
        ]
    }