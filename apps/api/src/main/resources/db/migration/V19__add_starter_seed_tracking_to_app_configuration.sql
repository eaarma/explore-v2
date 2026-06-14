ALTER TABLE app_configuration
    ADD COLUMN IF NOT EXISTS starter_data_seeded_at TIMESTAMPTZ;
