DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'locations'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'locations'
              AND column_name = 'status'
        ) THEN
            ALTER TABLE locations ADD COLUMN status VARCHAR(50);
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'locations'
              AND column_name = 'active'
        ) THEN
            UPDATE locations
            SET status = CASE
                WHEN active THEN 'ACTIVE'
                ELSE 'INACTIVE'
            END
            WHERE status IS NULL;

            ALTER TABLE locations DROP COLUMN active;
        END IF;

        UPDATE locations
        SET status = 'ACTIVE'
        WHERE status IS NULL;

        ALTER TABLE locations ALTER COLUMN status SET NOT NULL;
        ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_status_check;
        ALTER TABLE locations
            ADD CONSTRAINT locations_status_check
            CHECK (status IN ('ACTIVE', 'INACTIVE'));
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'journeys'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'journeys'
              AND column_name = 'status'
        ) THEN
            ALTER TABLE journeys ADD COLUMN status VARCHAR(50);
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'journeys'
              AND column_name = 'active'
        ) THEN
            UPDATE journeys
            SET status = CASE
                WHEN active THEN 'ACTIVE'
                ELSE 'INACTIVE'
            END
            WHERE status IS NULL;

            ALTER TABLE journeys DROP COLUMN active;
        END IF;

        UPDATE journeys
        SET status = 'ACTIVE'
        WHERE status IS NULL;

        ALTER TABLE journeys ALTER COLUMN status SET NOT NULL;
        ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_status_check;
        ALTER TABLE journeys
            ADD CONSTRAINT journeys_status_check
            CHECK (status IN ('ACTIVE', 'INACTIVE'));
    END IF;
END $$;
