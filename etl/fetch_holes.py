from nvcl_kit.reader import NVCLReader
from nvcl_kit.param_builder import param_builder
from nvcl_kit.constants import Scalar
from nvcl_kit.generators import gen_scalar_by_depth
import pandas as pd


def get_reader(state='wa', max_boreholes=20):
    """Connect to the NVCL service for a given state."""
    param = param_builder(state, max_boreholes=max_boreholes)
    reader = NVCLReader(param)
    if not reader.wfs:
        raise ConnectionError("Could not contact the WFS service")
    return reader


def get_hole_ids(reader):
    """Get list of holes that actually have NVCL scan data."""
    return reader.get_nvcl_id_list()


def pull_scalar(reader, scalar_class, log_type='1'):
    """Pull one scalar class for all holes. Returns a list of dicts."""
    rows = []
    for hole_id, log_id, sca_list in gen_scalar_by_depth(
        reader, scalar_class=scalar_class, log_type=log_type
    ):
        for depth in sca_list:
            for meas in sca_list[depth]:
                rows.append({
                    "hole_id": hole_id,
                    "depth": depth,
                    "value": meas.classText,
                    "count": meas.classCount,
                })
    return rows


if __name__ == "__main__":
    print("Connecting to NVCL...")
    reader = get_reader()

    hole_ids = get_hole_ids(reader)
    print(f"Found {len(hole_ids)} holes with scan data")

    # Grp1_uTSAS = dominant mineral group per depth interval
    print("Pulling mineral group data (Grp1_uTSAS)...")
    grp_rows = pull_scalar(reader, Scalar.Grp1_uTSAS)
    df = pd.DataFrame(grp_rows)

    print(f"Pulled {len(df)} rows")
    print(df.head(10))

    df.to_csv("data/raw_holes.csv", index=False)
    print("Saved to data/raw_holes.csv")
