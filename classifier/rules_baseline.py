"""
Rule-based classifier, baseline v0.1.

IMPORTANT: The thresholds below are placeholders invented by the team.
They are not confirmed geology. The purpose of running this is to measure
how often they fail, so we can ask the client for real values.

Run: python classifier/rules_baseline.py
"""

import pandas as pd
import os

# Placeholder thresholds. Replace with client-confirmed values when available.
MIN_SCAN_COUNT = 20
WHITE_MICA_ALTERED = 40
CHLORITE_ALTERED = 25
HEMATITE_ORE = 15
CHLORITE_ORE = 15
WASTE_COMBINED = 55
WHITE_MICA_WASTE_MAX = 15


def classify_interval(row):
    """
    Apply five rules in order. The first rule that matches wins.
    Returns label, confidence, which rule fired, and a plain English reason.
    """
    total = row.get("total_n", 0)

    # Rule 4 runs first: not enough data to say anything
    if total < MIN_SCAN_COUNT:
        return pd.Series({
            "label": "Unclassified",
            "confidence": 0.25,
            "rule_fired": "R4_low_data",
            "reason": f"Only {total:.0f} scan points, below minimum of {MIN_SCAN_COUNT}."
        })

    wm = row.get("WHITE-MICA", 0)
    ch = row.get("CHLORITE", 0)
    he = row.get("HEMATITE", 0)
    ka = row.get("KAOLIN", 0)
    go = row.get("GOETHITE", 0)

    # Rule 1: phyllic alteration
    if wm >= WHITE_MICA_ALTERED and ch >= CHLORITE_ALTERED:
        margin = min(wm - WHITE_MICA_ALTERED, ch - CHLORITE_ALTERED)
        conf = max(0.55, min(0.95, 0.62 + margin / 120))
        return pd.Series({
            "label": "Altered zone",
            "confidence": round(conf, 2),
            "rule_fired": "R1_phyllic",
            "reason": f"White mica {wm:.0f}% and chlorite {ch:.0f}% both above thresholds."
        })

    # Rule 2: possible ore
    if he >= HEMATITE_ORE and ch >= CHLORITE_ORE:
        margin = min(he - HEMATITE_ORE, ch - CHLORITE_ORE)
        conf = max(0.50, min(0.92, 0.58 + margin / 100))
        return pd.Series({
            "label": "Possible ore zone",
            "confidence": round(conf, 2),
            "rule_fired": "R2_ore",
            "reason": f"Hematite {he:.0f}% and chlorite {ch:.0f}% both above thresholds."
        })

    # Rule 3: weathered waste rock
    if (ka + go) >= WASTE_COMBINED and wm < WHITE_MICA_WASTE_MAX:
        margin = (ka + go) - WASTE_COMBINED
        conf = max(0.50, min(0.90, 0.60 + margin / 100))
        return pd.Series({
            "label": "Waste rock",
            "confidence": round(conf, 2),
            "rule_fired": "R3_waste",
            "reason": f"Kaolin plus goethite {ka + go:.0f}% with low white mica {wm:.0f}%."
        })

    # Rule 5: nothing matched
    return pd.Series({
        "label": "Unclassified",
        "confidence": 0.40,
        "rule_fired": "R5_no_match",
        "reason": "No rule threshold met. Needs expert review."
    })


def check_expected_minerals(df):
    """
    Warn if the minerals our rules depend on are missing from the data.
    If they are missing, every interval will come back unclassified and
    the result will be meaningless.
    """
    needed = ["WHITE-MICA", "CHLORITE", "HEMATITE", "KAOLIN", "GOETHITE"]
    present = [m for m in needed if m in df.columns]
    missing = [m for m in needed if m not in df.columns]

    print("\nMineral columns our rules depend on:")
    for m in present:
        n = (df[m] > 0).sum()
        print(f"  FOUND    {m}: appears in {n} intervals")
    for m in missing:
        print(f"  MISSING  {m}: not in the data at all")

    if missing:
        print("\n  WARNING: missing minerals mean those rules can never fire.")
        print("  Report this in the group chat.")

    print("\nAll mineral columns actually in the data:")
    skip = ("hole_id", "depth", "total_n")
    actual = [c for c in df.columns if c not in skip]
    for m in sorted(actual):
        n = (df[m] > 0).sum()
        print(f"  {m}: {n} intervals")


def report(results):
    """Print the summary. The unclassified rate is the key output."""
    total = len(results)
    counts = results["label"].value_counts()

    print("\n" + "=" * 60)
    print("BASELINE CLASSIFIER RESULTS")
    print("=" * 60)

    for label in ["Possible ore zone", "Altered zone", "Waste rock", "Unclassified"]:
        n = counts.get(label, 0)
        pct = (n / total * 100) if total else 0
        print(f"  {label:22s}: {n:6d} ({pct:5.1f}%)")

    unclassified = counts.get("Unclassified", 0)
    unclass_pct = (unclassified / total * 100) if total else 0

    print(f"\n  Total intervals: {total}")
    print(f"\n  UNCLASSIFIED RATE: {unclass_pct:.1f}%")
    print("  ^ This is the number for the client meeting.")
    print("=" * 60)

    print("\nWhich rule fired, and how often:")
    for rule, n in results["rule_fired"].value_counts().items():
        pct = n / total * 100
        print(f"  {rule:16s}: {n:6d} ({pct:5.1f}%)")

    print("\nPer hole breakdown:")
    for hole in sorted(results["hole_id"].unique()):
        sub = results[results["hole_id"] == hole]
        u = len(sub[sub["label"] == "Unclassified"])
        print(f"  {hole}: {u}/{len(sub)} unclassified ({u / len(sub) * 100:5.1f}%)")


if __name__ == "__main__":
    path = "data/mineral_percentages.csv"

    if not os.path.exists(path):
        print(f"{path} not found.")
        print("The ETL pipeline needs to run first. As stated in the doc opening message")
        exit(1)

    print("Loading mineral percentages...")
    df = pd.read_csv(path)
    print(f"Loaded {len(df)} depth intervals across {df['hole_id'].nunique()} holes")

    check_expected_minerals(df)

    print("\nRunning classifier...")
    classified = df.join(df.apply(classify_interval, axis=1))

    report(classified)

    classified.to_csv("data/classified_intervals.csv", index=False)
    print("\nSaved results to data/classified_intervals.csv")
