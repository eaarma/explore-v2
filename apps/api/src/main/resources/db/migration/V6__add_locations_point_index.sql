DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'locations'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'locations'
          AND column_name = 'point'
    ) THEN
        UPDATE locations
        SET point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
        WHERE point IS NULL
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL;

        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_locations_point ON locations USING GIST (point)';
    END IF;
END $$;
