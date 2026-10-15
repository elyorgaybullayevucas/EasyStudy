-- AI tekshiruv holati va kurs <-> mock imtihon bog'lanishi

ALTER TABLE answers ADD COLUMN ai_graded BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE answers ADD COLUMN transcript TEXT;           -- Speaking: audio transkripti
ALTER TABLE attempts ADD COLUMN ai_status VARCHAR(20) NOT NULL DEFAULT 'NONE'
    CHECK (ai_status IN ('NONE','PENDING','DONE','FAILED'));

-- Dars -> shu mavzu bo'yicha mock (bo'lim mashqi); kurs -> yakuniy to'liq mock
ALTER TABLE lessons ADD COLUMN exam_id BIGINT REFERENCES exams(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN final_exam_id BIGINT REFERENCES exams(id) ON DELETE SET NULL;
