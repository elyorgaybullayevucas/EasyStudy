-- Demo imtihon. Demo admin foydalanuvchi DemoDataInitializer orqali
-- APP_DEMO_ADMIN_PASSWORD env berilgan bo'lsa yaratiladi (hash SQL'da saqlanmaydi).

INSERT INTO exams (code, title, description, published) VALUES
('IELTS_ACADEMIC', 'IELTS Academic - Mock Test 1', 'Reading bo''limi sinov testi', TRUE);

INSERT INTO sections (exam_id, title, order_index, duration_minutes)
SELECT id, 'Reading', 1, 60 FROM exams WHERE code = 'IELTS_ACADEMIC';

INSERT INTO questions (section_id, order_index, type, prompt, passage, options, answer_key, points)
SELECT s.id, 1, 'TRUE_FALSE_NG',
       'The passage states that bees communicate through dance.',
       'Honeybees perform a "waggle dance" to tell hive-mates where food is located. The angle of the dance encodes direction relative to the sun.',
       '[{"key":"TRUE","text":"True"},{"key":"FALSE","text":"False"},{"key":"NG","text":"Not Given"}]',
       '{"accepted":["TRUE"]}', 1
FROM sections s JOIN exams e ON e.id = s.exam_id WHERE e.code = 'IELTS_ACADEMIC';

INSERT INTO questions (section_id, order_index, type, prompt, passage, options, answer_key, points)
SELECT s.id, 2, 'GAP_FILL',
       'The dance is called the ________ dance.',
       NULL, NULL, '{"accepted":["waggle"]}', 1
FROM sections s JOIN exams e ON e.id = s.exam_id WHERE e.code = 'IELTS_ACADEMIC';

INSERT INTO questions (section_id, order_index, type, prompt, passage, options, answer_key, points)
SELECT s.id, 3, 'SINGLE_CHOICE',
       'What does the angle of the dance encode?',
       NULL,
       '[{"key":"A","text":"Distance"},{"key":"B","text":"Direction relative to the sun"},{"key":"C","text":"Food quality"}]',
       '{"accepted":["B"]}', 1
FROM sections s JOIN exams e ON e.id = s.exam_id WHERE e.code = 'IELTS_ACADEMIC';

INSERT INTO band_conversion (exam_id, min_raw, max_raw, scaled)
SELECT id, 0, 0, 0.0 FROM exams WHERE code = 'IELTS_ACADEMIC'
UNION ALL SELECT id, 1, 1, 4.0 FROM exams WHERE code = 'IELTS_ACADEMIC'
UNION ALL SELECT id, 2, 2, 5.5 FROM exams WHERE code = 'IELTS_ACADEMIC'
UNION ALL SELECT id, 3, 3, 7.0 FROM exams WHERE code = 'IELTS_ACADEMIC';
