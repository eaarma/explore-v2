CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'MANAGER')),
    CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX idx_users_email ON users (email);
