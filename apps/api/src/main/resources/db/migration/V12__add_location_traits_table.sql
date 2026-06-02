DO $$
BEGIN
    IF to_regclass(current_schema() || '.locations') IS NOT NULL THEN
        CREATE TABLE IF NOT EXISTS location_traits (
            id BIGSERIAL PRIMARY KEY,
            location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_location_traits_location_id_sort_order
            ON location_traits (location_id, sort_order);
    END IF;
END $$;
