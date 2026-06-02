DO $$
BEGIN
    IF to_regclass(current_schema() || '.journeys') IS NOT NULL THEN
        CREATE TABLE IF NOT EXISTS journey_traits (
            id BIGSERIAL PRIMARY KEY,
            journey_id BIGINT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_journey_traits_journey_id_sort_order
            ON journey_traits (journey_id, sort_order);
    END IF;
END $$;
