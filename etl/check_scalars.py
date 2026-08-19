from nvcl_kit.constants import Scalar

print("All available Scalar options in nvcl-kit:\n")
options = [x for x in dir(Scalar) if not x.startswith('_')]
for opt in sorted(options):
    print(f"  {opt}")

print(f"\nTotal: {len(options)} options")