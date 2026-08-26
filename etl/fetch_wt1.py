"""
Fetch uTSAS Wt1 values from the WA National Virtual Core Library.

Wt1 is a continuous numeric TSA output rather than a mineral-class output.
It therefore cannot be retrieved using nvcl-kit's get_borehole_data()
mineral-class pathway, which expects classText/classCount fields.

The NVCL numeric-scalar response for Wt1 contains:
- roundedDepth
- averageValue

This script deliberately stores Wt1 separately from the mineral-group data.
The two datasets can be joined using (hole_id, depth).

Output
------
data/wt1_utsas.csv

Run
---
python etl/fetch_wt1.py
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd
from nvcl_kit.param_builder import param_builder
from nvcl_kit.reader import NVCLReader


DATA_DIR = Path("data")
OUTPUT_FILE = DATA_DIR / "wt1_utsas.csv"

DEFAULT_STATE = "wa"
DEFAULT_MAX_BOREHOLES = 20
DEFAULT_RESOLUTION_M = 20.0
TARGET_LOG_NAME = "Wt1 uTSAS"


def get_reader(
    state=DEFAULT_STATE,
    max_boreholes=DEFAULT_MAX_BOREHOLES,
):
    """Connect to the NVCL service."""
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


def find_log(reader, hole_id, log_name=TARGET_LOG_NAME):
    """Find a named scalar log for one borehole."""
    target = log_name.strip().lower()

    for log in reader.get_logs_data(hole_id):
        current = str(log.log_name).strip().lower()

        if current == target:
            return log

    return None


def pull_wt1(
    reader,
    resolution=DEFAULT_RESOLUTION_M,
):
    """Retrieve Wt1 uTSAS values for all configured boreholes."""
    rows = []

    for hole_id in reader.get_nvcl_id_list():

        log = find_log(
            reader,
            hole_id,
        )

        if log is None:
            print(
                f"{hole_id}: {TARGET_LOG_NAME} not available"
            )
            continue

        raw = reader.svc.get_downsampled_data(
            log.log_id,
            interval=resolution,
            outputformat="json",
            startdepth=reader.min_depth,
            enddepth=reader.max_depth,
        )

        if not raw:
            print(
                f"{hole_id}: empty Wt1 response"
            )
            continue

        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            print(
                f"{hole_id}: invalid JSON response"
            )
            continue

        if not isinstance(data, list):
            print(
                f"{hole_id}: unexpected response format"
            )
            continue

        for item in data:
            rows.append(
                {
                    "hole_id": hole_id,
                    "depth": item.get("roundedDepth"),
                    "wt1": item.get("averageValue"),
                }
            )

    return pd.DataFrame(rows)


def print_summary(df):
    """Print Wt1 coverage and distribution statistics."""
    valid = df["wt1"].dropna()

    exactly_one = np.isclose(
        valid,
        1.0,
        rtol=0,
        atol=1e-12,
    ).sum()

    print("\nWT1 uTSAS SUMMARY")
    print("=" * 60)
    print(
        f"Holes represented:     {df['hole_id'].nunique()}"
    )
    print(
        f"Wt1 observations:      {len(df):,}"
    )
    print(
        f"Missing Wt1 values:    {df['wt1'].isna().sum():,}"
    )
    print(
        f"Exactly 1.0:           {exactly_one:,}"
    )

    if len(valid):
        print(
            f"Exactly 1.0 percent:   "
            f"{exactly_one / len(valid) * 100:.2f}%"
        )

    print("\nDistribution:")
    print(valid.describe())

    print("\nPer-hole summary:")
    print(
        df.groupby("hole_id")["wt1"]
        .agg(
            ["count", "min", "mean", "median", "max"]
        )
        .to_string()
    )

    print("=" * 60)


if __name__ == "__main__":
    DATA_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    print("Connecting to WA NVCL...")
    reader = get_reader()

    print(
        f"Pulling {TARGET_LOG_NAME} at "
        f"{DEFAULT_RESOLUTION_M:g} m resolution..."
    )

    df = pull_wt1(reader)

    if df.empty:
        raise RuntimeError(
            "No Wt1 uTSAS observations were returned."
        )

    df["depth"] = pd.to_numeric(
        df["depth"],
        errors="coerce",
    )

    df["wt1"] = pd.to_numeric(
        df["wt1"],
        errors="coerce",
    )

    df = (
        df.dropna(
            subset=["hole_id", "depth"]
        )
        .drop_duplicates(
            subset=["hole_id", "depth"],
            keep="first",
        )
        .sort_values(
            ["hole_id", "depth"]
        )
        .reset_index(drop=True)
    )

    print_summary(df)

    df.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print(
        f"\nSaved Wt1 data to {OUTPUT_FILE}"
    )