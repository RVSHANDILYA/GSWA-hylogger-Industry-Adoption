CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS validation CASCADE;
DROP TABLE IF EXISTS classification CASCADE;
DROP TABLE IF EXISTS interval CASCADE;
DROP TABLE IF EXISTS hole CASCADE;

CREATE TABLE hole (
    hole_id VARCHAR(50) PRIMARY KEY,
    region VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    total_depth_m DOUBLE PRECISION,
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interval (
    interval_id SERIAL PRIMARY KEY,
    hole_id VARCHAR(50) REFERENCES hole(hole_id),
    depth_from_m DOUBLE PRECISION NOT NULL,
    depth_to_m DOUBLE PRECISION NOT NULL,
    mineral VARCHAR(100),
    abundance_count INTEGER,
    mineral_pct DOUBLE PRECISION,
    tsa_method VARCHAR(20),
    confidence_weight DOUBLE PRECISION
);

CREATE TABLE classification (
    class_id SERIAL PRIMARY KEY,
    hole_id VARCHAR(50) REFERENCES hole(hole_id),
    depth_from_m DOUBLE PRECISION,
    depth_to_m DOUBLE PRECISION,
    label VARCHAR(50),
    confidence DOUBLE PRECISION,
    reason TEXT,
    rule_fired VARCHAR(100),
    final_mask BOOLEAN,
    confidence_error NUMERIC
);

CREATE TABLE validation (
    validation_id SERIAL PRIMARY KEY,
    hole_id VARCHAR(50) REFERENCES hole(hole_id),
    depth_from_m DOUBLE PRECISION,
    depth_to_m DOUBLE PRECISION,
    wamex_assay_value DOUBLE PRECISION,
    expert_label VARCHAR(50),
    predicted_label VARCHAR(50),
    is_match BOOLEAN
);

CREATE INDEX idx_interval_hole ON interval(hole_id);
CREATE INDEX idx_interval_depth ON interval(depth_from_m, depth_to_m);
CREATE INDEX idx_hole_geom ON hole USING GIST(geom);
