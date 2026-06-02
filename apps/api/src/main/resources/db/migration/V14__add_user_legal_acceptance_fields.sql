ALTER TABLE users
    ADD COLUMN terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN privacy_policy_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN terms_accepted_at TIMESTAMPTZ,
    ADD COLUMN privacy_policy_accepted_at TIMESTAMPTZ,
    ADD COLUMN terms_version VARCHAR(50),
    ADD COLUMN privacy_policy_version VARCHAR(50);
