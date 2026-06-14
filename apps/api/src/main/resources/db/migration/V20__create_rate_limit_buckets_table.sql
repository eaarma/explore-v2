CREATE TABLE IF NOT EXISTS rate_limit_buckets (
    bucket_namespace VARCHAR(100) NOT NULL,
    subject_key VARCHAR(255) NOT NULL,
    window_millis BIGINT NOT NULL,
    window_started_at TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (bucket_namespace, subject_key, window_millis, window_started_at)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_expires_at
    ON rate_limit_buckets (expires_at);
