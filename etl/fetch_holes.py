"""Fetch aligned Grp1, Min1, Wt1, Error and Final Mask native SWIR scans.

Final Mask must be filtered before aggregation into 20 m intervals. Existing
raw_holes.csv fixes the hole selection; otherwise the first 20 WA holes are
used. Wt1 records mineral mixture weight, not data quality.
Run: python etl/fetch_holes.py
"""

from pathlib import Path
from io import StringIO
import xml.etree.ElementTree as ET

import numpy as np
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


def pull_native_scalars(reader, hole_ids):
    """Fetch aligned SWIR scans, retaining the linked mask before binning.

    Final Mask is log type 6, unsupported by getDownsampledData. Download
    all five scalars together so duplicate scan depths remain aligned.
    getLogCollection exposes maskLogID (capital ID), which nvcl-kit currently
    misses when parsing mask_log_id. Never select a mask by name alone.
    """
    frames = []
    names = ("Grp1 uTSAS", "Min1 uTSAS", "Wt1 uTSAS", "Error uTSAS")
    for hole_id in hole_ids:
        datasets = ET.fromstring(reader.svc.get_dataset_collection(hole_id))
        candidates = []
        for dataset in datasets.findall("Dataset"):
            logs = ET.fromstring(reader.svc.get_log_collection(dataset.findtext("DatasetID")))
            selected = {}
            for name in names:
                matches = [log for log in logs.findall("Log") if log.findtext("logName") == name]
                if len(matches) > 1:
                    raise ValueError(f"{hole_id}: ambiguous {name} logs")
                if matches:
                    selected[name] = matches[0]
            if len(selected) == len(names):
                candidates.append((logs, selected))
        if len(candidates) != 1:
            raise ValueError(f"{hole_id}: expected one complete uTSAS dataset, got {len(candidates)}")
        logs, selected = candidates[0]
        mask_ids = {log.findtext("maskLogID") for log in selected.values()}
        if len(mask_ids) != 1 or None in mask_ids or "" in mask_ids:
            raise ValueError(f"{hole_id}: missing or inconsistent SWIR mask linkage")
        mask_id = mask_ids.pop()
        masks = [log for log in logs.findall("Log") if log.findtext("LogID") == mask_id]
        if len(masks) != 1 or masks[0].findtext("logName") != "Final Mask":
            raise ValueError(f"{hole_id}: linked mask is not Final Mask")
        ids = [log.findtext("LogID") for log in selected.values()] + [mask_id]
        native = pd.read_csv(StringIO(reader.get_scalar_data(ids)))
        required = {"StartDepth", "Grp1_uTSAS", "Min1_uTSAS", "Wt1_uTSAS", "Error_uTSAS", "Final_Mask"}
        if native.empty or not required.issubset(native.columns):
            raise ValueError(f"{hole_id}: incomplete native scalar response")
        native = native.rename(columns={
            "StartDepth": "sample_depth", "Grp1_uTSAS": "value",
            "Min1_uTSAS": "Min1", "Wt1_uTSAS": "Wt1",
            "Error_uTSAS": "Error", "Final_Mask": "Final Mask",
        })
        native["hole_id"] = hole_id
        native["method"] = "uTSAS"
        native["mask_log_id"] = mask_id
        native["depth"] = np.floor(native["sample_depth"] / DEFAULT_RESOLUTION_M) * DEFAULT_RESOLUTION_M + DEFAULT_RESOLUTION_M / 2
        native["count"] = 1
        frames.append(native[["hole_id", "depth", "sample_depth", "value", "count", "Min1", "Wt1", "Error", "Final Mask", "method", "mask_log_id"]])
        print(f"{hole_id}: {len(native):,} native SWIR scans downloaded")
    return pd.concat(frames, ignore_index=True)


def main():
    """Refresh the existing hole selection with all required native scalars."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    existing = pd.read_csv(RAW_OUTPUT, usecols=["hole_id"]) if RAW_OUTPUT.exists() else None
    reader = get_reader()
    hole_ids = existing["hole_id"].drop_duplicates().tolist() if existing is not None else get_hole_ids(reader)
    if not hole_ids:
        raise ValueError("No source holes selected")
    df = pull_native_scalars(reader, hole_ids)
    if set(df["hole_id"]) != set(hole_ids):
        raise ValueError("Downloaded hole selection differs from requested holes")
    temporary = RAW_OUTPUT.with_suffix(".tmp")
    df.to_csv(temporary, index=False)
    temporary.replace(RAW_OUTPUT)
    print(f"Saved {len(df):,} native scans across {len(hole_ids)} holes to {RAW_OUTPUT}")


if __name__ == "__main__":
    main()
