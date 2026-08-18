import pandas as pd

# NVCL's placeholder for "no reading" - must be filtered out before use
NO_DATA_SENTINEL = -3.402823e+38


def clean_raw_data(df):
    """Remove no-data readings before any processing."""
    before = len(df)
    df = df[df["count"] != NO_DATA_SENTINEL]
    df = df[df["count"] > 0]
    after = len(df)
    print(f"Removed {before - after} invalid readings ({before} -> {after})")
    return df


def abundance_to_percentages(df):
    """Convert raw abundance counts into percentages per depth."""
    wide = df.pivot_table(
        index=["hole_id", "depth"],
        columns="value",
        values="count",
        aggfunc="sum",
        fill_value=0
    )
    totals = wide.sum(axis=1)
    pct = wide.div(totals, axis=0) * 100
    pct["total_n"] = totals
    return pct.reset_index()


if __name__ == "__main__":
    # Test with the known real values from hole 05GJD001
    test = pd.DataFrame([
        {"hole_id": "05GJD001", "depth": 150.0, "value": "CHLORITE", "count": 477},
        {"hole_id": "05GJD001", "depth": 150.0, "value": "DARK-MICA", "count": 194},
        {"hole_id": "05GJD001", "depth": 150.0, "value": "CARBONATE", "count": 81},
    ])

    result = abundance_to_percentages(test)
    print(result)
    print("\nExpected roughly: CHLORITE 63%, DARK-MICA 26%, CARBONATE 11%")
