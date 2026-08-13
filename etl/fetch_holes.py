from nvcl_kit.reader import NVCLReader
from nvcl_kit.param_builder import param_builder
from nvcl_kit.constants import Scalar
from nvcl_kit.generators import gen_scalar_by_depth
import pandas as pd

def get_reader(state='wa', max_boreholes=50):
    param = param_builder(state, max_boreholes=max_boreholes)
    reader = NVCLReader(param)
    return reader

def get_hole_list(reader):
    return reader.get_nvcl_id_list()

def pull_scalar(reader, scalar_class, log_type='1'):
    rows = []
    for hole_id, log_id, sca_list in gen_scalar_by_depth(
        reader, scalar_class=scalar_class, log_type=log_type
    ):
        for depth in sca_list:
            for meas in sca_list[depth]:
                rows.append({
                    "hole_id": hole_id,
                    "depth": depth,
                    "mineral": meas.classText,
                    "count": meas.classCount,
                })
    return rows

if __name__ == "__main__":
    reader = get_reader()
    nvcl_ids = get_hole_list(reader)
    print(f"Found {len(nvcl_ids)} holes with NVCL scan data")
    
    grp_rows = pull_scalar(reader, Scalar.Grp1_uTSAS)
    df = pd.DataFrame(grp_rows)
    print(f"Pulled {len(df)} rows")
    print(df.head(10))
