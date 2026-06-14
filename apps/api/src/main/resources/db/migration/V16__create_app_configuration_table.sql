CREATE TABLE app_configuration (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    app_title VARCHAR(255) NOT NULL,
    contact_email VARCHAR(320) NOT NULL,
    privacy_policy_version VARCHAR(50) NOT NULL,
    terms_version VARCHAR(50) NOT NULL,
    privacy_policy_document JSONB,
    terms_document JSONB,
    updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_configuration (
    id,
    app_title,
    contact_email,
    privacy_policy_version,
    terms_version
) VALUES (
    1,
    'Explore',
    'support@explore.app',
    '2026-05-31',
    '2026-05-31'
);
