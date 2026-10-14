-- Kurslar moduli: kategoriyalar, kurslar, darslar, testlar, yozilish, progress, sertifikatlar.

CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    icon        VARCHAR(50),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE courses (
    id                BIGSERIAL PRIMARY KEY,
    title             VARCHAR(200) NOT NULL,
    slug              VARCHAR(220) NOT NULL UNIQUE,
    short_description VARCHAR(300) NOT NULL,
    description       TEXT NOT NULL DEFAULT '',
    thumbnail_url     VARCHAR(500),
    level             VARCHAR(20) NOT NULL DEFAULT 'BEGINNER' CHECK (level IN ('BEGINNER','INTERMEDIATE','ADVANCED')),
    price             INT NOT NULL DEFAULT 0,
    published         BOOLEAN NOT NULL DEFAULT FALSE,
    featured          BOOLEAN NOT NULL DEFAULT FALSE,
    category_id       BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    instructor_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_courses_published ON courses(published);
CREATE INDEX idx_courses_category ON courses(category_id);

CREATE TABLE lessons (
    id               BIGSERIAL PRIMARY KEY,
    course_id        BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title            VARCHAR(200) NOT NULL,
    content          TEXT NOT NULL DEFAULT '',
    video_url        VARCHAR(500),
    duration_minutes INT NOT NULL DEFAULT 0,
    position         INT NOT NULL DEFAULT 0,
    preview          BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_lessons_course ON lessons(course_id);

CREATE TABLE quizzes (
    id          BIGSERIAL PRIMARY KEY,
    course_id   BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id   BIGINT REFERENCES lessons(id) ON DELETE SET NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    pass_score  INT NOT NULL DEFAULT 70
);
CREATE INDEX idx_quizzes_course ON quizzes(course_id);

CREATE TABLE quiz_questions (
    id       BIGSERIAL PRIMARY KEY,
    quiz_id  BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    text     TEXT NOT NULL,
    position INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);

CREATE TABLE quiz_options (
    id          BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    text        VARCHAR(500) NOT NULL,
    correct     BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_quiz_options_question ON quiz_options(question_id);

CREATE TABLE enrollments (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id    BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, course_id)
);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);

CREATE TABLE lesson_progress (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id    BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, lesson_id)
);
CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);

CREATE TABLE quiz_attempts (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id       BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score         INT NOT NULL,
    correct_count INT NOT NULL,
    total_count   INT NOT NULL,
    passed        BOOLEAN NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id, quiz_id);

CREATE TABLE certificates (
    id        BIGSERIAL PRIMARY KEY,
    code      VARCHAR(32) NOT NULL UNIQUE,
    user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, course_id)
);

-- Mock imtihonlar uchun qo'shimcha maydonlar
ALTER TABLE exams ADD COLUMN category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE exams ADD COLUMN level VARCHAR(20) NOT NULL DEFAULT 'INTERMEDIATE' CHECK (level IN ('BEGINNER','INTERMEDIATE','ADVANCED'));
ALTER TABLE exams ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE;
