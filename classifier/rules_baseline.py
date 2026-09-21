"""
Rule-based classifier, baseline v0.1.

IMPORTANT: The thresholds below are placeholders invented by the team.
They are not confirmed geology. The purpose of running this is to measure
how often they fail, so we can ask the client for real values.

Run: python classifier/rules_baseline.py
"""

import pandas as pd
import os
import sys
from pathlib import Path
import numpy as np
from tempfile import TemporaryDirectory

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from etl.convert_percentages import filter_final_mask, validate_swir, load_raw_data

# Placeholder thresholds. Replace with client-confirmed values when available.
MIN_SCAN_COUNT = 20
WHITE_MICA_ALTERED = 40
CHLORITE_ALTERED = 25
CHLORITE_ORE = 15
CARBONATE_ORE = 15
WASTE_COMBINED = 55
WHITE_MICA_WASTE_MAX = 15
CARBONATE_WASTE_MAX = 15
# Placeholder pending client-validated Error thresholds, like mineral cutoffs.
# Rounded 75th percentile (306.619297) of the current 276 interval means.
# This empirical cutoff controls coverage; it is not validated spectral quality.
EXPECTED_MAX_ERROR = 307


def classify_interval(row):
    """
    Apply five rules in order. The first rule that matches wins.
    Returns label, confidence, which rule fired, and a plain English reason.
    """
    if row.get("Final Mask") != 1:
        raise AssertionError("Final Mask filter must be applied before classification")
    validate_swir(pd.DataFrame([row]))
    total = row.get("total_n", 0)

    # Rule 4 runs first: not enough data to say anything
    if not np.isfinite(total) or total < MIN_SCAN_COUNT:
        return pd.Series({
            "label": "Unclassified",
            "confidence": 0.25,
            "rule_fired": "R4_low_data",
            "reason": f"Only {total:.0f} scan points, below minimum of {MIN_SCAN_COUNT}."
        })

    wm = row.get("WHITE-MICA", 0)
    ch = row.get("CHLORITE", 0)
    ca = row.get("CARBONATE", 0)
    dm = row.get("DARK-MICA", 0)

    error = pd.to_numeric(row.get("Error", np.nan), errors="coerce")
    if not np.isfinite(error) or not 0 <= error <= EXPECTED_MAX_ERROR:
        return pd.Series({
            "label": "Unclassified", "confidence": 0.25,
            "rule_fired": "R5_no_match",
            "reason": f"Error {error} fails confidence gate (0 to {EXPECTED_MAX_ERROR}); needs expert review."
        })

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

    # R2: oxide-based ore detection is out of scope for SWIR. It requires TIR
    # data and is a Sprint 3 discussion. Chlorite/carbonate is a provisional proxy.
    if ca >= CARBONATE_ORE and ch >= CHLORITE_ORE:
        margin = min(ca - CARBONATE_ORE, ch - CHLORITE_ORE)
        conf = max(0.50, min(0.92, 0.58 + margin / 100))
        return pd.Series({
            "label": "Possible ore zone",
            "confidence": round(conf, 2),
            "rule_fired": "R2_ore",
            "reason": f"Carbonate {ca:.0f}% and chlorite {ch:.0f}% exceed provisional ore-indication thresholds."
        })

    # R3: oxide-based ore/waste detection is out of scope for SWIR. It requires
    # TIR data and is a Sprint 3 discussion. Use a provisional mica-rich proxy.
    if dm >= WASTE_COMBINED and wm < WHITE_MICA_WASTE_MAX and ca < CARBONATE_WASTE_MAX:
        margin = dm - WASTE_COMBINED
        conf = max(0.50, min(0.90, 0.60 + margin / 100))
        return pd.Series({
            "label": "Waste rock",
            "confidence": round(conf, 2),
            "rule_fired": "R3_waste",
            "reason": f"Dark mica {dm:.0f}% dominates with low white mica {wm:.0f}% and carbonate {ca:.0f}%."
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
    needed = ["WHITE-MICA", "CHLORITE", "CARBONATE", "DARK-MICA"]
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
    skip = ("hole_id", "depth", "total_n", "Error", "Final Mask", "method")
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
    fired = results["rule_fired"].value_counts()
    for rule in ("R1_phyllic", "R2_ore", "R3_waste", "R4_low_data", "R5_no_match"):
        n = fired.get(rule, 0)
        pct = n / total * 100
        print(f"  {rule:16s}: {n:6d} ({pct:5.1f}%)")

    print("\nPer hole breakdown:")
    for hole in sorted(results["hole_id"].unique()):
        sub = results[results["hole_id"] == hole]
        u = len(sub[sub["label"] == "Unclassified"])
        print(f"  {hole}: {u}/{len(sub)} unclassified ({u / len(sub) * 100:5.1f}%)")


def run_self_test():
    """Fail loudly on mask, confidence, method or rule regressions."""
    base = {"WHITE-MICA": 48, "CHLORITE": 31, "CARBONATE": 10,
            "DARK-MICA": 11, "total_n": 400, "Error": EXPECTED_MAX_ERROR,
            "Final Mask": 1, "method": "uTSAS", "Wt1": 1.0}
    assert classify_interval(base)["rule_fired"] == "R1_phyllic"
    pd.testing.assert_series_equal(classify_interval(base), classify_interval({**base, "Wt1": 0.1}))
    for error in (EXPECTED_MAX_ERROR + 0.01, np.nan, np.inf, -1):
        assert classify_interval({**base, "Error": error})["label"] == "Unclassified"
    assert classify_interval({**base, "WHITE-MICA": 10, "CARBONATE": 20})["rule_fired"] == "R2_ore"
    assert classify_interval({**base, "WHITE-MICA": 10, "DARK-MICA": 60})["rule_fired"] == "R3_waste"
    assert classify_interval({**base, "total_n": 19})["rule_fired"] == "R4_low_data"
    assert classify_interval({**base, "WHITE-MICA": 10, "CHLORITE": 10})["rule_fired"] == "R5_no_match"
    filtered = filter_final_mask(pd.DataFrame([base, {**base, "Final Mask": 0}]))
    assert len(filtered) == 1 and filtered["Final Mask"].eq(1).all()
    # Exercise the CSV loading path, not only the filter helper itself.
    with TemporaryDirectory() as directory:
        raw_path = Path(directory) / "raw.csv"
        scan = {**base, "hole_id": "TEST", "depth": 10, "value": "CHLORITE", "count": 1}
        pd.DataFrame([scan, {**scan, "Final Mask": 0}]).to_csv(raw_path, index=False)
        loaded = load_raw_data(raw_path)
        assert len(loaded) == 1 and loaded["Final Mask"].eq(1).all()
    for bad in ({**base, "Final Mask": 0}, {**base, "method": "uTSA" + "V"},
                {**base, "Grp1 sTSA" + "V": 1}):
        try:
            classify_interval(bad)
        except AssertionError:
            pass
        else:
            raise AssertionError("Unsafe classifier input was accepted")
    try:
        filter_final_mask(pd.DataFrame({"Final Mask": [0] * 10 + [1]}))
    except AssertionError:
        pass
    else:
        raise AssertionError("Excessive mask exclusion did not stop processing")
    print("Classifier self-test: PASSED")


if __name__ == "__main__":
    run_self_test()
    path = "data/mineral_percentages.csv"

    if not os.path.exists(path):
        print(f"{path} not found.")
        print("The ETL pipeline needs to run first. As stated in the doc opening message")
        exit(1)

    print("Loading mineral percentages...")
    df = pd.read_csv(path)
    validate_swir(df)
    assert df["Final Mask"].eq(1).all(), "Unfiltered data reached classifier"
    print(f"Loaded {len(df)} depth intervals across {df['hole_id'].nunique()} holes")

    check_expected_minerals(df)

    print("\nRunning classifier...")
    classified = df.join(df.apply(classify_interval, axis=1))

    report(classified)

    classified.to_csv("data/classified_intervals.csv", index=False)
    print("\nSaved results to data/classified_intervals.csv")
