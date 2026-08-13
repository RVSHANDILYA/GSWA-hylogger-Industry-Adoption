import pandas as pd

def abundance_to_percentages(df, depth_col="depth", mineral_col="mineral", count_col="count"):
    wide = df.pivot_table(
        index=depth_col,
        columns=mineral_col,
        values=count_col,
        aggfunc="sum",
        fill_value=0
    )
    totals = wide.sum(axis=1)
    pct = wide.div(totals, axis=0) * 100
    pct["_total_n"] = totals
    return pct.reset_index()

if __name__ == "__main__":
    sample = pd.DataFrame([
        {"hole_id": "05GJD001", "depth": 150.0, "mineral": "CHLORITE", "count": 477},
        {"hole_id": "05GJD001", "depth": 150.0, "mineral": "DARK-MICA", "count": 194},
        {"hole_id": "05GJD001", "depth": 150.0, "mineral": "CARBONATE", "count": 81},
    ])
    result = abundance_to_percentages(sample)
    print(result)
