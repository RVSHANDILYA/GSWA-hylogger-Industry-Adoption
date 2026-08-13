from pytsg import parse_tsg
import pandas as pd
import os

def read_tsg_package(hole_dir):
    """Read a downloaded TSG package folder and return the data."""
    try:
        data = parse_tsg.read_package(hole_dir, read_cras_file=False)
        return data
    except Exception as e:
        print(f"Error reading TSG package: {e}")
        return None

def extract_scalar_summary(data, hole_id):
    """Extract the full TSA scalar summary from the TSG data."""
    try:
        df = data.nir.scalars
        df.insert(0, "hole_id", hole_id)
        print(f"Scalar columns available: {list(df.columns)}")
        return df
    except Exception as e:
        print(f"Error extracting scalars: {e}")
        return None

def extract_spectral_arrays(data, hole_id):
    """Extract raw 531-wavelength spectral arrays for the deep learning model."""
    try:
        spectra = data.nir.spectra
        depths = data.nir.sampleheaders["D"]
        df = pd.DataFrame(spectra)
        df.insert(0, "hole_id", hole_id)
        df.insert(1, "depth", depths)
        print(f"Spectral array shape: {spectra.shape}")
        return df
    except Exception as e:
        print(f"Error extracting spectral arrays: {e}")
        return None

if __name__ == "__main__":
    hole_dir = "data/tsg_files/05GJD001"

    if not os.path.exists(hole_dir):
        print(f"TSG files not found at {hole_dir}")
        print("Run fetch_tsg.py first to download the files")
    else:
        print(f"Reading TSG package from {hole_dir}")
        data = read_tsg_package(hole_dir)

        if data:
            hole_id = "05GJD001"
            print("\n--- Scalar summary (TSA full output) ---")
            scalars = extract_scalar_summary(data, hole_id)
            if scalars is not None:
                print(scalars.head(5))

            print("\n--- Raw spectral arrays (for deep learning model) ---")
            spectra = extract_spectral_arrays(data, hole_id)
            if spectra is not None:
                print(spectra.head(5))
