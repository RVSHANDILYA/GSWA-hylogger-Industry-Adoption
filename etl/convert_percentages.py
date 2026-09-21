"""
Convert raw uTSAS mineral-class counts into modelling-ready percentages
and interval-level quality diagnostics.

Inputs
------
data/raw_holes.csv

Outputs
-------
data/mineral_percentages.csv
    One row per (hole_id, depth), containing:
    - mineral percentage columns
    - total_n: total valid mineral classCount used for normalisation

data/interval_quality.csv
    One row per (hole_id, depth), containing data-quality diagnostics
    calculated after Final Mask filtering, before mineral-label cleaning.

Important
---------
The raw fetch deliberately retains INVALID and NOTAROK classifications.
They are used to measure data quality here, but they are excluded from
the mineral percentage calculation.
Final Mask is applied to native scans immediately after loading. Error is
averaged only over retained scans with valid mineral groups; Wt1 is not a
confidence measure and does not enter the classifier input.

Run
---
python etl/convert_percentages.py
"""

from pathlib import Path

import numpy as np
import pandas as pd


DATA_DIR = Path("data")

RAW_INPUT = DATA_DIR / "raw_holes.csv"
PERCENTAGE_OUTPUT = DATA_DIR / "mineral_percentages.csv"
QUALITY_OUTPUT = DATA_DIR / "interval_quality.csv"

INVALID_LABELS = {"INVALID", "NOTAROK"}
NO_DATA_SENTINEL = -3.402823e38

REQUIRED_COLUMNS = {
    "hole_id",
    "depth",
    "value",
    "count",
    "Final Mask",
    "Error",
    "method",
}


def filter_final_mask(df):
    """Keep native scans where the TSG inclusion mask is 1, before binning.

    TSG boolean masks retain 1 and exclude 0. Do not infer polarity from
    retention rates or average boolean masks across a depth interval.
    """
    if "Final Mask" not in df:
        raise AssertionError("Final Mask is required before conversion")
    mask = pd.to_numeric(df["Final Mask"], errors="coerce")
    if not mask.isin([0, 1]).all():
        raise AssertionError("Final Mask must contain only known binary values")
    kept = df.loc[mask.eq(1)].copy()
    print(f"Final Mask filter: {len(df):,} -> {len(kept):,} rows")
    if len(df) and len(kept) < len(df) * 0.1:
        print("WARNING: Final Mask excluded more than 90 percent; stopping for review.")
        raise AssertionError("Final Mask exclusion exceeds 90 percent")
    return kept


def validate_swir(df):
    """Require explicit SWIR provenance and reject other TSA methods."""
    if "method" not in df or not df["method"].eq("uTSAS").all():
        raise AssertionError("Only explicitly identified uTSAS data is accepted")
    for column in df.columns:
        upper = str(column).upper()
        if "TSA" in upper and "TSAS" not in upper:
            raise AssertionError(f"Non-SWIR column rejected: {column}")


def load_raw_data(path=RAW_INPUT):
    """Load the raw mineral dataset and validate its schema."""
    if not path.exists():
        raise FileNotFoundError(
            f"{path} does not exist. "
            "Run python etl/fetch_holes.py first."
        )

    df = pd.read_csv(path)
    df = filter_final_mask(df)
    validate_swir(df)

    missing_columns = REQUIRED_COLUMNS.difference(df.columns)

    if missing_columns:
        raise ValueError(
            "Raw dataset is missing required columns: "
            f"{sorted(missing_columns)}"
        )

    df = df.copy()

    df["depth"] = pd.to_numeric(
        df["depth"],
        errors="coerce",
    )

    df["count"] = pd.to_numeric(
        df["count"],
        errors="coerce",
    )

    df["value"] = (
        df["value"]
        .astype("string")
        .str.strip()
        .str.upper()
    )

    return df


def add_quality_flags(df):
    """Flag observations that must not contribute to mineral percentages."""
    out = df.copy()

    out["invalid_label"] = out["value"].isin(
        INVALID_LABELS
    )

    out["sentinel_count"] = np.isclose(
        out["count"],
        NO_DATA_SENTINEL,
        rtol=0,
        atol=0,
    )

    out["missing_value"] = (
        out["hole_id"].isna()
        | out["depth"].isna()
        | out["value"].isna()
        | out["count"].isna()
    )

    out["nonpositive_count"] = (
        out["count"].notna()
        & (out["count"] <= 0)
    )

    out["flagged"] = (
        out["invalid_label"]
        | out["sentinel_count"]
        | out["missing_value"]
        | out["nonpositive_count"]
    )

    return out


def build_interval_quality(df):
    """
    Create interval-level quality diagnostics.

    flagged_record_pct:
        Percentage of returned rows that were flagged.

    flagged_count_pct:
        Percentage of positive returned classCount associated with
        flagged rows. This complements the row-based quality measure.
    """
    working = df.copy()

    working["positive_count"] = working["count"].where(
        working["count"] > 0,
        0,
    )

    working["flagged_positive_count"] = (
        working["positive_count"].where(
            working["flagged"],
            0,
        )
    )

    quality = (
        working.groupby(
            ["hole_id", "depth"],
            as_index=False,
        )
        .agg(
            returned_records=("value", "size"),
            invalid_label_records=("invalid_label", "sum"),
            sentinel_records=("sentinel_count", "sum"),
            missing_records=("missing_value", "sum"),
            nonpositive_records=("nonpositive_count", "sum"),
            flagged_records=("flagged", "sum"),
            returned_count_n=("positive_count", "sum"),
            flagged_count_n=("flagged_positive_count", "sum"),
        )
    )

    quality["valid_records"] = (
        quality["returned_records"]
        - quality["flagged_records"]
    )

    quality["valid_count_n"] = (
        quality["returned_count_n"]
        - quality["flagged_count_n"]
    )

    quality["flagged_record_pct"] = np.where(
        quality["returned_records"] > 0,
        quality["flagged_records"]
        / quality["returned_records"]
        * 100,
        np.nan,
    )

    quality["flagged_count_pct"] = np.where(
        quality["returned_count_n"] > 0,
        quality["flagged_count_n"]
        / quality["returned_count_n"]
        * 100,
        np.nan,
    )

    quality["has_valid_data"] = (
        (quality["valid_records"] > 0)
        & (quality["valid_count_n"] > 0)
    )

    return quality


def clean_for_composition(df):
    """Remove flagged rows before calculating mineral composition."""
    clean = df.loc[
        ~df["flagged"],
        ["hole_id", "depth", "value", "count"],
    ].copy()

    if clean.empty:
        raise ValueError(
            "No valid mineral observations remain after cleaning."
        )

    return clean


def abundance_to_percentages(clean_df):
    """
    Convert valid mineral counts into percentages at each sampled depth.

    Duplicate mineral labels at the same hole/depth are summed before
    normalisation.
    """
    aggregated = (
        clean_df.groupby(
            ["hole_id", "depth", "value"],
            as_index=False,
        )["count"]
        .sum()
    )

    wide = aggregated.pivot_table(
        index=["hole_id", "depth"],
        columns="value",
        values="count",
        aggfunc="sum",
        fill_value=0,
    )

    totals = wide.sum(axis=1)

    if (totals <= 0).any():
        bad = totals[totals <= 0]

        raise ValueError(
            "Intervals with non-positive valid total count found:\n"
            f"{bad}"
        )

    percentages = wide.div(
        totals,
        axis=0,
    ) * 100

    percentages["total_n"] = totals

    result = (
        percentages
        .reset_index()
        .rename_axis(None, axis=1)
    )

    return result


def get_mineral_columns(df):
    """Return mineral percentage columns from the modelling dataset."""
    metadata = {
        "hole_id",
        "depth",
        "total_n",
        "Error", "Final Mask", "method",
    }

    return [
        column
        for column in df.columns
        if column not in metadata
    ]


def run_known_value_test():
    """
    Verify that known input counts map to the correct mineral percentages.

    The three counts below come from observed NVCL values, but this test is
    purely an arithmetic/mapping test rather than a claim about the complete
    mineral composition at that depth.
    """
    test = pd.DataFrame(
        [
            {
                "hole_id": "TEST",
                "depth": 100.0,
                "value": "CHLORITE",
                "count": 477,
            },
            {
                "hole_id": "TEST",
                "depth": 100.0,
                "value": "DARK-MICA",
                "count": 194,
            },
            {
                "hole_id": "TEST",
                "depth": 100.0,
                "value": "CARBONATE",
                "count": 81,
            },
        ]
    )

    result = abundance_to_percentages(test)

    total = 477 + 194 + 81

    expected = {
        "CHLORITE": 477 / total * 100,
        "DARK-MICA": 194 / total * 100,
        "CARBONATE": 81 / total * 100,
    }

    for mineral, expected_pct in expected.items():
        actual_pct = result.loc[0, mineral]

        if not np.isclose(
            actual_pct,
            expected_pct,
            rtol=0,
            atol=1e-8,
        ):
            raise AssertionError(
                f"Known-value test failed for {mineral}: "
                f"expected {expected_pct:.8f}, "
                f"got {actual_pct:.8f}"
            )

    print("Known-value percentage test: PASSED")


def validate_percentages(df):
    """Confirm that mineral percentages sum to approximately 100%."""
    mineral_columns = get_mineral_columns(df)

    if not mineral_columns:
        raise ValueError(
            "No mineral percentage columns were produced."
        )

    percentage_sums = df[mineral_columns].sum(
        axis=1
    )

    valid = np.isclose(
        percentage_sums,
        100.0,
        rtol=0,
        atol=1e-8,
    )

    if not valid.all():
        bad = df.loc[
            ~valid,
            ["hole_id", "depth"],
        ].copy()

        bad["percentage_sum"] = (
            percentage_sums.loc[~valid]
        )

        raise ValueError(
            "Mineral percentages do not sum to 100% "
            "for some intervals:\n"
            f"{bad.head(20)}"
        )

    return mineral_columns, percentage_sums


def validate_output_keys(percentages, quality):
    """Check that processed and quality datasets have unique interval keys."""
    key = ["hole_id", "depth"]

    if percentages.duplicated(key).any():
        raise ValueError(
            "Duplicate (hole_id, depth) keys found in "
            "mineral percentage output."
        )

    if quality.duplicated(key).any():
        raise ValueError(
            "Duplicate (hole_id, depth) keys found in "
            "interval quality output."
        )


def print_summary(
    raw,
    clean,
    percentages,
    quality,
    mineral_columns,
    percentage_sums,
):
    """Print conversion and data-quality results."""
    total_intervals = len(quality)

    with_valid_data = quality["has_valid_data"].sum()
    without_valid_data = total_intervals - with_valid_data

    print("\nMINERAL PERCENTAGE CONVERSION")
    print("=" * 65)

    print(f"Raw records:               {len(raw):,}")
    print(f"Valid mineral records:     {len(clean):,}")
    print(
        f"Flagged records removed:   "
        f"{raw['flagged'].sum():,} "
        f"({raw['flagged'].mean() * 100:.2f}%)"
    )

    print(f"Depth intervals in raw:    {total_intervals:,}")
    print(f"Intervals converted:       {len(percentages):,}")

    print(
        f"Intervals with valid data: "
        f"{with_valid_data:,} "
        f"({with_valid_data / total_intervals * 100:.2f}%)"
    )

    print(
        f"Intervals without valid data: "
        f"{without_valid_data:,} "
        f"({without_valid_data / total_intervals * 100:.2f}%)"
    )

    print(f"Unique holes:              {percentages['hole_id'].nunique()}")
    print(f"Mineral columns:           {len(mineral_columns)}")

    print("\nPercentage-sum validation:")
    print(
        f"Minimum: {percentage_sums.min():.10f}%"
    )
    print(
        f"Mean:    {percentage_sums.mean():.10f}%"
    )
    print(
        f"Maximum: {percentage_sums.max():.10f}%"
    )

    print("\nMineral columns:")
    for mineral in sorted(mineral_columns):
        print(f"  {mineral}")

    intervals_with_flags = (
        quality["flagged_records"] > 0
    ).sum()

    print("\nINTERVAL QUALITY")
    print("=" * 65)

    print(
        f"Intervals containing flagged records: "
        f"{intervals_with_flags:,}/{total_intervals:,} "
        f"({intervals_with_flags / total_intervals * 100:.1f}%)"
    )

    print("\nRecord-weighted flagged percentage:")
    print(
        quality["flagged_record_pct"]
        .describe()
        .to_string()
    )

    print("\nCount-weighted flagged percentage:")
    print(
        quality["flagged_count_pct"]
        .describe()
        .to_string()
    )

    print("=" * 65)


if __name__ == "__main__":
    DATA_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    print("Running percentage-conversion self-test...")
    run_known_value_test()

    print("\nLoading raw TSA mineral data...")
    raw = load_raw_data()

    raw = add_quality_flags(raw)

    quality = build_interval_quality(raw)

    clean = clean_for_composition(raw)

    percentages = abundance_to_percentages(
        clean
    )

    # Confidence uses mean Error over mask-retained scans with valid mineral
    # classifications. Any missing/invalid Error makes the interval unknown.
    valid_scans = raw.loc[~raw["flagged"]].copy()
    errors = pd.to_numeric(valid_scans["Error"], errors="coerce")
    valid_scans["Error"] = errors.where(np.isfinite(errors) & errors.ge(0))
    interval_errors = valid_scans.groupby(["hole_id", "depth"])["Error"].agg(
        lambda values: values.mean() if values.notna().all() else np.nan
    ).reset_index()
    percentages = percentages.merge(interval_errors, on=["hole_id", "depth"], validate="one_to_one")
    percentages["Final Mask"] = 1
    percentages["method"] = "uTSAS"

    percentages = (
        percentages
        .sort_values(["hole_id", "depth"])
        .reset_index(drop=True)
    )

    quality = (
        quality
        .sort_values(["hole_id", "depth"])
        .reset_index(drop=True)
    )

    validate_output_keys(
        percentages,
        quality,
    )

    mineral_columns, percentage_sums = (
        validate_percentages(percentages)
    )

    print_summary(
        raw,
        clean,
        percentages,
        quality,
        mineral_columns,
        percentage_sums,
    )

    percentages.to_csv(
        PERCENTAGE_OUTPUT,
        index=False,
    )

    quality.to_csv(
        QUALITY_OUTPUT,
        index=False,
    )

    print(
        f"\nSaved mineral percentages to "
        f"{PERCENTAGE_OUTPUT}"
    )

    print(
        f"Saved interval quality to "
        f"{QUALITY_OUTPUT}"
    )
