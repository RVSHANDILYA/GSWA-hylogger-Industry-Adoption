"""
Fetch uTSAS mineral-group data from the WA National Virtual Core Library.

This file retrieves the Grp1 uTSAS mineral classifications used by the
mineral-percentage, EDA, classifier, anomaly, transition, and similarity
components of the project.

Important implementation choices
--------------------------------
- Resolution is currently 20 m for the prototype. This is a downsampled
  analysis resolution, not the native HyLogger scan spacing.
- top_n=100 is deliberately used so the mineral composition is not truncated
  to the top five classes. Testing on the first 20 WA holes found as many as
  13 valid mineral classes at a sampled depth.
- INVALID and NOTAROK records are deliberately retained here. They provide
  useful data-quality evidence and are removed later when the modelling-ready
  mineral-percentage matrix is created.

Output
------
data/raw_holes.csv

Run
---
python etl/fetch_holes.py
"""

from pathlib import Path

import pandas as pd
from nvcl_kit.constants import Scalar
from nvcl_kit.generators import gen_scalar_by_depth
from nvcl_kit.param_builder import param_builder
from nvcl_kit.reader import NVCLReader


DATA_DIR = Path("data")
RAW_OUTPUT = DATA_DIR / "raw_holes.csv"

DEFAULT_STATE = "wa"
DEFAULT_MAX_BOREHOLES = 20
DEFAULT_RESOLUTION_M = 20.0
DEFAULT_TOP_N = 100

INVALID_LABELS = {"INVALID", "NOTAROK"}
NO_DATA_SENTINEL = -3.402823e38


def get_reader(
    state=DEFAULT_STATE,
    max_boreholes=DEFAULT_MAX_BOREHOLES,
):
    """Connect to the NVCL service for a state."""
    param = param_builder(
        state,
        max_boreholes=max_boreholes,
    )
    reader = NVCLReader(param)

    if not reader.wfs:
        raise ConnectionError(
            "Could not contact the NVCL WFS service."
        )

    return reader


def get_hole_ids(reader):
    """Return NVCL IDs available through the configured reader."""
    return reader.get_nvcl_id_list()


def pull_scalar(
    reader,
    scalar_class,
    log_type="1",
    resolution=DEFAULT_RESOLUTION_M,
    top_n=DEFAULT_TOP_N,
    remove_invalid=False,
):
    """
    Pull mineral-class scalar data for the configured boreholes.

    INVALID and NOTAROK rows are retained by default so that data-quality
    analysis can be performed before they are removed during cleaning.
    """
    rows = []

    for hole_id, _, scalar_data in gen_scalar_by_depth(
        reader,
        scalar_class=scalar_class,
        log_type=log_type,
        resolution=resolution,
        top_n=top_n,
        remove_invalid=remove_invalid,
    ):
        for depth, measurements in scalar_data.items():

            if not isinstance(measurements, list):
                measurements = [measurements]

            for measurement in measurements:
                rows.append(
                    {
                        "hole_id": hole_id,
                        "depth": float(depth),
                        "value": getattr(
                            measurement,
                            "classText",
                            None,
                        ),
                        "count": getattr(
                            measurement,
                            "classCount",
                            None,
                        ),
                    }
                )

    return rows


def print_quality_summary(df):
    """Print provenance and basic quality diagnostics."""
    labels = (
        df["value"]
        .astype(str)
        .str.strip()
        .str.upper()
    )

    invalid = labels.eq("INVALID")
    notarok = labels.eq("NOTAROK")
    sentinel = df["count"].eq(NO_DATA_SENTINEL)

    flagged = invalid | notarok | sentinel

    intervals = df[["hole_id", "depth"]].drop_duplicates()

    interval_quality = (
        df.assign(flagged=flagged)
        .groupby(["hole_id", "depth"])
        .agg(
            returned_records=("value", "size"),
            flagged_records=("flagged", "sum"),
        )
    )

    interval_quality["valid_records"] = (
        interval_quality["returned_records"]
        - interval_quality["flagged_records"]
    )

    unusable_intervals = (
        interval_quality["valid_records"] == 0
    ).sum()

    print("\nDOWNLOAD SUMMARY")
    print("=" * 60)
    print(f"Mineral/quality records: {len(df):,}")
    print(f"Unique holes:            {df['hole_id'].nunique()}")
    print(f"Sampled depth intervals: {len(intervals):,}")
    print(f"Distinct labels:         {df['value'].nunique()}")
    print(f"INVALID records:         {invalid.sum():,}")
    print(f"NOTAROK records:         {notarok.sum():,}")
    print(f"Sentinel records:        {sentinel.sum():,}")
    print(
        f"Flagged records:         {flagged.sum():,} "
        f"({flagged.mean() * 100:.2f}%)"
    )
    print(
        f"Unusable intervals:      {unusable_intervals:,} "
        f"({unusable_intervals / len(interval_quality) * 100:.2f}%)"
    )
    print("=" * 60)


if __name__ == "__main__":
    DATA_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    print("Connecting to WA NVCL...")
    reader = get_reader()

    hole_ids = get_hole_ids(reader)

    if not hole_ids:
        raise RuntimeError(
            "No NVCL boreholes were returned."
        )

    print(
        f"Found {len(hole_ids)} holes with NVCL scan data."
    )

    print(
        "\nPulling Grp1 uTSAS mineral groups "
        f"at {DEFAULT_RESOLUTION_M:g} m resolution..."
    )

    rows = pull_scalar(
        reader,
        Scalar.Grp1_uTSAS,
        log_type="1",
        resolution=DEFAULT_RESOLUTION_M,
        top_n=DEFAULT_TOP_N,
        remove_invalid=False,
    )

    if not rows:
        raise RuntimeError(
            "NVCL returned no Grp1 uTSAS data."
        )

    df = pd.DataFrame(rows)

    df["count"] = pd.to_numeric(
        df["count"],
        errors="coerce",
    )

    df = (
        df.sort_values(
            ["hole_id", "depth", "count"],
            ascending=[True, True, False],
            na_position="last",
        )
        .reset_index(drop=True)
    )

    print_quality_summary(df)

    df.to_csv(
        RAW_OUTPUT,
        index=False,
    )

    print(
        f"\nSaved raw TSA mineral data to {RAW_OUTPUT}"
    )