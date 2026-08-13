from nvcl_kit.reader import NVCLReader
from nvcl_kit.param_builder import param_builder
import requests
import zipfile
import os

def get_reader(state='wa', max_boreholes=50):
    param = param_builder(state, max_boreholes=max_boreholes)
    reader = NVCLReader(param)
    return reader

def get_tsg_download_url(reader, nvcl_id):
    """Get the download URL for a hole's TSG package."""
    try:
        dataset_collection = reader.get_dataset_collection(nvcl_id)
        for dataset in dataset_collection:
            print(f"Dataset: {dataset}")
        return dataset_collection
    except Exception as e:
        print(f"Error getting dataset collection: {e}")
        return None

def download_tsg_package(url, hole_id, save_dir="data/tsg_files"):
    """Download and extract the TSG zip package for a hole."""
    os.makedirs(save_dir, exist_ok=True)
    hole_dir = os.path.join(save_dir, hole_id)
    os.makedirs(hole_dir, exist_ok=True)

    print(f"Downloading TSG package for {hole_id}...")
    response = requests.get(url, stream=True, timeout=120)
    zip_path = os.path.join(hole_dir, f"{hole_id}.zip")

    with open(zip_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    print(f"Extracting...")
    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(hole_dir)

    os.remove(zip_path)
    print(f"Done. Files saved to {hole_dir}")
    return hole_dir

if __name__ == "__main__":
    reader = get_reader()
    nvcl_ids = reader.get_nvcl_id_list()
    print(f"Found {len(nvcl_ids)} holes")

    # test on the first hole only
    test_id = nvcl_ids[0] if nvcl_ids else "05GJD001"
    print(f"Checking datasets for: {test_id}")
    get_tsg_download_url(reader, test_id)
