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


def main():

    conn = get_connection()

    try:
        load_hole_metadata(conn)
        load_classifications(conn)

    finally:
        conn.close()


if __name__ == "__main__":
    main()