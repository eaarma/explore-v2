DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'locations'
          AND column_name = 'notes'
          AND data_type <> 'text'
    ) THEN
        ALTER TABLE locations
            ALTER COLUMN notes TYPE TEXT
            USING CASE
                WHEN notes IS NULL THEN NULL
                ELSE notes::TEXT
            END;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'journeys'
          AND column_name = 'notes'
          AND data_type <> 'text'
    ) THEN
        ALTER TABLE journeys
            ALTER COLUMN notes TYPE TEXT
            USING CASE
                WHEN notes IS NULL THEN NULL
                ELSE notes::TEXT
            END;
    END IF;
END $$;
