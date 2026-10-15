-- Haqiqiy imtihon formatlari: ketma-ket bo'limlar, Writing/Speaking (qo'lda baholash), bo'limma-bo'lim konversiya, egalik.

ALTER TABLE exams ADD COLUMN owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE exams ADD COLUMN scoring_mode VARCHAR(20) NOT NULL DEFAULT 'TOTAL'
    CHECK (scoring_mode IN ('TOTAL','SECTION_AVERAGE','SECTION_SUM'));
ALTER TABLE exams ADD COLUMN template_code VARCHAR(40);
ALTER TABLE exams ADD COLUMN instructions TEXT;

ALTER TABLE sections ADD COLUMN part_type VARCHAR(20) NOT NULL DEFAULT 'GENERAL'
    CHECK (part_type IN ('LISTENING','READING','WRITING','SPEAKING','MATH','GENERAL'));
ALTER TABLE sections ADD COLUMN instructions TEXT;
ALTER TABLE sections ADD COLUMN default_points NUMERIC(5,2) NOT NULL DEFAULT 1;

ALTER TABLE questions DROP CONSTRAINT questions_type_check;
ALTER TABLE questions ADD CONSTRAINT questions_type_check
    CHECK (type IN ('SINGLE_CHOICE','MULTI_CHOICE','GAP_FILL','TRUE_FALSE_NG','MATCHING','ESSAY','SPEAKING'));
ALTER TABLE questions ADD COLUMN image_key VARCHAR(255);
ALTER TABLE questions ADD COLUMN min_words INT;
ALTER TABLE questions ADD COLUMN prep_seconds INT;
ALTER TABLE questions ADD COLUMN answer_seconds INT;
ALTER TABLE questions ADD COLUMN weight NUMERIC(4,2) NOT NULL DEFAULT 1;

ALTER TABLE band_conversion ADD COLUMN section_id BIGINT REFERENCES sections(id) ON DELETE CASCADE; -- NULL = umumiy
ALTER TABLE band_conversion ADD COLUMN label VARCHAR(40);
CREATE INDEX idx_band_conversion_exam ON band_conversion(exam_id, section_id);

ALTER TABLE answers ADD COLUMN feedback TEXT;
ALTER TABLE answers ADD COLUMN graded_by BIGINT;

CREATE TABLE attempt_sections (
    id           BIGSERIAL PRIMARY KEY,
    attempt_id   BIGINT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    section_id   BIGINT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at      TIMESTAMPTZ NOT NULL,
    finished_at  TIMESTAMPTZ,
    raw_score    NUMERIC(7,2),
    max_score    NUMERIC(7,2),
    scaled_score NUMERIC(7,2),
    UNIQUE (attempt_id, section_id)
);

-- Mavjud demo imtihonlar: egasi admin, bo'lim turlari
UPDATE exams SET owner_id = (SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id LIMIT 1);
UPDATE sections SET part_type = 'READING' WHERE title ILIKE '%reading%';
UPDATE sections SET part_type = 'MATH' WHERE title ILIKE '%math%';
UPDATE exams SET template_code = 'CUSTOM' WHERE template_code IS NULL;
