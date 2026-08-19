"""
Compare the three TSA methods and measure how often they disagree.
Run: python etl/tsa_comparison.py
"""

from nvcl_kit.reader import NVCLReader
from nvcl_kit.param_builder import param_builder
from nvcl_kit.constants import Scalar
from nvcl_kit.generators import gen_scalar_by_depth
import pandas as pd
import os


def get_reader(state='wa', max_boreholes=5):
    param = param_builder(state, max_boreholes=max_boreholes)
    reader = NVCLReader(param)
    if not reader.wfs:
        raise ConnectionError("Could not contact the WFS service")
    return reader


def pull_method(reader, scalar_class, method_name):
    """Pull the mineral group for one TSA method across all holes."""
    rows = []
    try:
        for hole_id, log_id, sca_list in gen_scalar_by_depth(
            reader, scalar_class=scalar_class, log_type='1'
        ):
            for depth in sca_list:
                for meas in sca_list[depth]:
                    rows.append({
                        "hole_id": hole_id,
                        "depth": round(depth, 3),
                        "method": method_name,
                        "mineral": meas.classText,
                        "count": meas.classCount,
                    })
        print(f"  {method_name}: pulled {len(rows)} rows")
    except Exception as e:
        print(f"  {method_name}: FAILED. {e}")
    return rows


def get_dominant_mineral(df):
    """For each hole/depth/method, keep only the highest count mineral."""
    idx = df.groupby(["hole_id", "depth", "method"])["count"].idxmax()
    return df.loc[idx].reset_index(drop=True)


def compare_methods(dominant_df):
    """Pivot so each row is one depth with all method results side by side."""
    pivot = dominant_df.pivot_table(
        index=["hole_id", "depth"],
        columns="method",
        values="mineral",
        aggfunc="first"
    ).reset_index()

    method_cols = [c for c in pivot.columns if c not in ("hole_id", "depth")]

    def agreement(row):
        values = [row[c] for c in method_cols if pd.notna(row[c])]
        if len(values) < 2:
            return "insufficient_data"
        unique = set(values)
        if len(unique) == 1:
            return "all_agree"
        elif len(unique) < len(values):
            return "partial_agree"
        else:
            return "all_differ"

    pivot["agreement"] = pivot.apply(agreement, axis=1)
    return pivot, method_cols


def report(pivot):
    print("\n" + "=" * 55)
    print("TSA METHOD AGREEMENT SUMMARY")
    print("=" * 55)

    total = len(pivot)
    counts = pivot["agreement"].value_counts()

    for status in ["all_agree", "partial_agree", "all_differ", "insufficient_data"]:
        n = counts.get(status, 0)
        pct = (n / total * 100) if total else 0
        print(f"  {status:20s}: {n:6d} intervals ({pct:5.1f}%)")

    print(f"\n  Total intervals compared: {total}")

    disagree = counts.get("partial_agree", 0) + counts.get("all_differ", 0)
    disagree_pct = (disagree / total * 100) if total else 0
    print(f"\n  DISAGREEMENT RATE: {disagree_pct:.1f}%")
    print("  ^ Take this number to the client meeting.")
    print("=" * 55)

    print("\nPer hole breakdown:")
    for hole in sorted(pivot["hole_id"].unique()):
        sub = pivot[pivot["hole_id"] == hole]
        d = len(sub[sub["agreement"].isin(["partial_agree", "all_differ"])])
        print(f"  {hole}: {d}/{len(sub)} disagree ({d/len(sub)*100:.1f}%)")

    print("\nNOTE ON INTERPRETATION:")
    print("  Only SWIR methods (uTSAS, sTSAS, dTSAS) are compared here.")
    print("  TSAV (visible light) and TSAT (thermal infrared) detect different")
    print("  mineral families, so comparing them against SWIR is not like for like.")
    print("  An earlier run including sTSAV showed 100% 'disagreement', but that")
    print("  was simply TSAV reporting OXIDE while SWIR reported CHLORITE, both")
    print("  correct for their respective wavelength ranges.")


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)

    print("Connecting to NVCL...")
    reader = get_reader()

    print("\nPulling TSA methods:")
    # Compare only SWIR methods against each other, they measure the same thing.
    # TSAV (visible light) and TSAT (thermal) detect different mineral families
    # so comparing them to SWIR is not a like for like comparison.
    methods = [(Scalar.Grp1_uTSAS, "uTSAS")]

    for attr_name, label in [("Grp1_sTSAS", "sTSAS"), ("Grp1_dTSAS", "dTSAS")]:
        if hasattr(Scalar, attr_name):
            methods.append((getattr(Scalar, attr_name), label))
        else:
            print(f"  Note: {attr_name} not found in this nvcl-kit version")

    all_rows = []
    for scalar_class, name in methods:
        all_rows.extend(pull_method(reader, scalar_class, name))

    if not all_rows:
        print("\nNo data pulled. Check connection and scalar names.")
        exit(1)

    df = pd.DataFrame(all_rows)
    print(f"\nTotal rows across all methods: {len(df)}")

    dominant = get_dominant_mineral(df)
    pivot, method_cols = compare_methods(dominant)

    report(pivot)

    pivot.to_csv("data/tsa_comparison.csv", index=False)
    print("\nSaved to data/tsa_comparison.csv")

    disagreements = pivot[pivot["agreement"].isin(["partial_agree", "all_differ"])]
    if len(disagreements) > 0:
        print("\nExample disagreements (first 10):")
        print(disagreements.head(10).to_string(index=False))