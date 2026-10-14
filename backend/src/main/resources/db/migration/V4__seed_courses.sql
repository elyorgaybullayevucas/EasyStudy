-- Demo kategoriyalar, kurs va qo'shimcha mock imtihon.

INSERT INTO categories (name, slug, description, icon) VALUES
('IELTS', 'ielts', 'Ingliz tili: Listening, Reading, Writing, Speaking', 'globe'),
('SAT', 'sat', 'AQSh universitetlariga kirish testi: Math va Reading', 'chart'),
('TOPIK', 'topik', 'Koreys tili sertifikati', 'sparkles'),
('Dasturlash', 'dasturlash', 'Python, JavaScript va boshqa tillar', 'code'),
('Matematika', 'matematika', 'Maktab va universitet matematikasi', 'briefcase');

UPDATE exams SET category_id = (SELECT id FROM categories WHERE slug = 'ielts'), featured = TRUE
WHERE code = 'IELTS_ACADEMIC';

-- SAT Math mini mock
INSERT INTO exams (code, title, description, published, category_id, level, featured) VALUES
('SAT_MATH_MINI', 'SAT Math - Mini Mock', 'Algebra va arifmetika bo''yicha 4 ta savol, 10 daqiqa',
 TRUE, (SELECT id FROM categories WHERE slug = 'sat'), 'INTERMEDIATE', TRUE);

INSERT INTO sections (exam_id, title, order_index, duration_minutes)
SELECT id, 'Math (No Calculator)', 1, 10 FROM exams WHERE code = 'SAT_MATH_MINI';

INSERT INTO questions (section_id, order_index, type, prompt, options, answer_key, points)
SELECT s.id, 1, 'SINGLE_CHOICE', 'If 3x + 5 = 20, what is the value of x?',
       '[{"key":"A","text":"3"},{"key":"B","text":"5"},{"key":"C","text":"15"},{"key":"D","text":"25"}]',
       '{"accepted":["B"]}', 1
FROM sections s JOIN exams e ON e.id = s.exam_id WHERE e.code = 'SAT_MATH_MINI';
INSERT INTO questions (section_id, order_index, type, prompt, options, answer_key, points)
SELECT s.id, 2, 'SINGLE_CHOICE', 'What is 15% of 200?',
       '[{"key":"A","text":"15"},{"key":"B","text":"20"},{"key":"C","text":"30"},{"key":"D","text":"45"}]',
       '{"accepted":["C"]}', 1
FROM sections s JOIN exams e ON e.id = s.exam_id WHERE e.code = 'SAT_MATH_MINI';
INSERT INTO questions (section_id, order_index, type, prompt, options, answer_key, points)
SELECT s.id, 3, 'GAP_FILL', 'The square root of 144 is ____.', NULL, '{"accepted":["12"]}', 1
FROM sections s JOIN exams e ON e.id = s.exam_id WHERE e.code = 'SAT_MATH_MINI';
INSERT INTO questions (section_id, order_index, type, prompt, options, answer_key, points)
SELECT s.id, 4, 'MULTI_CHOICE', 'Which of the following are prime numbers? (select all)',
       '[{"key":"A","text":"2"},{"key":"B","text":"9"},{"key":"C","text":"11"},{"key":"D","text":"15"}]',
       '{"accepted":["A","C"]}', 1
FROM sections s JOIN exams e ON e.id = s.exam_id WHERE e.code = 'SAT_MATH_MINI';

INSERT INTO band_conversion (exam_id, min_raw, max_raw, scaled)
SELECT id, 0, 0, 200 FROM exams WHERE code = 'SAT_MATH_MINI'
UNION ALL SELECT id, 1, 1, 400 FROM exams WHERE code = 'SAT_MATH_MINI'
UNION ALL SELECT id, 2, 2, 550 FROM exams WHERE code = 'SAT_MATH_MINI'
UNION ALL SELECT id, 3, 3, 700 FROM exams WHERE code = 'SAT_MATH_MINI'
UNION ALL SELECT id, 4, 4, 800 FROM exams WHERE code = 'SAT_MATH_MINI';

-- Demo kurs: IELTS Writing
INSERT INTO courses (title, slug, short_description, description, level, price, published, featured, category_id)
VALUES (
 'IELTS Writing: Task 1 va Task 2 asoslari', 'ielts-writing-asoslari',
 'IELTS Writing bo''limida 6.5+ olish uchun tuzilma, grammatika va vaqtni boshqarish.',
 'Bu kursda IELTS Writing Task 1 (grafik, jadval, jarayon) va Task 2 (esse) uchun tayyor shablonlar, eng ko''p uchraydigan xatolar va baholash mezonlari (Task Achievement, Coherence, Lexical Resource, Grammar) tushuntiriladi.

Har bir darsdan so''ng qisqa test bor. Kurs yakunida sertifikat beriladi.',
 'INTERMEDIATE', 0, TRUE, TRUE, (SELECT id FROM categories WHERE slug = 'ielts'));

INSERT INTO lessons (course_id, title, content, video_url, duration_minutes, position, preview)
SELECT id, 'Kirish: Writing bo''limi qanday baholanadi', 'To''rtta mezon: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy. Har biri 25% vazn.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 12, 1, TRUE
FROM courses WHERE slug = 'ielts-writing-asoslari';
INSERT INTO lessons (course_id, title, content, video_url, duration_minutes, position, preview)
SELECT id, 'Task 1: Grafik va jadvalni tasvirlash', 'Overview jumlasi, asosiy tendensiyalar, taqqoslash so''zlari: while, whereas, in contrast.', NULL, 18, 2, FALSE
FROM courses WHERE slug = 'ielts-writing-asoslari';
INSERT INTO lessons (course_id, title, content, video_url, duration_minutes, position, preview)
SELECT id, 'Task 2: Esse tuzilmasi', 'Kirish (paraphrase + thesis), 2 ta body paragraf (topic sentence + misol), xulosa. 250+ so''z.', NULL, 22, 3, FALSE
FROM courses WHERE slug = 'ielts-writing-asoslari';

INSERT INTO quizzes (course_id, lesson_id, title, description, pass_score)
SELECT id, NULL, 'Yakuniy test', 'Writing mezonlari va tuzilma bo''yicha', 70
FROM courses WHERE slug = 'ielts-writing-asoslari';

INSERT INTO quiz_questions (quiz_id, text, position)
SELECT q.id, 'Task 2 essesi kamida nechta so''zdan iborat bo''lishi kerak?', 0
FROM quizzes q JOIN courses c ON c.id = q.course_id WHERE c.slug = 'ielts-writing-asoslari';
INSERT INTO quiz_options (question_id, text, correct)
SELECT qq.id, '150', FALSE FROM quiz_questions qq WHERE qq.position = 0 AND qq.text LIKE 'Task 2 essesi%'
UNION ALL SELECT qq.id, '250', TRUE FROM quiz_questions qq WHERE qq.position = 0 AND qq.text LIKE 'Task 2 essesi%'
UNION ALL SELECT qq.id, '400', FALSE FROM quiz_questions qq WHERE qq.position = 0 AND qq.text LIKE 'Task 2 essesi%';

INSERT INTO quiz_questions (quiz_id, text, position)
SELECT q.id, 'Qaysi mezon Writing bahosiga KIRMAYDI?', 1
FROM quizzes q JOIN courses c ON c.id = q.course_id WHERE c.slug = 'ielts-writing-asoslari';
INSERT INTO quiz_options (question_id, text, correct)
SELECT qq.id, 'Coherence & Cohesion', FALSE FROM quiz_questions qq WHERE qq.text LIKE 'Qaysi mezon Writing%'
UNION ALL SELECT qq.id, 'Pronunciation', TRUE FROM quiz_questions qq WHERE qq.text LIKE 'Qaysi mezon Writing%'
UNION ALL SELECT qq.id, 'Lexical Resource', FALSE FROM quiz_questions qq WHERE qq.text LIKE 'Qaysi mezon Writing%';
