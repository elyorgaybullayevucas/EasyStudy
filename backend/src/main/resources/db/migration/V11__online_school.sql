-- Onlayn maktab: fan -> bosqichlar (daraja bo'yicha), joylashtirish (daraja aniqlash) testi, bo'limlar (modullar), ketma-ket ochiladigan darslar.

-- Kurs = fan ichidagi bosqich. stage: 1,2,3... (NULL = bosqichsiz oddiy kurs). min_placement_score: daraja testidan shu foiz va undan yuqori -> shu bosqich tavsiya etiladi.
ALTER TABLE courses ADD COLUMN stage SMALLINT;
ALTER TABLE courses ADD COLUMN min_placement_score SMALLINT NOT NULL DEFAULT 0;
-- Ketma-ket rejim: keyingi dars oldingi dars tugatilgach (va dars testi topshirilgach) ochiladi.
ALTER TABLE courses ADD COLUMN sequential BOOLEAN NOT NULL DEFAULT FALSE;

-- Bo'limlar (modullar): mavzular guruhi + bo'lim yakunidagi mock.
CREATE TABLE course_modules (
    id          BIGSERIAL PRIMARY KEY,
    course_id   BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    position    INT NOT NULL DEFAULT 0,
    exam_id     BIGINT REFERENCES exams(id) ON DELETE SET NULL
);
CREATE INDEX idx_course_modules_course ON course_modules(course_id, position);
ALTER TABLE lessons ADD COLUMN module_id BIGINT REFERENCES course_modules(id) ON DELETE SET NULL;

-- Fan: daraja aniqlash testi va tayyorlaydigan sertifikatlar (vergul bilan ajratilgan kategoriya sluglari).
ALTER TABLE categories ADD COLUMN placement_exam_id BIGINT REFERENCES exams(id) ON DELETE SET NULL;
ALTER TABLE categories ADD COLUMN cert_slugs VARCHAR(200);

-- Talabaning fan bo'yicha joylashtirilgan bosqichi (oxirgi daraja testi natijasi).
CREATE TABLE placements (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id   BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    attempt_id    BIGINT REFERENCES attempts(id) ON DELETE SET NULL,
    score_percent SMALLINT NOT NULL,
    stage         SMALLINT NOT NULL,
    course_id     BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, category_id)
);

UPDATE categories SET cert_slugs = 'dtm,milliy-sertifikat' WHERE slug IN ('matematika', 'fizika', 'kimyo', 'biologiya', 'tarix', 'ona-tili-adabiyot');
UPDATE categories SET cert_slugs = 'ielts,milliy-sertifikat,sat' WHERE slug = 'ingliz-tili';

-- =====================================================================
-- Namuna: Matematika fani - daraja testi + 3 bosqich (1-bosqich to'liq: 2 bo'lim, darslar, testlar, bo'lim mock'i, yakuniy imtihon)
-- =====================================================================
DO $school$
DECLARE
    admin_id BIGINT;
    cat_math BIGINT;
    ex_place BIGINT; ex_m1 BIGINT; ex_final BIGINT;
    sid BIGINT;
    c1 BIGINT; c2 BIGINT; c3 BIGINT;
    m1 BIGINT; m2 BIGINT; m21 BIGINT; m31 BIGINT;
    l1 BIGINT; l2 BIGINT; l3 BIGINT; l4 BIGINT; l5 BIGINT; l6 BIGINT; l7 BIGINT; l8 BIGINT; l9 BIGINT;
    qz BIGINT; qq BIGINT;
BEGIN
    SELECT id INTO admin_id FROM users WHERE role = 'ADMIN' ORDER BY id LIMIT 1;
    SELECT id INTO cat_math FROM categories WHERE slug = 'matematika';

    -- ---------- Daraja aniqlash testi (15 savol: 5 oson, 5 o'rta, 5 qiyin; 30 daqiqa, erkin navigatsiya) ----------
    INSERT INTO exams (code, title, description, published, category_id, level, featured, owner_id, scoring_mode, template_code, navigation_mode, instructions)
    VALUES ('MATH_PLACEMENT', 'Matematika: darajani aniqlash testi',
            '15 savol, 30 daqiqa. Natijaga ko''ra qaysi bosqichdan boshlashingiz belgilanadi: 0-39% -> 1-bosqich, 40-74% -> 2-bosqich, 75%+ -> 3-bosqich.',
            TRUE, cat_math, 'BEGINNER', FALSE, admin_id, 'TOTAL', 'CUSTOM', 'FREE',
            'Bu test baho uchun emas - hozirgi darajangizni aniqlash uchun. Bilmagan savolni o''tkazib yuboring, taxmin qilmang: shunda bosqich to''g''ri tanlanadi.')
    RETURNING id INTO ex_place;
    INSERT INTO sections (exam_id, title, order_index, duration_minutes, part_type, instructions, default_points)
    VALUES (ex_place, 'Daraja testi', 1, 30, 'MATH', '15 savol, har biri 1 ball.', 1) RETURNING id INTO sid;
    INSERT INTO questions (section_id, order_index, type, prompt, options, answer_key, points) VALUES
    (sid, 1, 'SINGLE_CHOICE', '$7 \times 8 = ?$', '[{"key":"A","text":"54"},{"key":"B","text":"56"},{"key":"C","text":"58"},{"key":"D","text":"64"}]', '{"accepted":["B"]}', 1),
    (sid, 2, 'SINGLE_CHOICE', '$125 - 48 = ?$', '[{"key":"A","text":"77"},{"key":"B","text":"83"},{"key":"C","text":"87"},{"key":"D","text":"67"}]', '{"accepted":["A"]}', 1),
    (sid, 3, 'SINGLE_CHOICE', 'Qaysi son 3 ga bo''linadi?', '[{"key":"A","text":"124"},{"key":"B","text":"217"},{"key":"C","text":"342"},{"key":"D","text":"475"}]', '{"accepted":["C"]}', 1),
    (sid, 4, 'SINGLE_CHOICE', '$\frac{1}{2} + \frac{1}{4} = ?$', '[{"key":"A","text":"$\\frac{2}{6}$"},{"key":"B","text":"$\\frac{3}{4}$"},{"key":"C","text":"$\\frac{1}{6}$"},{"key":"D","text":"$\\frac{2}{4}$"}]', '{"accepted":["B"]}', 1),
    (sid, 5, 'SINGLE_CHOICE', '$0{,}25 \times 4 = ?$', '[{"key":"A","text":"0,1"},{"key":"B","text":"1"},{"key":"C","text":"10"},{"key":"D","text":"100"}]', '{"accepted":["B"]}', 1),
    (sid, 6, 'SINGLE_CHOICE', '$2x + 5 = 17$ tenglamaning ildizi:', '[{"key":"A","text":"5"},{"key":"B","text":"6"},{"key":"C","text":"7"},{"key":"D","text":"11"}]', '{"accepted":["B"]}', 1),
    (sid, 7, 'SINGLE_CHOICE', '$(a+b)^2$ ifodaning yoyilmasi:', '[{"key":"A","text":"$a^2+b^2$"},{"key":"B","text":"$a^2+2ab+b^2$"},{"key":"C","text":"$a^2-2ab+b^2$"},{"key":"D","text":"$2a+2b$"}]', '{"accepted":["B"]}', 1),
    (sid, 8, 'SINGLE_CHOICE', '$\sqrt{144} + \sqrt{25} = ?$', '[{"key":"A","text":"13"},{"key":"B","text":"17"},{"key":"C","text":"19"},{"key":"D","text":"169"}]', '{"accepted":["B"]}', 1),
    (sid, 9, 'SINGLE_CHOICE', '$3^4 = ?$', '[{"key":"A","text":"12"},{"key":"B","text":"27"},{"key":"C","text":"64"},{"key":"D","text":"81"}]', '{"accepted":["D"]}', 1),
    (sid, 10, 'SINGLE_CHOICE', '20% i 45 ga teng bo''lgan son:', '[{"key":"A","text":"90"},{"key":"B","text":"180"},{"key":"C","text":"225"},{"key":"D","text":"900"}]', '{"accepted":["C"]}', 1),
    (sid, 11, 'SINGLE_CHOICE', '$x^2 - 5x + 6 = 0$ tenglama ildizlari yig''indisi:', '[{"key":"A","text":"-5"},{"key":"B","text":"5"},{"key":"C","text":"6"},{"key":"D","text":"1"}]', '{"accepted":["B"]}', 1),
    (sid, 12, 'SINGLE_CHOICE', '$\log_2 32 = ?$', '[{"key":"A","text":"4"},{"key":"B","text":"5"},{"key":"C","text":"6"},{"key":"D","text":"16"}]', '{"accepted":["B"]}', 1),
    (sid, 13, 'SINGLE_CHOICE', '$\sin 30^\circ + \cos 60^\circ = ?$', '[{"key":"A","text":"0"},{"key":"B","text":"$\\frac{1}{2}$"},{"key":"C","text":"1"},{"key":"D","text":"$\\sqrt{3}$"}]', '{"accepted":["C"]}', 1),
    (sid, 14, 'SINGLE_CHOICE', 'Arifmetik progressiyada $a_1 = 3$, $d = 4$. $a_{10} = ?$', '[{"key":"A","text":"36"},{"key":"B","text":"39"},{"key":"C","text":"40"},{"key":"D","text":"43"}]', '{"accepted":["B"]}', 1),
    (sid, 15, 'SINGLE_CHOICE', '$f(x) = x^3 - 3x$ funksiyaning hosilasi:', '[{"key":"A","text":"$3x^2 - 3$"},{"key":"B","text":"$x^2 - 3$"},{"key":"C","text":"$3x^2$"},{"key":"D","text":"$3x - 3$"}]', '{"accepted":["A"]}', 1);
    INSERT INTO band_conversion (exam_id, section_id, min_raw, max_raw, scaled, label) VALUES
    (ex_place, NULL, 0, 5, 1, '1-bosqichdan boshlang: asoslar'), (ex_place, NULL, 6, 11, 2, '2-bosqichdan boshlang: algebra'), (ex_place, NULL, 12, 15, 3, '3-bosqichdan boshlang: analiz');
    UPDATE categories SET placement_exam_id = ex_place WHERE id = cat_math;

    -- ---------- 1-bosqich, 1-bo'lim mock'i (10 savol, 20 daqiqa) ----------
    INSERT INTO exams (code, title, description, published, category_id, level, featured, owner_id, scoring_mode, template_code, navigation_mode, instructions)
    VALUES ('MATH_S1_M1_MOCK', 'Matematika 1-bosqich: "Sonlar va amallar" bo''lim mock''i', '10 savol, 20 daqiqa. Bo''lim tugagach tayyorgarlikni tekshiring.', TRUE, cat_math, 'BEGINNER', FALSE, admin_id, 'TOTAL', 'DTM_SUBJECT', 'FREE',
            'DTM uslubidagi 10 savol. Har savol 1 ball; 7 va undan yuqori - bo''lim o''zlashtirilgan.')
    RETURNING id INTO ex_m1;
    INSERT INTO sections (exam_id, title, order_index, duration_minutes, part_type, instructions, default_points)
    VALUES (ex_m1, 'Sonlar va amallar', 1, 20, 'MATH', '10 savol.', 1) RETURNING id INTO sid;
    INSERT INTO questions (section_id, order_index, type, prompt, options, answer_key, points) VALUES
    (sid, 1, 'SINGLE_CHOICE', '$48 : 6 + 7 \times 3 = ?$', '[{"key":"A","text":"29"},{"key":"B","text":"45"},{"key":"C","text":"23"},{"key":"D","text":"31"}]', '{"accepted":["A"]}', 1),
    (sid, 2, 'SINGLE_CHOICE', 'EKUB(36, 48) = ?', '[{"key":"A","text":"6"},{"key":"B","text":"12"},{"key":"C","text":"18"},{"key":"D","text":"24"}]', '{"accepted":["B"]}', 1),
    (sid, 3, 'SINGLE_CHOICE', 'EKUK(4, 6) = ?', '[{"key":"A","text":"10"},{"key":"B","text":"12"},{"key":"C","text":"24"},{"key":"D","text":"2"}]', '{"accepted":["B"]}', 1),
    (sid, 4, 'SINGLE_CHOICE', '$\frac{3}{5} - \frac{1}{10} = ?$', '[{"key":"A","text":"$\\frac{2}{5}$"},{"key":"B","text":"$\\frac{1}{2}$"},{"key":"C","text":"$\\frac{2}{15}$"},{"key":"D","text":"$\\frac{4}{10}$"}]', '{"accepted":["B"]}', 1),
    (sid, 5, 'SINGLE_CHOICE', '$2\frac{1}{3} \times \frac{3}{7} = ?$', '[{"key":"A","text":"1"},{"key":"B","text":"$\\frac{6}{7}$"},{"key":"C","text":"$\\frac{7}{9}$"},{"key":"D","text":"$\\frac{2}{7}$"}]', '{"accepted":["A"]}', 1),
    (sid, 6, 'SINGLE_CHOICE', '$1{,}2 \times 0{,}5 = ?$', '[{"key":"A","text":"0,06"},{"key":"B","text":"0,6"},{"key":"C","text":"6"},{"key":"D","text":"1,7"}]', '{"accepted":["B"]}', 1),
    (sid, 7, 'SINGLE_CHOICE', '$3{,}6 : 0{,}4 = ?$', '[{"key":"A","text":"0,9"},{"key":"B","text":"9"},{"key":"C","text":"90"},{"key":"D","text":"1,44"}]', '{"accepted":["B"]}', 1),
    (sid, 8, 'SINGLE_CHOICE', '80 ning 15% i:', '[{"key":"A","text":"8"},{"key":"B","text":"12"},{"key":"C","text":"15"},{"key":"D","text":"20"}]', '{"accepted":["B"]}', 1),
    (sid, 9, 'SINGLE_CHOICE', 'Narx 200 000 so''mdan 250 000 so''mga oshdi. Necha foizga oshgan?', '[{"key":"A","text":"20%"},{"key":"B","text":"25%"},{"key":"C","text":"50%"},{"key":"D","text":"125%"}]', '{"accepted":["B"]}', 1),
    (sid, 10, 'SINGLE_CHOICE', '$(-3) \times (-4) - 5 = ?$', '[{"key":"A","text":"-17"},{"key":"B","text":"7"},{"key":"C","text":"17"},{"key":"D","text":"-7"}]', '{"accepted":["B"]}', 1);
    INSERT INTO band_conversion (exam_id, section_id, min_raw, max_raw, scaled, label) VALUES
    (ex_m1, NULL, 0, 4, 0, 'Bo''limni qayta ko''ring'), (ex_m1, NULL, 5, 6, 1, 'Qoniqarli - mashqlarni davom ettiring'), (ex_m1, NULL, 7, 10, 2, 'Bo''lim o''zlashtirildi');

    -- ---------- 1-bosqich yakuniy imtihoni (15 savol, 30 daqiqa) ----------
    INSERT INTO exams (code, title, description, published, category_id, level, featured, owner_id, scoring_mode, template_code, navigation_mode, instructions)
    VALUES ('MATH_S1_FINAL', 'Matematika 1-bosqich: yakuniy imtihon', '15 savol, 30 daqiqa. 70%+ natija bilan 2-bosqich ochiladi.', TRUE, cat_math, 'BEGINNER', FALSE, admin_id, 'TOTAL', 'DTM_SUBJECT', 'FREE',
            'Bosqich bo''yicha barcha mavzular. Har savol 1 ball.')
    RETURNING id INTO ex_final;
    INSERT INTO sections (exam_id, title, order_index, duration_minutes, part_type, instructions, default_points)
    VALUES (ex_final, 'Yakuniy', 1, 30, 'MATH', '15 savol.', 1) RETURNING id INTO sid;
    INSERT INTO questions (section_id, order_index, type, prompt, options, answer_key, points) VALUES
    (sid, 1, 'SINGLE_CHOICE', '$256 : 8 = ?$', '[{"key":"A","text":"30"},{"key":"B","text":"32"},{"key":"C","text":"34"},{"key":"D","text":"36"}]', '{"accepted":["B"]}', 1),
    (sid, 2, 'SINGLE_CHOICE', '$15 \times 12 = ?$', '[{"key":"A","text":"170"},{"key":"B","text":"180"},{"key":"C","text":"190"},{"key":"D","text":"150"}]', '{"accepted":["B"]}', 1),
    (sid, 3, 'SINGLE_CHOICE', 'Tub son qaysi?', '[{"key":"A","text":"21"},{"key":"B","text":"27"},{"key":"C","text":"29"},{"key":"D","text":"33"}]', '{"accepted":["C"]}', 1),
    (sid, 4, 'SINGLE_CHOICE', '$\frac{2}{3} + \frac{1}{6} = ?$', '[{"key":"A","text":"$\\frac{5}{6}$"},{"key":"B","text":"$\\frac{3}{9}$"},{"key":"C","text":"$\\frac{1}{2}$"},{"key":"D","text":"$\\frac{3}{6}$"}]', '{"accepted":["A"]}', 1),
    (sid, 5, 'SINGLE_CHOICE', '$\frac{4}{5} : \frac{2}{15} = ?$', '[{"key":"A","text":"6"},{"key":"B","text":"$\\frac{8}{75}$"},{"key":"C","text":"3"},{"key":"D","text":"$\\frac{2}{3}$"}]', '{"accepted":["A"]}', 1),
    (sid, 6, 'SINGLE_CHOICE', '$0{,}75 = ?$', '[{"key":"A","text":"$\\frac{3}{4}$"},{"key":"B","text":"$\\frac{7}{5}$"},{"key":"C","text":"$\\frac{3}{5}$"},{"key":"D","text":"$\\frac{1}{4}$"}]', '{"accepted":["A"]}', 1),
    (sid, 7, 'SINGLE_CHOICE', '$2{,}5 \times 1{,}6 = ?$', '[{"key":"A","text":"4"},{"key":"B","text":"4,1"},{"key":"C","text":"3,6"},{"key":"D","text":"40"}]', '{"accepted":["A"]}', 1),
    (sid, 8, 'SINGLE_CHOICE', '60 ning 35% i:', '[{"key":"A","text":"18"},{"key":"B","text":"21"},{"key":"C","text":"24"},{"key":"D","text":"35"}]', '{"accepted":["B"]}', 1),
    (sid, 9, 'SINGLE_CHOICE', '$x - 7 = 15$ tenglamaning ildizi:', '[{"key":"A","text":"8"},{"key":"B","text":"22"},{"key":"C","text":"-8"},{"key":"D","text":"105"}]', '{"accepted":["B"]}', 1),
    (sid, 10, 'SINGLE_CHOICE', '$3x = 27$ bo''lsa, $x^2 = ?$', '[{"key":"A","text":"9"},{"key":"B","text":"18"},{"key":"C","text":"81"},{"key":"D","text":"729"}]', '{"accepted":["C"]}', 1),
    (sid, 11, 'SINGLE_CHOICE', '$5(x - 2) = 20$ tenglamaning ildizi:', '[{"key":"A","text":"2"},{"key":"B","text":"4"},{"key":"C","text":"6"},{"key":"D","text":"22"}]', '{"accepted":["C"]}', 1),
    (sid, 12, 'SINGLE_CHOICE', 'Poyezd 3 soatda 240 km yurdi. Tezligi:', '[{"key":"A","text":"60 km/soat"},{"key":"B","text":"70 km/soat"},{"key":"C","text":"80 km/soat"},{"key":"D","text":"90 km/soat"}]', '{"accepted":["C"]}', 1),
    (sid, 13, 'SINGLE_CHOICE', '$-8 + 15 - (-4) = ?$', '[{"key":"A","text":"3"},{"key":"B","text":"11"},{"key":"C","text":"-11"},{"key":"D","text":"27"}]', '{"accepted":["B"]}', 1),
    (sid, 14, 'SINGLE_CHOICE', 'To''g''ri to''rtburchakning tomonlari 6 sm va 9 sm. Yuzi:', '[{"key":"A","text":"15 sm²"},{"key":"B","text":"30 sm²"},{"key":"C","text":"54 sm²"},{"key":"D","text":"36 sm²"}]', '{"accepted":["C"]}', 1),
    (sid, 15, 'SINGLE_CHOICE', 'Ikki sonning yig''indisi 50, ayirmasi 10. Katta son:', '[{"key":"A","text":"20"},{"key":"B","text":"25"},{"key":"C","text":"30"},{"key":"D","text":"40"}]', '{"accepted":["C"]}', 1);
    INSERT INTO band_conversion (exam_id, section_id, min_raw, max_raw, scaled, label) VALUES
    (ex_final, NULL, 0, 10, 0, 'Zaif mavzularni qaytaring'), (ex_final, NULL, 11, 15, 1, '2-bosqichga o''ting');

    -- ---------- Bosqich kurslari ----------
    INSERT INTO courses (title, slug, short_description, description, level, price, published, featured, category_id, instructor_id, stage, min_placement_score, sequential, final_exam_id)
    VALUES ('Matematika: 1-bosqich - Sonlar, kasrlar va tenglamalar', 'matematika-1-bosqich',
            'Boshlang''ich bosqich: natural va butun sonlar, kasrlar, foizlar, chiziqli tenglamalar. Har mavzudan keyin test, bo''lim oxirida mock.',
            E'Bu bosqich matematikaning poydevori. Har dars: qisqa nazariya (formulalar bilan), yechilgan misollar va mavzu testi. Bo''lim oxirida DTM uslubidagi mock, bosqich oxirida yakuniy imtihon.\n\nKeyingi dars oldingi darsning testi topshirilgach ochiladi - shunda bilim bo''shliqsiz shakllanadi.',
            'BEGINNER', 0, TRUE, TRUE, cat_math, admin_id, 1, 0, TRUE, ex_final)
    RETURNING id INTO c1;
    INSERT INTO courses (title, slug, short_description, description, level, price, published, featured, category_id, instructor_id, stage, min_placement_score, sequential)
    VALUES ('Matematika: 2-bosqich - Algebra asoslari', 'matematika-2-bosqich',
            'O''rta bosqich: darajalar va ildizlar, qisqa ko''paytirish formulalari, kvadrat tenglamalar, tengsizliklar.',
            'Daraja testidan 40%+ olganlar yoki 1-bosqichni tugatganlar uchun. Algebra: darajalar, ildizlar, ko''phadlar, kvadrat tenglama va tengsizliklar.',
            'INTERMEDIATE', 0, TRUE, FALSE, cat_math, admin_id, 2, 40, TRUE)
    RETURNING id INTO c2;
    INSERT INTO courses (title, slug, short_description, description, level, price, published, featured, category_id, instructor_id, stage, min_placement_score, sequential)
    VALUES ('Matematika: 3-bosqich - Funksiyalar, trigonometriya, analiz', 'matematika-3-bosqich',
            'Yuqori bosqich: funksiyalar, logarifm, trigonometriya, progressiyalar, hosila. DTM va Milliy sertifikatga tayyorgarlik.',
            'Daraja testidan 75%+ olganlar yoki 2-bosqichni tugatganlar uchun. DTM mutaxassislik darajasidagi mavzular.',
            'ADVANCED', 0, TRUE, FALSE, cat_math, admin_id, 3, 75, TRUE)
    RETURNING id INTO c3;

    -- ---------- 1-bosqich: bo'limlar ----------
    INSERT INTO course_modules (course_id, title, description, position, exam_id) VALUES (c1, 'Sonlar va amallar', 'Natural, butun va kasr sonlar, foizlar', 1, ex_m1) RETURNING id INTO m1;
    INSERT INTO course_modules (course_id, title, description, position) VALUES (c1, 'Chiziqli tenglamalar va masalalar', 'Tenglama tushunchasi, yechish usullari, matnli masalalar', 2) RETURNING id INTO m2;

    INSERT INTO lessons (course_id, module_id, title, content, duration_minutes, position, preview) VALUES (c1, m1, 'Natural va butun sonlar. Amallar tartibi',
E'## Natural va butun sonlar\n\nNatural sonlar: $1, 2, 3, \\dots$ Butun sonlar: $\\dots, -2, -1, 0, 1, 2, \\dots$\n\n**Amallar tartibi:** avval qavs ichi, keyin daraja, keyin ko''paytirish va bo''lish (chapdan o''ngga), oxirida qo''shish va ayirish.\n\n**Misol.** $48 : 6 + 7 \\times 3 = 8 + 21 = 29$.\n\n**Manfiy sonlar bilan amallar:** $(-3) \\times (-4) = 12$, $(-3) \\times 4 = -12$, $-8 + 15 = 7$, $5 - (-4) = 9$.\n\n**Bo''linish belgilari:** 2 ga - oxirgi raqam juft; 3 ga - raqamlar yig''indisi 3 ga bo''linadi; 5 ga - oxirgi raqam 0 yoki 5; 9 ga - raqamlar yig''indisi 9 ga bo''linadi.\n\n**Tub son** - faqat 1 ga va o''ziga bo''linadigan son: $2, 3, 5, 7, 11, 13, 17, 19, 23, 29, \\dots$\n\n### Mashq\n1) $100 - 36 : 4 \\times 2 = ?$ (javob: 82)\n2) 342 soni 3 ga bo''linadimi? ($3+4+2 = 9$, ha)', 20, 1, TRUE) RETURNING id INTO l1;
    INSERT INTO lessons (course_id, module_id, title, content, duration_minutes, position, preview) VALUES (c1, m1, 'EKUB va EKUK. Oddiy kasrlar',
E'## EKUB va EKUK\n\nSonlarni tub ko''paytuvchilarga ajratamiz: $36 = 2^2 \\cdot 3^2$, $48 = 2^4 \\cdot 3$.\n\n- **EKUB** (eng katta umumiy bo''luvchi): umumiy ko''paytuvchilarning eng kichik darajalari: $2^2 \\cdot 3 = 12$.\n- **EKUK** (eng kichik umumiy karrali): barcha ko''paytuvchilarning eng katta darajalari: $2^4 \\cdot 3^2 = 144$.\n\n## Oddiy kasrlar\n\n$\\frac{a}{b}$: $a$ - surat, $b$ - maxraj. Kasrlarni qo''shish uchun umumiy maxrajga keltiramiz:\n\n$$\\frac{1}{2} + \\frac{1}{4} = \\frac{2}{4} + \\frac{1}{4} = \\frac{3}{4}$$\n\nKo''paytirish: $\\frac{a}{b} \\cdot \\frac{c}{d} = \\frac{ac}{bd}$. Bo''lish: $\\frac{a}{b} : \\frac{c}{d} = \\frac{a}{b} \\cdot \\frac{d}{c}$.\n\n**Misol.** $2\\frac{1}{3} \\cdot \\frac{3}{7} = \\frac{7}{3} \\cdot \\frac{3}{7} = 1$.', 25, 2, FALSE) RETURNING id INTO l2;
    INSERT INTO lessons (course_id, module_id, title, content, duration_minutes, position, preview) VALUES (c1, m1, 'O''nli kasrlar va foizlar',
E'## O''nli kasrlar\n\n$0{,}75 = \\frac{75}{100} = \\frac{3}{4}$. Ko''paytirishda vergulni hisoblaymiz: $1{,}2 \\times 0{,}5 = 0{,}60 = 0{,}6$. Bo''lishda bo''luvchini butun songa aylantiramiz: $3{,}6 : 0{,}4 = 36 : 4 = 9$.\n\n## Foizlar\n\n$p\\%$ - bu $\\frac{p}{100}$.\n\n- Sonning foizi: $80$ ning $15\\%$ i $= 80 \\cdot 0{,}15 = 12$.\n- Foizi bo''yicha sonni topish: $20\\%$ i $45$ bo''lsa, son $= 45 : 0{,}2 = 225$.\n- O''zgarish foizi: $\\frac{250 - 200}{200} \\cdot 100\\% = 25\\%$.\n\n**Eslab qoling:** narx $x\\%$ ga oshsa yangi narx $= $ eski $\\cdot (1 + \\frac{x}{100})$.', 25, 3, FALSE) RETURNING id INTO l3;
    INSERT INTO lessons (course_id, module_id, title, content, duration_minutes, position, preview) VALUES (c1, m2, 'Chiziqli tenglama va uni yechish',
E'## Chiziqli tenglama\n\n$ax + b = 0$ ko''rinishidagi tenglama. Yechish qoidalari: hadlarni bir tomondan ikkinchi tomonga **ishorasini o''zgartirib** o''tkazamiz, ikkala tomonni bir xil songa bo''lamiz.\n\n**Misol.** $2x + 5 = 17 \\Rightarrow 2x = 12 \\Rightarrow x = 6$.\n\n**Qavsli tenglama.** $5(x - 2) = 20 \\Rightarrow 5x - 10 = 20 \\Rightarrow 5x = 30 \\Rightarrow x = 6$.\n\n**Tekshirish:** ildizni tenglamaga qo''yamiz: $5(6-2) = 20$ ✓', 25, 4, FALSE) RETURNING id INTO l4;
    INSERT INTO lessons (course_id, module_id, title, content, duration_minutes, position, preview) VALUES (c1, m2, 'Matnli masalalarni tenglama bilan yechish',
E'## Masalani tenglamaga aylantirish\n\n1) Noma''lumni $x$ deb belgilaymiz. 2) Shart bo''yicha tenglama tuzamiz. 3) Yechamiz va javobni tekshiramiz.\n\n**Misol 1.** Ikki sonning yig''indisi 50, ayirmasi 10. Kichik son $x$ bo''lsin: $x + (x + 10) = 50 \\Rightarrow 2x = 40 \\Rightarrow x = 20$. Katta son 30.\n\n**Misol 2 (harakat).** $S = v \\cdot t$. Poyezd 3 soatda 240 km yursa, $v = 240 : 3 = 80$ km/soat.\n\n**Misol 3 (foiz).** Mahsulot narxi $x$ so''m, 20% chegirma bilan 160 000 so''m: $0{,}8x = 160\\,000 \\Rightarrow x = 200\\,000$.', 30, 5, FALSE) RETURNING id INTO l5;

    -- Dars testlari (har dars uchun 3 savol, o'tish 67%)
    INSERT INTO quizzes (course_id, lesson_id, title, description, pass_score) VALUES (c1, l1, 'Test: sonlar va amallar tartibi', '', 67) RETURNING id INTO qz;
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, '$100 - 36 : 4 \times 2 = ?$', 1) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '82', TRUE), (qq, '32', FALSE), (qq, '128', FALSE), (qq, '92', FALSE);
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, 'Qaysi son 9 ga bo''linadi?', 2) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '729', TRUE), (qq, '728', FALSE), (qq, '803', FALSE), (qq, '911', FALSE);
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, '$(-6) \times 2 - (-3) = ?$', 3) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '-9', TRUE), (qq, '-15', FALSE), (qq, '9', FALSE), (qq, '15', FALSE);

    INSERT INTO quizzes (course_id, lesson_id, title, description, pass_score) VALUES (c1, l2, 'Test: EKUB, EKUK va kasrlar', '', 67) RETURNING id INTO qz;
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, 'EKUB(24, 36) = ?', 1) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '12', TRUE), (qq, '6', FALSE), (qq, '72', FALSE), (qq, '4', FALSE);
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, '$\frac{2}{3} + \frac{1}{6} = ?$', 2) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '$\frac{5}{6}$', TRUE), (qq, '$\frac{3}{9}$', FALSE), (qq, '$\frac{1}{2}$', FALSE), (qq, '$\frac{3}{6}$', FALSE);
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, '$\frac{3}{4} : \frac{3}{8} = ?$', 3) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '2', TRUE), (qq, '$\frac{9}{32}$', FALSE), (qq, '$\frac{1}{2}$', FALSE), (qq, '$\frac{3}{2}$', FALSE);

    INSERT INTO quizzes (course_id, lesson_id, title, description, pass_score) VALUES (c1, l3, 'Test: o''nli kasrlar va foizlar', '', 67) RETURNING id INTO qz;
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, '$0{,}3 \times 0{,}2 = ?$', 1) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '0,06', TRUE), (qq, '0,6', FALSE), (qq, '6', FALSE), (qq, '0,5', FALSE);
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, '120 ning 25% i:', 2) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '30', TRUE), (qq, '25', FALSE), (qq, '40', FALSE), (qq, '48', FALSE);
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, 'Narx 50 000 dan 60 000 so''mga oshdi. Necha foizga?', 3) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '20%', TRUE), (qq, '10%', FALSE), (qq, '16%', FALSE), (qq, '60%', FALSE);

    INSERT INTO quizzes (course_id, lesson_id, title, description, pass_score) VALUES (c1, l4, 'Test: chiziqli tenglamalar', '', 67) RETURNING id INTO qz;
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, '$3x - 4 = 11$ tenglamaning ildizi:', 1) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '5', TRUE), (qq, '3', FALSE), (qq, '7', FALSE), (qq, '15', FALSE);
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, '$4(x + 1) = 28$ tenglamaning ildizi:', 2) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '6', TRUE), (qq, '7', FALSE), (qq, '8', FALSE), (qq, '27', FALSE);
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, '$\frac{x}{3} = 7$ bo''lsa, $x = ?$', 3) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '21', TRUE), (qq, '4', FALSE), (qq, '10', FALSE), (qq, '$\frac{7}{3}$', FALSE);

    INSERT INTO quizzes (course_id, lesson_id, title, description, pass_score) VALUES (c1, l5, 'Test: matnli masalalar', '', 67) RETURNING id INTO qz;
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, 'Ikki sonning yig''indisi 36, biri ikkinchisidan 3 marta katta. Kichik son:', 1) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '9', TRUE), (qq, '12', FALSE), (qq, '27', FALSE), (qq, '6', FALSE);
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, 'Avtomobil 90 km/soat tezlikda 2,5 soat yurdi. Yo''l:', 2) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '225 km', TRUE), (qq, '180 km', FALSE), (qq, '36 km', FALSE), (qq, '250 km', FALSE);
    INSERT INTO quiz_questions (quiz_id, text, position) VALUES (qz, '30% chegirma bilan tovar 70 000 so''m bo''ldi. Dastlabki narx:', 3) RETURNING id INTO qq;
    INSERT INTO quiz_options (question_id, text, correct) VALUES (qq, '100 000 so''m', TRUE), (qq, '91 000 so''m', FALSE), (qq, '210 000 so''m', FALSE), (qq, '49 000 so''m', FALSE);

    -- ---------- 2- va 3-bosqich: boshlang'ich bo'limlar (o'qituvchi to'ldiradi) ----------
    INSERT INTO course_modules (course_id, title, description, position) VALUES (c2, 'Darajalar va ildizlar', 'Daraja xossalari, arifmetik ildiz', 1) RETURNING id INTO m21;
    INSERT INTO lessons (course_id, module_id, title, content, duration_minutes, position, preview) VALUES (c2, m21, 'Natural ko''rsatkichli daraja',
E'## Daraja\n\n$a^n = \\underbrace{a \\cdot a \\cdots a}_{n}$. Xossalar: $a^m \\cdot a^n = a^{m+n}$, $\\frac{a^m}{a^n} = a^{m-n}$, $(a^m)^n = a^{mn}$, $(ab)^n = a^n b^n$.\n\n**Misol.** $3^4 = 81$, $2^3 \\cdot 2^2 = 2^5 = 32$.', 20, 1, TRUE) RETURNING id INTO l6;
    INSERT INTO lessons (course_id, module_id, title, content, duration_minutes, position, preview) VALUES (c2, m21, 'Kvadrat ildiz va uning xossalari',
E'## Arifmetik kvadrat ildiz\n\n$\\sqrt{a} = b \\iff b \\ge 0,\\; b^2 = a$. Xossalar: $\\sqrt{ab} = \\sqrt{a}\\sqrt{b}$, $\\sqrt{\\frac{a}{b}} = \\frac{\\sqrt a}{\\sqrt b}$.\n\n**Misol.** $\\sqrt{144} + \\sqrt{25} = 12 + 5 = 17$, $\\sqrt{50} = 5\\sqrt{2}$.', 20, 2, FALSE) RETURNING id INTO l7;
    INSERT INTO course_modules (course_id, title, description, position) VALUES (c3, 'Funksiyalar va logarifmlar', 'Funksiya tushunchasi, logarifm xossalari', 1) RETURNING id INTO m31;
    INSERT INTO lessons (course_id, module_id, title, content, duration_minutes, position, preview) VALUES (c3, m31, 'Logarifm va uning xossalari',
E'## Logarifm\n\n$\\log_a b = c \\iff a^c = b$ ($a > 0$, $a \\ne 1$, $b > 0$).\n\nXossalar: $\\log_a(xy) = \\log_a x + \\log_a y$, $\\log_a \\frac{x}{y} = \\log_a x - \\log_a y$, $\\log_a x^n = n \\log_a x$.\n\n**Misol.** $\\log_2 32 = 5$, chunki $2^5 = 32$.', 25, 1, TRUE) RETURNING id INTO l8;
    INSERT INTO lessons (course_id, module_id, title, content, duration_minutes, position, preview) VALUES (c3, m31, 'Hosila: ta''rif va asosiy formulalar',
E'## Hosila\n\n$f''(x) = \\lim_{\\Delta x \\to 0} \\frac{f(x + \\Delta x) - f(x)}{\\Delta x}$.\n\nJadval: $(x^n)'' = n x^{n-1}$, $(\\sin x)'' = \\cos x$, $(\\cos x)'' = -\\sin x$, $(e^x)'' = e^x$, $(\\ln x)'' = \\frac{1}{x}$.\n\n**Misol.** $f(x) = x^3 - 3x \\Rightarrow f''(x) = 3x^2 - 3$.', 30, 2, FALSE) RETURNING id INTO l9;
END $school$;

-- Fanga mas'ul o'qituvchilar: biriktirilgan fandagi barcha kurs/imtihon materiallarini boshqaradi va natijalarni nazorat qiladi.
CREATE TABLE category_teachers (
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (category_id, user_id)
);
CREATE INDEX idx_category_teachers_user ON category_teachers(user_id);
