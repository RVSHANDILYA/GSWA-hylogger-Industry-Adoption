from pathlib import Path
import pandas as pd
import psycopg2
from nvcl_kit.param_builder import param_builder
from nvcl_kit.reader import NVCLReader


DATABASE_URL = (
    "postgresql://gswa:gswa123@localhost:5433/hylogger"
)

CLASSIFICATION_FILE = Path(
    "data/classified_intervals.csv"
)


MINERAL_COLUMNS = [
    "AMPHIBOLE",
    "CARBONATE",
    "CHLORITE",
    "DARK-MICA",
    "EPIDOTE",
    "KAOLIN",
    "OTHER-ALOH",
    "OTHER-MGOH",
    "PAL-SEP",
    "SERPENTINE",
    "SMECTITE",
    "SULPHATE",
    "TOURMALINE",
    "WHITE-MICA",
]


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def load_hole_metadata(conn):

    print("Loading hole metadata...")

    param = param_builder(
        "wa",
        max_boreholes=20
    )

    reader = NVCLReader(param)

    holes = reader.get_boreholes_list()

    with conn.cursor() as cur:

        for hole in holes:

            cur.execute(
                """
                INSERT INTO hole
                (
                    hole_id,
                    region,
                    latitude,
                    longitude,
                    total_depth_m,
                    geom
                )
                VALUES
                (
                    %s,%s,%s,%s,%s,
                    ST_SetSRID(
                        ST_MakePoint(%s,%s),
                        4326
                    )
                )
                ON CONFLICT (hole_id)
                DO NOTHING;
                """,
                (
                    hole.nvcl_id,
                    hole.project,
                    float(hole.y),
                    float(hole.x),
                    float(hole.boreholeLength_m),
                    float(hole.x),
                    float(hole.y),
                )
            )

    conn.commit()

    print(
        f"Inserted {len(holes)} holes"
    )


def load_classifications(conn):

    print("Loading classifications...")

    df = pd.read_csv(
        CLASSIFICATION_FILE
    )

    with conn.cursor() as cur:

        # Avoid duplicate classification rows when rerunning loader
        cur.execute(
            "TRUNCATE TABLE classification RESTART IDENTITY;"
        )

        for _, row in df.iterrows():

            cur.execute(
                """
                INSERT INTO classification
                (
                    hole_id,
                    depth_from_m,
                    depth_to_m,
                    label,
                    confidence,
                    reason,
                    rule_fired,
                    final_mask,
                    confidence_error
                )
                VALUES
                (%s,%s,%s,%s,%s,%s,%s,%s,%s);
                """,
                (
                    row.hole_id,
                    row.depth,
                    row.depth + 20,
                    row.label,
                    row.confidence,
                    row.reason,
                    row.rule_fired,
                    bool(row["Final Mask"]),
                    row.Error,
                )
            )

    conn.commit()

    print(
        f"Inserted {len(df)} classifications"
    )


def load_mineral_intervals(conn):

    print("Loading mineral composition...")

    df = pd.read_csv(
        CLASSIFICATION_FILE
    )

    inserted = 0

    with conn.cursor() as cur:

        # Avoid duplicate mineral rows when rerunning loader
        cur.execute(
            "TRUNCATE TABLE interval RESTART IDENTITY;"
        )

        for _, row in df.iterrows():

            for mineral in MINERAL_COLUMNS:

                percentage = row[mineral]

                # Skip missing or zero minerals
                if pd.isna(percentage) or percentage <= 0:
                    continue

                cur.execute(
                    """
                    INSERT INTO interval
                    (
                        hole_id,
                        depth_from_m,
                        depth_to_m,
                        mineral,
                        mineral_pct,
                        tsa_method,
                        confidence_weight
                    )
                    VALUES
                    (%s,%s,%s,%s,%s,%s,%s);
                    """,
                    (
                        row.hole_id,
                        row.depth,
                        row.depth + 20,
                        mineral,
                        float(percentage),
                        row.method,
                        float(row.Error),
                    )
                )

                inserted += 1

    conn.commit()

    print(
        f"Inserted {inserted} mineral records"
    )


def main():

    conn = get_connection()

    try:

        # Order matters: classification and interval both have a foreign
        # key on hole_id, so the hole rows must exist first.
        load_hole_metadata(conn)
        load_classifications(conn)
        load_mineral_intervals(conn)

    finally:

        conn.close()


if __name__ == "__main__":
    main()