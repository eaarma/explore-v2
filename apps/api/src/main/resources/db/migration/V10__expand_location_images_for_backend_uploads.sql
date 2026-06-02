DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'location_images'
    ) THEN
        ALTER TABLE location_images
            ADD COLUMN IF NOT EXISTS storage_path TEXT,
            ADD COLUMN IF NOT EXISTS is_cover BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS uploaded_by UUID;

        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE table_schema = current_schema()
              AND table_name = 'location_images'
              AND constraint_name = 'fk_location_images_uploaded_by'
        ) THEN
            ALTER TABLE location_images
                ADD CONSTRAINT fk_location_images_uploaded_by
                    FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE SET NULL;
        END IF;

        CREATE INDEX IF NOT EXISTS idx_location_images_uploaded_by
            ON location_images (uploaded_by);

        UPDATE location_images
        SET is_cover = FALSE;

        UPDATE location_images li
        SET is_cover = TRUE
        FROM (
            SELECT DISTINCT ON (location_id)
                id
            FROM location_images
            ORDER BY location_id ASC, sort_order ASC, id ASC
        ) covers
        WHERE li.id = covers.id;
    END IF;
END $$;
