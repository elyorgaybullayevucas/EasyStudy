CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('STUDENT','TEACHER','ADMIN')),
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE exams (
    id            BIGSERIAL PRIMARY KEY,
    code          VARCHAR(40)  NOT NULL UNIQUE,   -- IELTS_ACADEMIC, SAT, TOPIK_II ...
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    published     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sections (
    id               BIGSERIAL PRIMARY KEY,
    exam_id          BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL,       -- Listening, Reading, Math ...
    order_index      INT NOT NULL,
    duration_minutes INT NOT NULL,
    audio_key        VARCHAR(512),                -- S3/MinIO object key (signed URL orqali beriladi)
    UNIQUE (exam_id, order_index)
);

CREATE TABLE questions (
    id          BIGSERIAL PRIMARY KEY,
    section_id  BIGINT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    type        VARCHAR(30) NOT NULL CHECK (type IN ('SINGLE_CHOICE','MULTI_CHOICE','GAP_FILL','TRUE_FALSE_NG','MATCHING','ESSAY')),
    prompt      TEXT NOT NULL,
    passage     TEXT,
    options     JSONB,          -- [{"key":"A","text":"..."}]
    answer_key  JSONB NOT NULL, -- {"accepted":["A"]}  -- hech qachon client'ga yuborilmaydi
    points      NUMERIC(5,2) NOT NULL DEFAULT 1,
    UNIQUE (section_id, order_index)
);

CREATE TABLE attempts (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id      BIGINT NOT NULL REFERENCES exams(id),
    started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    status       VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS','SUBMITTED','EXPIRED','GRADED')),
    raw_score    NUMERIC(7,2),
    scaled_score NUMERIC(7,2)
);
CREATE INDEX idx_attempts_user ON attempts(user_id);

CREATE TABLE answers (
    id          BIGSERIAL PRIMARY KEY,
    attempt_id  BIGINT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id),
    response    JSONB NOT NULL,
    is_correct  BOOLEAN,
    points      NUMERIC(5,2),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (attempt_id, question_id)
);

CREATE TABLE band_conversion (
    id        BIGSERIAL PRIMARY KEY,
    exam_id   BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    min_raw   INT NOT NULL,
    max_raw   INT NOT NULL,
    scaled    NUMERIC(7,2) NOT NULL
);

CREATE TABLE audit_log (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT,
    action     VARCHAR(60) NOT NULL,
    target     VARCHAR(120),
    ip         VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);
