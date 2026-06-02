DO $$
DECLARE
    locations_sequence_name TEXT;
    journeys_sequence_name TEXT;
    next_location_id BIGINT;
    next_journey_id BIGINT;
BEGIN
    IF to_regclass(current_schema() || '.locations') IS NOT NULL THEN
        locations_sequence_name := pg_get_serial_sequence(
            current_schema() || '.locations',
            'id'
        );

        IF locations_sequence_name IS NULL THEN
            EXECUTE format(
                'CREATE SEQUENCE IF NOT EXISTS %I.%I',
                current_schema(),
                'locations_id_seq'
            );

            EXECUTE format(
                'ALTER TABLE %I.%I ALTER COLUMN id SET DEFAULT nextval(%L::regclass)',
                current_schema(),
                'locations',
                current_schema() || '.locations_id_seq'
            );

            EXECUTE format(
                'ALTER SEQUENCE %I.%I OWNED BY %I.%I.id',
                current_schema(),
                'locations_id_seq',
                current_schema(),
                'locations'
            );

            locations_sequence_name := current_schema() || '.locations_id_seq';
        END IF;

        SELECT COALESCE(MAX(id), 0) + 1
        INTO next_location_id
        FROM locations;

        EXECUTE format(
            'SELECT setval(%L::regclass, %s, false)',
            locations_sequence_name,
            next_location_id
        );
    END IF;

    IF to_regclass(current_schema() || '.journeys') IS NOT NULL THEN
        journeys_sequence_name := pg_get_serial_sequence(
            current_schema() || '.journeys',
            'id'
        );

        IF journeys_sequence_name IS NULL THEN
            EXECUTE format(
                'CREATE SEQUENCE IF NOT EXISTS %I.%I',
                current_schema(),
                'journeys_id_seq'
            );

            EXECUTE format(
                'ALTER TABLE %I.%I ALTER COLUMN id SET DEFAULT nextval(%L::regclass)',
                current_schema(),
                'journeys',
                current_schema() || '.journeys_id_seq'
            );

            EXECUTE format(
                'ALTER SEQUENCE %I.%I OWNED BY %I.%I.id',
                current_schema(),
                'journeys_id_seq',
                current_schema(),
                'journeys'
            );

            journeys_sequence_name := current_schema() || '.journeys_id_seq';
        END IF;

        SELECT COALESCE(MAX(id), 0) + 1
        INTO next_journey_id
        FROM journeys;

        EXECUTE format(
            'SELECT setval(%L::regclass, %s, false)',
            journeys_sequence_name,
            next_journey_id
        );
    END IF;
END $$;
