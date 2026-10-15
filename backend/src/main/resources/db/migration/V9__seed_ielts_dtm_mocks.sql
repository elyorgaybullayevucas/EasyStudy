-- Real materialli to'liq mock imtihonlar: IELTS Academic Mock 1 va DTM Mock 1.
-- Listening audio: scripts/listening/ielts-mock1.txt dan TTS bilan yaratiladi va scripts/attach_media.py bilan biriktiriladi.

DO $$
DECLARE
    admin_id BIGINT;
    cat_ielts BIGINT;
    cat_dtm BIGINT;
    eid BIGINT;
    sid BIGINT;
    tfng JSONB := '[{"key":"TRUE","text":"True"},{"key":"FALSE","text":"False"},{"key":"NG","text":"Not Given"}]';
BEGIN
    SELECT id INTO admin_id FROM users WHERE role = 'ADMIN' ORDER BY id LIMIT 1;
    SELECT id INTO cat_ielts FROM categories WHERE slug = 'ielts';
    SELECT id INTO cat_dtm FROM categories WHERE slug = 'dtm';

    -- =====================================================================
    -- IELTS ACADEMIC MOCK 1
    -- =====================================================================
    INSERT INTO exams (code, title, description, published, category_id, level, featured, owner_id, scoring_mode, template_code, instructions)
    VALUES ('IELTS_AC_MOCK_1', 'IELTS Academic - Full Mock 1',
            'To''liq format: Listening (2 qism, 20 savol), Reading (2 matn, 20 savol), Writing (Task 1 + Task 2), Speaking (3 qism). Natija: har bo''lim band, umumiy band.',
            TRUE, cat_ielts, 'INTERMEDIATE', TRUE, admin_id, 'SECTION_AVERAGE', 'IELTS_ACADEMIC',
            'Bo''limlar ketma-ket: Listening -> Reading -> Writing -> Speaking. Listening audiosi bir marta eshitiladi. Writing va Speaking javoblari AI tomonidan darhol baholanadi, o''qituvchi keyin tasdiqlaydi.')
    RETURNING id INTO eid;

    UPDATE courses SET final_exam_id = eid WHERE slug = 'ielts-writing-asoslari';

    -- ---------- LISTENING ----------
    INSERT INTO sections (exam_id, title, order_index, duration_minutes, part_type, instructions, default_points)
    VALUES (eid, 'Listening', 1, 25, 'LISTENING',
            'Part 1 (1-10): suhbat - sport markaziga a''zo bo''lish. Part 2 (11-20): kutubxona haqida ma''ruza. Har bo''sh joyga BIR SO''Z VA/YOKI RAQAM yozing. Audio bir marta eshittiriladi; avval savollarni o''qib oling.', 1)
    RETURNING id INTO sid;

    INSERT INTO questions (section_id, order_index, type, prompt, passage, options, answer_key, points) VALUES
    (sid, 1, 'GAP_FILL', 'Part 1. Riverside Sports Centre - membership form. Surname: ____', 'Questions 1-10. Complete the form. Write ONE WORD AND/OR A NUMBER for each answer.', NULL, '{"accepted":["Hartley"]}', 1),
    (sid, 2, 'GAP_FILL', 'Date of birth: 14 ____ 1998', NULL, NULL, '{"accepted":["March"]}', 1),
    (sid, 3, 'GAP_FILL', 'Address: ____ Mill Lane', NULL, NULL, '{"accepted":["27","twenty-seven","twenty seven"]}', 1),
    (sid, 4, 'GAP_FILL', 'Phone: 0794 ____', NULL, NULL, '{"accepted":["553 812","553812"]}', 1),
    (sid, 5, 'GAP_FILL', 'Type of membership chosen: ____ (monthly cost: 32 pounds)', NULL, NULL, '{"accepted":["standard"]}', 1),
    (sid, 6, 'GAP_FILL', 'Main activity he wants to do: ____', NULL, NULL, '{"accepted":["swimming","swim"]}', 1),
    (sid, 7, 'GAP_FILL', 'Pool is closed for cleaning every ____ morning.', NULL, NULL, '{"accepted":["Tuesday"]}', 1),
    (sid, 8, 'GAP_FILL', 'Free class included with membership: ____ on Saturdays', NULL, NULL, '{"accepted":["yoga"]}', 1),
    (sid, 9, 'GAP_FILL', 'He must bring a ____ to collect his card.', NULL, NULL, '{"accepted":["passport"]}', 1),
    (sid, 10, 'GAP_FILL', 'Car park code: ____', NULL, NULL, '{"accepted":["4471"]}', 1),
    (sid, 11, 'SINGLE_CHOICE', 'Part 2. The Northgate Library building was originally', 'Questions 11-15. Choose the correct letter, A, B or C.',
        '[{"key":"A","text":"a school"},{"key":"B","text":"a railway station"},{"key":"C","text":"a textile factory"}]', '{"accepted":["C"]}', 1),
    (sid, 12, 'SINGLE_CHOICE', 'The library moved into the building in', NULL,
        '[{"key":"A","text":"1987"},{"key":"B","text":"1997"},{"key":"C","text":"2007"}]', '{"accepted":["B"]}', 1),
    (sid, 13, 'SINGLE_CHOICE', 'On the ground floor, visitors can find', NULL,
        '[{"key":"A","text":"the cafe and the newspapers"},{"key":"B","text":"the children''s section"},{"key":"C","text":"the study rooms"}]', '{"accepted":["A"]}', 1),
    (sid, 14, 'SINGLE_CHOICE', 'Study rooms must be booked', NULL,
        '[{"key":"A","text":"at the front desk"},{"key":"B","text":"online"},{"key":"C","text":"by phone"}]', '{"accepted":["B"]}', 1),
    (sid, 15, 'SINGLE_CHOICE', 'The maximum number of books a member can borrow is', NULL,
        '[{"key":"A","text":"6"},{"key":"B","text":"8"},{"key":"C","text":"12"}]', '{"accepted":["C"]}', 1),
    (sid, 16, 'GAP_FILL', 'Questions 16-20. Complete the notes. Write ONE WORD for each answer. Weekly events: Monday - ____ club for adults', NULL, NULL, '{"accepted":["chess"]}', 1),
    (sid, 17, 'GAP_FILL', 'Wednesday - story time for children under ____', NULL, NULL, '{"accepted":["five","5"]}', 1),
    (sid, 18, 'GAP_FILL', 'Friday - help with ____ and online forms', NULL, NULL, '{"accepted":["computers","computer"]}', 1),
    (sid, 19, 'GAP_FILL', 'Local history talks take place in the ____ room.', NULL, NULL, '{"accepted":["garden"]}', 1),
    (sid, 20, 'GAP_FILL', 'Printing costs ____ pence per page.', NULL, NULL, '{"accepted":["10","ten"]}', 1);

    INSERT INTO band_conversion (exam_id, section_id, min_raw, max_raw, scaled) VALUES
    (eid, sid, 20, 20, 9), (eid, sid, 19, 19, 8.5), (eid, sid, 18, 18, 8), (eid, sid, 16, 17, 7.5), (eid, sid, 15, 15, 7),
    (eid, sid, 13, 14, 6.5), (eid, sid, 12, 12, 6), (eid, sid, 9, 11, 5.5), (eid, sid, 8, 8, 5), (eid, sid, 7, 7, 4.5),
    (eid, sid, 5, 6, 4), (eid, sid, 4, 4, 3.5), (eid, sid, 3, 3, 3), (eid, sid, 2, 2, 2.5), (eid, sid, 0, 1, 2);

    -- ---------- READING ----------
    INSERT INTO sections (exam_id, title, order_index, duration_minutes, part_type, instructions, default_points)
    VALUES (eid, 'Reading', 2, 40, 'READING',
            '2 ta matn, 20 savol, 40 daqiqa. Passage 1: savollar 1-10, Passage 2: savollar 11-20. Javoblarni matndan oling.', 1)
    RETURNING id INTO sid;

    INSERT INTO questions (section_id, order_index, type, prompt, passage, options, answer_key, points) VALUES
    (sid, 1, 'TRUE_FALSE_NG', 'Questions 1-6. Do the following statements agree with the information in Passage 1? 1. Roman roads were built mainly to make trade easier.',
     E'READING PASSAGE 1: The Roman Road Network\n\nAt its height, the Roman Empire was held together by a network of roads stretching more than 80,000 kilometres, from northern Britain to the deserts of Syria. The primary purpose of these roads was military: they allowed legions to move quickly to wherever trouble arose, and they carried official messengers of the imperial post. Trade followed the soldiers, but it was never the reason the roads were built.\n\nRoman engineers chose routes with remarkable care. Wherever possible, a road ran in a straight line between two points, and surveyors used an instrument called a groma, a wooden cross with hanging weights, to keep the line true. Hills were cut through or climbed with gentle zigzags, and marshes were crossed on timber rafts sunk into the mud. A road was built in layers: a trench was dug, filled with large stones, then smaller stones mixed with lime, and finally topped with tightly fitted paving blocks. The surface was slightly curved so that rainwater drained into ditches on either side. This design was so robust that some stretches remain in use today, almost two thousand years later.\n\nEvery Roman mile, roughly 1,480 metres, a stone pillar called a milestone recorded the distance to the nearest town and the name of the emperor who had ordered the work. Travellers could rest at official stations, which offered fresh horses to messengers and simple lodging to others. Private travellers paid for their stay; government officials did not.\n\nThe roads outlived the empire that built them. In medieval Europe, pilgrims and merchants continued to follow Roman routes because nothing better existed, and many modern highways still trace the same lines. The straight road, it turns out, was not only the shortest path for a marching army but also the most lasting gift Rome left to the continent.',
     tfng, '{"accepted":["FALSE"]}', 1),
    (sid, 2, 'TRUE_FALSE_NG', '2. Surveyors used a special instrument to keep roads straight.', NULL, tfng, '{"accepted":["TRUE"]}', 1),
    (sid, 3, 'TRUE_FALSE_NG', '3. Roman roads were always built on flat ground.', NULL, tfng, '{"accepted":["FALSE"]}', 1),
    (sid, 4, 'TRUE_FALSE_NG', '4. The curved surface of the road helped water run off.', NULL, tfng, '{"accepted":["TRUE"]}', 1),
    (sid, 5, 'TRUE_FALSE_NG', '5. Milestones were painted in bright colours.', NULL, tfng, '{"accepted":["NG"]}', 1),
    (sid, 6, 'TRUE_FALSE_NG', '6. Government officials had to pay to stay at road stations.', NULL, tfng, '{"accepted":["FALSE"]}', 1),
    (sid, 7, 'GAP_FILL', 'Questions 7-10. Complete the sentences with NO MORE THAN TWO WORDS from the passage. 7. The main purpose of the roads was ____.', NULL, NULL, '{"accepted":["military"]}', 1),
    (sid, 8, 'GAP_FILL', '8. Marshes were crossed using timber ____ pressed into the mud.', NULL, NULL, '{"accepted":["rafts"]}', 1),
    (sid, 9, 'GAP_FILL', '9. The top layer of a road was made of fitted ____.', NULL, NULL, '{"accepted":["paving blocks","blocks"]}', 1),
    (sid, 10, 'GAP_FILL', '10. In the Middle Ages, ____ and merchants still used the Roman routes.', NULL, NULL, '{"accepted":["pilgrims"]}', 1),
    (sid, 11, 'SINGLE_CHOICE', 'Questions 11-15. Choose the correct letter, A, B, C or D. 11. What was the main problem with early sleep research?',
     E'READING PASSAGE 2: Why We Sleep\n\nFor most of history, sleep was treated as a simple absence: a time when the body switched off and nothing of importance happened. Early scientists had few tools to study it, so they relied on observation alone, and observation suggested a passive state. That picture began to change in the 1950s, when researchers attached electrodes to the scalps of sleeping volunteers and discovered that the brain is far from quiet at night. It cycles, roughly every ninety minutes, between deep slow-wave sleep and a lighter stage in which the eyes dart rapidly behind closed lids. This second stage, named REM sleep, is when most vivid dreaming occurs.\n\nThe two stages appear to do different jobs. Slow-wave sleep is the period when the body repairs tissue, releases growth hormone and clears waste chemicals from the brain. One of these chemicals, beta-amyloid, builds up during waking hours and has been linked to Alzheimer''s disease; experiments in which people were kept awake showed higher levels of it the next morning. REM sleep, by contrast, seems to be concerned with memory and emotion. Students who learned a list of words and then slept recalled significantly more than those who stayed awake, and the benefit was greatest for people who spent longer in REM.\n\nHow much sleep is enough? The honest answer is that it varies, but large population studies point to seven to nine hours for most adults. People who regularly sleep less than six hours show measurable declines in attention and are more likely to develop heart disease and diabetes. Worryingly, the short sleepers in these studies usually believed they were coping well. The brain, it seems, is a poor judge of its own tiredness.\n\nModern life pushes against our biology. Artificial light delays the release of melatonin, the hormone that signals night to the body, and screens are a particular culprit because they emit blue wavelengths similar to daylight. Shift workers, whose schedules ignore the day-night cycle altogether, have some of the highest rates of sleep-related illness. The solution is not complicated, researchers say, but it is unfashionable: regular hours, a dark bedroom and the willingness to treat sleep as a priority rather than an afterthought.',
     '[{"key":"A","text":"Volunteers refused to take part."},{"key":"B","text":"Scientists lacked instruments to measure it."},{"key":"C","text":"Sleep cycles were too short to observe."},{"key":"D","text":"Researchers disagreed about dreaming."}]', '{"accepted":["B"]}', 1),
    (sid, 12, 'SINGLE_CHOICE', '12. According to the passage, REM sleep', NULL,
     '[{"key":"A","text":"occurs only once a night."},{"key":"B","text":"is deeper than slow-wave sleep."},{"key":"C","text":"is linked to dreaming."},{"key":"D","text":"repairs body tissue."}]', '{"accepted":["C"]}', 1),
    (sid, 13, 'SINGLE_CHOICE', '13. The experiment with beta-amyloid showed that', NULL,
     '[{"key":"A","text":"it causes Alzheimer''s disease directly."},{"key":"B","text":"levels rise when people do not sleep."},{"key":"C","text":"it is produced only during REM sleep."},{"key":"D","text":"it disappears after one night."}]', '{"accepted":["B"]}', 1),
    (sid, 14, 'SINGLE_CHOICE', '14. What does the writer say about people who sleep less than six hours?', NULL,
     '[{"key":"A","text":"They usually know they are tired."},{"key":"B","text":"They perform better under pressure."},{"key":"C","text":"They tend to overestimate how well they function."},{"key":"D","text":"They need less sleep than average."}]', '{"accepted":["C"]}', 1),
    (sid, 15, 'SINGLE_CHOICE', '15. Why are screens mentioned?', NULL,
     '[{"key":"A","text":"They are the main cause of shift work."},{"key":"B","text":"Their light resembles daylight and delays melatonin."},{"key":"C","text":"They help people fall asleep faster."},{"key":"D","text":"They are used in sleep laboratories."}]', '{"accepted":["B"]}', 1),
    (sid, 16, 'GAP_FILL', 'Questions 16-20. Complete the summary with ONE WORD from the passage. The brain alternates between two stages about every ninety ____.', NULL, NULL, '{"accepted":["minutes"]}', 1),
    (sid, 17, 'GAP_FILL', 'During slow-wave sleep the body releases growth ____.', NULL, NULL, '{"accepted":["hormone"]}', 1),
    (sid, 18, 'GAP_FILL', 'Students who slept after learning showed better ____ of the words.', NULL, NULL, '{"accepted":["recall","memory"]}', 1),
    (sid, 19, 'GAP_FILL', 'Most adults need between seven and ____ hours of sleep.', NULL, NULL, '{"accepted":["nine","9"]}', 1),
    (sid, 20, 'GAP_FILL', 'Researchers recommend regular hours and a ____ bedroom.', NULL, NULL, '{"accepted":["dark"]}', 1);

    INSERT INTO band_conversion (exam_id, section_id, min_raw, max_raw, scaled) VALUES
    (eid, sid, 20, 20, 9), (eid, sid, 19, 19, 8.5), (eid, sid, 18, 18, 8), (eid, sid, 17, 17, 7.5), (eid, sid, 15, 16, 7),
    (eid, sid, 14, 14, 6.5), (eid, sid, 12, 13, 6), (eid, sid, 10, 11, 5.5), (eid, sid, 8, 9, 5), (eid, sid, 7, 7, 4.5),
    (eid, sid, 5, 6, 4), (eid, sid, 4, 4, 3.5), (eid, sid, 3, 3, 3), (eid, sid, 2, 2, 2.5), (eid, sid, 0, 1, 2);

    -- ---------- WRITING ----------
    INSERT INTO sections (exam_id, title, order_index, duration_minutes, part_type, instructions, default_points)
    VALUES (eid, 'Writing', 3, 60, 'WRITING',
            'Task 1: kamida 150 so''z, 20 daqiqa tavsiya etiladi. Task 2: kamida 250 so''z, 40 daqiqa. Ikkala vazifa ham baholanadi; Task 2 vazni ikki barobar.', 9)
    RETURNING id INTO sid;

    INSERT INTO questions (section_id, order_index, type, prompt, passage, options, answer_key, points, weight, min_words) VALUES
    (sid, 1, 'ESSAY', E'Task 1. The table below shows the percentage of households in a European country that owned certain electronic devices in 2005, 2015 and 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
     E'Device              2005    2015    2023\nDesktop computer    58%     41%     22%\nLaptop              23%     64%     71%\nSmartphone           4%     68%     94%\nTablet               0%     45%     52%\nSmart TV             0%     19%     66%',
     NULL, '{"accepted":[]}', 9, 1, 150),
    (sid, 2, 'ESSAY', E'Task 2. Some people believe that children should learn a foreign language from the first year of primary school, while others think it is better to start at secondary school.\n\nDiscuss both views and give your own opinion. Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.',
     NULL, NULL, '{"accepted":[]}', 9, 2, 250);

    -- ---------- SPEAKING ----------
    INSERT INTO sections (exam_id, title, order_index, duration_minutes, part_type, instructions, default_points)
    VALUES (eid, 'Speaking', 4, 15, 'SPEAKING',
            'Part 1: qisqa shaxsiy savollar (javob 20-40 soniya har biriga; hammasiga ketma-ket javob bering). Part 2: cue card - 1 daqiqa tayyorlanish, 1-2 daqiqa gapirish. Part 3: muhokama. Mikrofon ruxsatini bering; har qism bir marta yoziladi.', 9)
    RETURNING id INTO sid;

    INSERT INTO questions (section_id, order_index, type, prompt, passage, options, answer_key, points, weight, prep_seconds, answer_seconds) VALUES
    (sid, 1, 'SPEAKING', E'Part 1. Answer these questions one after another:\n1) Do you work or are you a student?\n2) What do you like most about the place where you live?\n3) How often do you use public transport, and why?\n4) What kind of weather do you prefer?',
     NULL, NULL, '{"accepted":[]}', 9, 1, 10, 240),
    (sid, 2, 'SPEAKING', E'Part 2. Describe a skill you learned that has been useful in your life.\n\nYou should say:\n- what the skill is\n- how and when you learned it\n- how you use it now\n\nand explain why it has been useful to you.\n\nYou have one minute to prepare. Speak for one to two minutes.',
     NULL, NULL, '{"accepted":[]}', 9, 1, 60, 120),
    (sid, 3, 'SPEAKING', E'Part 3. Discussion questions (answer each in 2-4 sentences):\n1) Which skills do you think are most important for young people today?\n2) Is it better to learn practical skills at school or at home? Why?\n3) Do you think technology makes it easier or harder to learn new skills?\n4) Should employers pay for their staff to learn new skills?',
     NULL, NULL, '{"accepted":[]}', 9, 1, 10, 300);

    -- =====================================================================
    -- DTM MOCK 1
    -- =====================================================================
    INSERT INTO exams (code, title, description, published, category_id, level, featured, owner_id, scoring_mode, template_code, instructions)
    VALUES ('DTM_MOCK_1', 'DTM - To''liq mock 1 (Matematika / Fizika yo''nalishi)',
            'Majburiy fanlar: Ona tili, Matematika, O''zbekiston tarixi (10 tadan, 1.1 ball). 1-mutaxassislik: Matematika (30 ta, 3.1 ball). 2-mutaxassislik: Fizika (30 ta, 2.1 ball). Maks 189 ball.',
            TRUE, cat_dtm, 'INTERMEDIATE', TRUE, admin_id, 'TOTAL', 'DTM',
            'Har savolda 4 variant, bittasi to''g''ri. Noto''g''ri javob uchun ball ayirilmaydi. Bo''limlar ketma-ket; umumiy ball = to''g''ri javoblar x fan koeffitsienti.')
    RETURNING id INTO eid;

    -- ---------- ONA TILI (1.1) ----------
    INSERT INTO sections (exam_id, title, order_index, duration_minutes, part_type, instructions, default_points)
    VALUES (eid, 'Ona tili (majburiy)', 1, 20, 'GENERAL', '10 savol, har biri 1.1 ball.', 1.1) RETURNING id INTO sid;
    INSERT INTO questions (section_id, order_index, type, prompt, options, answer_key, points) VALUES
    (sid, 1, 'SINGLE_CHOICE', 'Qaysi qatorda so''z yasovchi qo''shimcha ishtirok etgan?', '[{"key":"A","text":"kitoblar"},{"key":"B","text":"ishchi"},{"key":"C","text":"uyda"},{"key":"D","text":"keldim"}]', '{"accepted":["B"]}', 1.1),
    (sid, 2, 'SINGLE_CHOICE', 'Qaysi qatorda juft so''z berilgan?', '[{"key":"A","text":"ota-ona"},{"key":"B","text":"kitob-daftar emas, kitob va daftar"},{"key":"C","text":"qip-qizil"},{"key":"D","text":"katta-katta"}]', '{"accepted":["A"]}', 1.1),
    (sid, 3, 'SINGLE_CHOICE', '"Bahor keldi, daraxtlar gulladi." gapi qanday gap?', '[{"key":"A","text":"sodda yig''iq gap"},{"key":"B","text":"bog''langan qo''shma gap"},{"key":"C","text":"ergashgan qo''shma gap"},{"key":"D","text":"sodda yoyiq gap"}]', '{"accepted":["B"]}', 1.1),
    (sid, 4, 'SINGLE_CHOICE', 'Qaysi qatorda imlo xatosi bor?', '[{"key":"A","text":"ma''lumot"},{"key":"B","text":"san''at"},{"key":"C","text":"mas''uliyat"},{"key":"D","text":"ta''lim"}]', '{"accepted":["B"]}', 1.1),
    (sid, 5, 'SINGLE_CHOICE', '"Oftob" so''zining sinonimi qaysi?', '[{"key":"A","text":"oy"},{"key":"B","text":"quyosh"},{"key":"C","text":"yulduz"},{"key":"D","text":"nur"}]', '{"accepted":["B"]}', 1.1),
    (sid, 6, 'SINGLE_CHOICE', 'Qaysi so''z turkumi harakat-holatni bildiradi?', '[{"key":"A","text":"ot"},{"key":"B","text":"sifat"},{"key":"C","text":"fe''l"},{"key":"D","text":"son"}]', '{"accepted":["C"]}', 1.1),
    (sid, 7, 'SINGLE_CHOICE', '"Men kitobni ukamga berdim." gapida "ukamga" so''zi qaysi kelishikda?', '[{"key":"A","text":"tushum"},{"key":"B","text":"jo''nalish"},{"key":"C","text":"o''rin-payt"},{"key":"D","text":"chiqish"}]', '{"accepted":["B"]}', 1.1),
    (sid, 8, 'SINGLE_CHOICE', '"Alisher Navoiy" asari emas qaysi?', '[{"key":"A","text":"Xamsa"},{"key":"B","text":"Lison ut-tayr"},{"key":"C","text":"Boburnoma"},{"key":"D","text":"Mahbub ul-qulub"}]', '{"accepted":["C"]}', 1.1),
    (sid, 9, 'SINGLE_CHOICE', 'Qaysi qatorda undosh tovushlar jarangli?', '[{"key":"A","text":"p, t, k"},{"key":"B","text":"b, d, g"},{"key":"C","text":"s, sh, x"},{"key":"D","text":"f, ch, q"}]', '{"accepted":["B"]}', 1.1),
    (sid, 10, 'SINGLE_CHOICE', '"Sabr tagi - sariq oltin" - bu qanday janr?', '[{"key":"A","text":"topishmoq"},{"key":"B","text":"maqol"},{"key":"C","text":"ertak"},{"key":"D","text":"doston"}]', '{"accepted":["B"]}', 1.1);

    -- ---------- MATEMATIKA majburiy (1.1) ----------
    INSERT INTO sections (exam_id, title, order_index, duration_minutes, part_type, instructions, default_points)
    VALUES (eid, 'Matematika (majburiy)', 2, 25, 'MATH', '10 savol, har biri 1.1 ball. Kalkulyator ishlatilmaydi.', 1.1) RETURNING id INTO sid;
    INSERT INTO questions (section_id, order_index, type, prompt, options, answer_key, points) VALUES
    (sid, 1, 'SINGLE_CHOICE', '3x - 7 = 11 tenglamaning ildizi:', '[{"key":"A","text":"4"},{"key":"B","text":"6"},{"key":"C","text":"-6"},{"key":"D","text":"18"}]', '{"accepted":["B"]}', 1.1),
    (sid, 2, 'SINGLE_CHOICE', '15% dan 240 ni toping.', '[{"key":"A","text":"24"},{"key":"B","text":"30"},{"key":"C","text":"36"},{"key":"D","text":"40"}]', '{"accepted":["C"]}', 1.1),
    (sid, 3, 'SINGLE_CHOICE', 'Tomonlari 6 va 8 bo''lgan to''g''ri to''rtburchak diagonali:', '[{"key":"A","text":"10"},{"key":"B","text":"12"},{"key":"C","text":"14"},{"key":"D","text":"7"}]', '{"accepted":["A"]}', 1.1),
    (sid, 4, 'SINGLE_CHOICE', '2^5 + 2^3 ning qiymati:', '[{"key":"A","text":"16"},{"key":"B","text":"32"},{"key":"C","text":"40"},{"key":"D","text":"64"}]', '{"accepted":["C"]}', 1.1),
    (sid, 5, 'SINGLE_CHOICE', '12, 18 va 30 sonlarining EKUBi:', '[{"key":"A","text":"3"},{"key":"B","text":"6"},{"key":"C","text":"12"},{"key":"D","text":"180"}]', '{"accepted":["B"]}', 1.1),
    (sid, 6, 'SINGLE_CHOICE', 'Arifmetik progressiyada a1 = 5, d = 3. a10 ni toping.', '[{"key":"A","text":"32"},{"key":"B","text":"35"},{"key":"C","text":"30"},{"key":"D","text":"38"}]', '{"accepted":["A"]}', 1.1),
    (sid, 7, 'SINGLE_CHOICE', 'x^2 - 5x + 6 = 0 tenglama ildizlari yig''indisi:', '[{"key":"A","text":"-5"},{"key":"B","text":"6"},{"key":"C","text":"5"},{"key":"D","text":"1"}]', '{"accepted":["C"]}', 1.1),
    (sid, 8, 'SINGLE_CHOICE', 'Radiusi 3 bo''lgan doira yuzi:', '[{"key":"A","text":"6π"},{"key":"B","text":"9π"},{"key":"C","text":"3π"},{"key":"D","text":"12π"}]', '{"accepted":["B"]}', 1.1),
    (sid, 9, 'SINGLE_CHOICE', '0.25 kasrni oddiy kasr ko''rinishida yozing.', '[{"key":"A","text":"1/5"},{"key":"B","text":"1/4"},{"key":"C","text":"2/5"},{"key":"D","text":"1/25"}]', '{"accepted":["B"]}', 1.1),
    (sid, 10, 'SINGLE_CHOICE', 'Uchburchakning ikki burchagi 50° va 60°. Uchinchi burchak:', '[{"key":"A","text":"60°"},{"key":"B","text":"80°"},{"key":"C","text":"70°"},{"key":"D","text":"110°"}]', '{"accepted":["C"]}', 1.1);

    -- ---------- TARIX (1.1) ----------
    INSERT INTO sections (exam_id, title, order_index, duration_minutes, part_type, instructions, default_points)
    VALUES (eid, 'O''zbekiston tarixi (majburiy)', 3, 15, 'GENERAL', '10 savol, har biri 1.1 ball.', 1.1) RETURNING id INTO sid;
    INSERT INTO questions (section_id, order_index, type, prompt, options, answer_key, points) VALUES
    (sid, 1, 'SINGLE_CHOICE', 'O''zbekiston Respublikasi mustaqilligi qachon e''lon qilingan?', '[{"key":"A","text":"1990-yil 20-iyun"},{"key":"B","text":"1991-yil 31-avgust"},{"key":"C","text":"1992-yil 8-dekabr"},{"key":"D","text":"1991-yil 1-sentabr"}]', '{"accepted":["B"]}', 1.1),
    (sid, 2, 'SINGLE_CHOICE', 'O''zbekiston Respublikasi Konstitutsiyasi qachon qabul qilingan?', '[{"key":"A","text":"1991-yil 31-avgust"},{"key":"B","text":"1992-yil 8-dekabr"},{"key":"C","text":"1993-yil 1-sentabr"},{"key":"D","text":"1994-yil 1-iyul"}]', '{"accepted":["B"]}', 1.1),
    (sid, 3, 'SINGLE_CHOICE', 'Amir Temur davlatining poytaxti qaysi shahar edi?', '[{"key":"A","text":"Buxoro"},{"key":"B","text":"Hirot"},{"key":"C","text":"Samarqand"},{"key":"D","text":"Toshkent"}]', '{"accepted":["C"]}', 1.1),
    (sid, 4, 'SINGLE_CHOICE', 'Mirzo Ulug''bek nima bilan mashhur?', '[{"key":"A","text":"rasadxona va astronomik jadvallar"},{"key":"B","text":"Boburnoma asari"},{"key":"C","text":"Tibbiyot qonunlari kitobi"},{"key":"D","text":"Algebra asoschisi"}]', '{"accepted":["A"]}', 1.1),
    (sid, 5, 'SINGLE_CHOICE', '"Al-jabr" asarining muallifi kim?', '[{"key":"A","text":"Abu Rayhon Beruniy"},{"key":"B","text":"Ibn Sino"},{"key":"C","text":"Al-Xorazmiy"},{"key":"D","text":"Al-Farg''oniy"}]', '{"accepted":["C"]}', 1.1),
    (sid, 6, 'SINGLE_CHOICE', 'Boburiylar davlatiga asos solgan hukmdor:', '[{"key":"A","text":"Shohrux"},{"key":"B","text":"Zahiriddin Muhammad Bobur"},{"key":"C","text":"Husayn Boyqaro"},{"key":"D","text":"Shayboniyxon"}]', '{"accepted":["B"]}', 1.1),
    (sid, 7, 'SINGLE_CHOICE', 'Buyuk ipak yo''li asosan nimani bog''lagan?', '[{"key":"A","text":"Afrika va Amerikani"},{"key":"B","text":"Xitoy va O''rta yer dengizi mamlakatlarini"},{"key":"C","text":"Hindiston va Avstraliyani"},{"key":"D","text":"Rossiya va Yaponiyani"}]', '{"accepted":["B"]}', 1.1),
    (sid, 8, 'SINGLE_CHOICE', 'O''zbekiston Respublikasi davlat tili to''g''risidagi qonun qachon qabul qilingan?', '[{"key":"A","text":"1989-yil 21-oktabr"},{"key":"B","text":"1991-yil 31-avgust"},{"key":"C","text":"1992-yil 8-dekabr"},{"key":"D","text":"1995-yil 21-dekabr"}]', '{"accepted":["A"]}', 1.1),
    (sid, 9, 'SINGLE_CHOICE', 'Jadidchilik harakatining asosiy maqsadi nima edi?', '[{"key":"A","text":"harbiy islohot"},{"key":"B","text":"ta''lim va madaniyatni yangilash"},{"key":"C","text":"savdoni kengaytirish"},{"key":"D","text":"diniy nizolarni kuchaytirish"}]', '{"accepted":["B"]}', 1.1),
    (sid, 10, 'SINGLE_CHOICE', 'O''zbekistonning milliy valyutasi so''m qachon muomalaga kiritilgan?', '[{"key":"A","text":"1991-yil"},{"key":"B","text":"1992-yil"},{"key":"C","text":"1994-yil"},{"key":"D","text":"1996-yil"}]', '{"accepted":["C"]}', 1.1);

    -- ---------- MATEMATIKA 1-mutaxassislik (3.1) ----------
    INSERT INTO sections (exam_id, title, order_index, duration_minutes, part_type, instructions, default_points)
    VALUES (eid, 'Matematika (1-mutaxassislik)', 4, 60, 'MATH', '30 savol, har biri 3.1 ball.', 3.1) RETURNING id INTO sid;
    INSERT INTO questions (section_id, order_index, type, prompt, options, answer_key, points) VALUES
    (sid, 1, 'SINGLE_CHOICE', '(x + 3)^2 ifodani yoying.', '[{"key":"A","text":"x^2 + 9"},{"key":"B","text":"x^2 + 6x + 9"},{"key":"C","text":"x^2 + 3x + 9"},{"key":"D","text":"x^2 + 6x + 6"}]', '{"accepted":["B"]}', 3.1),
    (sid, 2, 'SINGLE_CHOICE', 'log2 32 ning qiymati:', '[{"key":"A","text":"4"},{"key":"B","text":"5"},{"key":"C","text":"16"},{"key":"D","text":"6"}]', '{"accepted":["B"]}', 3.1),
    (sid, 3, 'SINGLE_CHOICE', 'sin 30° + cos 60° ning qiymati:', '[{"key":"A","text":"1"},{"key":"B","text":"√3"},{"key":"C","text":"1/2"},{"key":"D","text":"√3/2"}]', '{"accepted":["A"]}', 3.1),
    (sid, 4, 'SINGLE_CHOICE', 'f(x) = x^3 - 3x funksiyaning hosilasi:', '[{"key":"A","text":"3x^2 - 3"},{"key":"B","text":"x^2 - 3"},{"key":"C","text":"3x^2"},{"key":"D","text":"3x - 3"}]', '{"accepted":["A"]}', 3.1),
    (sid, 5, 'SINGLE_CHOICE', '2x + y = 7 va x - y = 2 sistemaning yechimi (x; y):', '[{"key":"A","text":"(3; 1)"},{"key":"B","text":"(1; 3)"},{"key":"C","text":"(2; 3)"},{"key":"D","text":"(3; -1)"}]', '{"accepted":["A"]}', 3.1),
    (sid, 6, 'SINGLE_CHOICE', 'Geometrik progressiya: b1 = 2, q = 3. b5 ni toping.', '[{"key":"A","text":"54"},{"key":"B","text":"162"},{"key":"C","text":"486"},{"key":"D","text":"81"}]', '{"accepted":["B"]}', 3.1),
    (sid, 7, 'SINGLE_CHOICE', '|x - 4| = 3 tenglamaning ildizlari:', '[{"key":"A","text":"1 va 7"},{"key":"B","text":"-1 va 7"},{"key":"C","text":"1 va -7"},{"key":"D","text":"faqat 7"}]', '{"accepted":["A"]}', 3.1),
    (sid, 8, 'SINGLE_CHOICE', '√50 + √18 ni soddalashtiring.', '[{"key":"A","text":"√68"},{"key":"B","text":"8√2"},{"key":"C","text":"2√17"},{"key":"D","text":"6√2"}]', '{"accepted":["B"]}', 3.1),
    (sid, 9, 'SINGLE_CHOICE', 'x^2 - 9 > 0 tengsizlikning yechimi:', '[{"key":"A","text":"(-3; 3)"},{"key":"B","text":"(-∞; -3) ∪ (3; +∞)"},{"key":"C","text":"(3; +∞)"},{"key":"D","text":"[-3; 3]"}]', '{"accepted":["B"]}', 3.1),
    (sid, 10, 'SINGLE_CHOICE', 'Kub qirrasi 4 ga teng. Uning hajmi:', '[{"key":"A","text":"16"},{"key":"B","text":"48"},{"key":"C","text":"64"},{"key":"D","text":"96"}]', '{"accepted":["C"]}', 3.1),
    (sid, 11, 'SINGLE_CHOICE', '5! / 3! ning qiymati:', '[{"key":"A","text":"2"},{"key":"B","text":"10"},{"key":"C","text":"20"},{"key":"D","text":"60"}]', '{"accepted":["C"]}', 3.1),
    (sid, 12, 'SINGLE_CHOICE', 'y = 2x + 1 to''g''ri chiziq Oy o''qini qaysi nuqtada kesadi?', '[{"key":"A","text":"(0; 1)"},{"key":"B","text":"(1; 0)"},{"key":"C","text":"(0; 2)"},{"key":"D","text":"(-1/2; 0)"}]', '{"accepted":["A"]}', 3.1),
    (sid, 13, 'SINGLE_CHOICE', '3^x = 81 tenglamaning ildizi:', '[{"key":"A","text":"3"},{"key":"B","text":"4"},{"key":"C","text":"27"},{"key":"D","text":"9"}]', '{"accepted":["B"]}', 3.1),
    (sid, 14, 'SINGLE_CHOICE', 'Teng yonli uchburchakning asosi 10, yon tomoni 13. Balandligi:', '[{"key":"A","text":"12"},{"key":"B","text":"8"},{"key":"C","text":"5"},{"key":"D","text":"11"}]', '{"accepted":["A"]}', 3.1),
    (sid, 15, 'SINGLE_CHOICE', 'Tangalarni 3 marta tashlaganda hammasi gerb tushish ehtimoli:', '[{"key":"A","text":"1/2"},{"key":"B","text":"1/4"},{"key":"C","text":"1/8"},{"key":"D","text":"1/3"}]', '{"accepted":["C"]}', 3.1),
    (sid, 16, 'SINGLE_CHOICE', '(2 + i)(2 - i) kompleks sonlar ko''paytmasi:', '[{"key":"A","text":"3"},{"key":"B","text":"4"},{"key":"C","text":"5"},{"key":"D","text":"4 - i^2"}]', '{"accepted":["C"]}', 3.1),
    (sid, 17, 'SINGLE_CHOICE', 'x^2 + y^2 = 25 aylananing radiusi:', '[{"key":"A","text":"25"},{"key":"B","text":"5"},{"key":"C","text":"12.5"},{"key":"D","text":"√5"}]', '{"accepted":["B"]}', 3.1),
    (sid, 18, 'SINGLE_CHOICE', '∫ 2x dx ning qiymati:', '[{"key":"A","text":"x^2 + C"},{"key":"B","text":"2x^2 + C"},{"key":"C","text":"x + C"},{"key":"D","text":"2 + C"}]', '{"accepted":["A"]}', 3.1),
    (sid, 19, 'SINGLE_CHOICE', '1 + 2 + 3 + ... + 100 yig''indi:', '[{"key":"A","text":"5000"},{"key":"B","text":"5050"},{"key":"C","text":"10100"},{"key":"D","text":"4950"}]', '{"accepted":["B"]}', 3.1),
    (sid, 20, 'SINGLE_CHOICE', 'tg 45° · ctg 45° ning qiymati:', '[{"key":"A","text":"0"},{"key":"B","text":"1"},{"key":"C","text":"2"},{"key":"D","text":"√2"}]', '{"accepted":["B"]}', 3.1),
    (sid, 21, 'SINGLE_CHOICE', 'Agar f(x) = 2x - 3 bo''lsa, f(f(2)) ni toping.', '[{"key":"A","text":"1"},{"key":"B","text":"-1"},{"key":"C","text":"3"},{"key":"D","text":"5"}]', '{"accepted":["B"]}', 3.1),
    (sid, 22, 'SINGLE_CHOICE', 'Sonlar: 4, 7, 7, 9, 13. Medianasi:', '[{"key":"A","text":"7"},{"key":"B","text":"8"},{"key":"C","text":"9"},{"key":"D","text":"4"}]', '{"accepted":["A"]}', 3.1),
    (sid, 23, 'SINGLE_CHOICE', 'Trapetsiya asoslari 6 va 10, balandligi 4. Yuzi:', '[{"key":"A","text":"24"},{"key":"B","text":"32"},{"key":"C","text":"40"},{"key":"D","text":"64"}]', '{"accepted":["B"]}', 3.1),
    (sid, 24, 'SINGLE_CHOICE', '(a^3 · a^4) / a^5 ni soddalashtiring.', '[{"key":"A","text":"a^2"},{"key":"B","text":"a^12"},{"key":"C","text":"a^7"},{"key":"D","text":"a"}]', '{"accepted":["A"]}', 3.1),
    (sid, 25, 'SINGLE_CHOICE', 'Tenglamani yeching: 2^(x+1) = 16.', '[{"key":"A","text":"2"},{"key":"B","text":"3"},{"key":"C","text":"4"},{"key":"D","text":"5"}]', '{"accepted":["B"]}', 3.1),
    (sid, 26, 'SINGLE_CHOICE', 'Vektorlar a = (1; 2), b = (3; -1). a · b skalyar ko''paytma:', '[{"key":"A","text":"1"},{"key":"B","text":"5"},{"key":"C","text":"-1"},{"key":"D","text":"7"}]', '{"accepted":["A"]}', 3.1),
    (sid, 27, 'SINGLE_CHOICE', 'Muntazam oltiburchakning ichki burchagi:', '[{"key":"A","text":"60°"},{"key":"B","text":"90°"},{"key":"C","text":"120°"},{"key":"D","text":"135°"}]', '{"accepted":["C"]}', 3.1),
    (sid, 28, 'SINGLE_CHOICE', 'y = x^2 - 4x + 7 parabolaning uchi:', '[{"key":"A","text":"(2; 3)"},{"key":"B","text":"(-2; 3)"},{"key":"C","text":"(2; 7)"},{"key":"D","text":"(4; 7)"}]', '{"accepted":["A"]}', 3.1),
    (sid, 29, 'SINGLE_CHOICE', 'lim (x→∞) (3x + 1)/(x - 2) ning qiymati:', '[{"key":"A","text":"0"},{"key":"B","text":"1"},{"key":"C","text":"3"},{"key":"D","text":"∞"}]', '{"accepted":["C"]}', 3.1),
    (sid, 30, 'SINGLE_CHOICE', '5 ta kitobni javonga necha xil usulda terish mumkin?', '[{"key":"A","text":"25"},{"key":"B","text":"60"},{"key":"C","text":"120"},{"key":"D","text":"5"}]', '{"accepted":["C"]}', 3.1);

    -- ---------- FIZIKA 2-mutaxassislik (2.1) ----------
    INSERT INTO sections (exam_id, title, order_index, duration_minutes, part_type, instructions, default_points)
    VALUES (eid, 'Fizika (2-mutaxassislik)', 5, 60, 'GENERAL', '30 savol, har biri 2.1 ball. g = 10 m/s^2 deb oling.', 2.1) RETURNING id INTO sid;
    INSERT INTO questions (section_id, order_index, type, prompt, options, answer_key, points) VALUES
    (sid, 1, 'SINGLE_CHOICE', 'Jism 20 m/s tezlik bilan tekis harakatlanmoqda. 5 s da bosib o''tgan yo''li:', '[{"key":"A","text":"4 m"},{"key":"B","text":"25 m"},{"key":"C","text":"100 m"},{"key":"D","text":"50 m"}]', '{"accepted":["C"]}', 2.1),
    (sid, 2, 'SINGLE_CHOICE', 'Massasi 2 kg jismga 10 N kuch ta''sir qilmoqda. Tezlanishi:', '[{"key":"A","text":"20 m/s^2"},{"key":"B","text":"5 m/s^2"},{"key":"C","text":"0.2 m/s^2"},{"key":"D","text":"12 m/s^2"}]', '{"accepted":["B"]}', 2.1),
    (sid, 3, 'SINGLE_CHOICE', 'Massasi 3 kg jismning 10 m balandlikdagi potensial energiyasi:', '[{"key":"A","text":"30 J"},{"key":"B","text":"300 J"},{"key":"C","text":"3000 J"},{"key":"D","text":"3 J"}]', '{"accepted":["B"]}', 2.1),
    (sid, 4, 'SINGLE_CHOICE', 'Qarshiligi 5 Ω bo''lgan o''tkazgichga 10 V kuchlanish berildi. Tok kuchi:', '[{"key":"A","text":"50 A"},{"key":"B","text":"0.5 A"},{"key":"C","text":"2 A"},{"key":"D","text":"15 A"}]', '{"accepted":["C"]}', 2.1),
    (sid, 5, 'SINGLE_CHOICE', 'Tovush vakuumda:', '[{"key":"A","text":"havodagidan tez tarqaladi"},{"key":"B","text":"tarqalmaydi"},{"key":"C","text":"yorug''lik tezligida tarqaladi"},{"key":"D","text":"sekin tarqaladi"}]', '{"accepted":["B"]}', 2.1),
    (sid, 6, 'SINGLE_CHOICE', 'Jism erkin tushmoqda. 3 s dan keyingi tezligi:', '[{"key":"A","text":"3 m/s"},{"key":"B","text":"10 m/s"},{"key":"C","text":"30 m/s"},{"key":"D","text":"45 m/s"}]', '{"accepted":["C"]}', 2.1),
    (sid, 7, 'SINGLE_CHOICE', 'Suvning zichligi 1000 kg/m^3. Hajmi 0.5 m^3 suvning massasi:', '[{"key":"A","text":"500 kg"},{"key":"B","text":"2000 kg"},{"key":"C","text":"50 kg"},{"key":"D","text":"5 kg"}]', '{"accepted":["A"]}', 2.1),
    (sid, 8, 'SINGLE_CHOICE', 'Qaysi kattalik vektor?', '[{"key":"A","text":"massa"},{"key":"B","text":"vaqt"},{"key":"C","text":"kuch"},{"key":"D","text":"temperatura"}]', '{"accepted":["C"]}', 2.1),
    (sid, 9, 'SINGLE_CHOICE', 'Kuch ta''sirida jism 4 m ga ko''chdi; bajarilgan ish 80 J. Kuch:', '[{"key":"A","text":"320 N"},{"key":"B","text":"20 N"},{"key":"C","text":"76 N"},{"key":"D","text":"84 N"}]', '{"accepted":["B"]}', 2.1),
    (sid, 10, 'SINGLE_CHOICE', 'Quvvat 1 kW bo''lgan asbob 2 soatda qancha energiya sarflaydi?', '[{"key":"A","text":"2 kJ"},{"key":"B","text":"2 kWh"},{"key":"C","text":"0.5 kWh"},{"key":"D","text":"120 J"}]', '{"accepted":["B"]}', 2.1),
    (sid, 11, 'SINGLE_CHOICE', 'Ikki qarshilik 3 Ω va 6 Ω ketma-ket ulangan. Umumiy qarshilik:', '[{"key":"A","text":"2 Ω"},{"key":"B","text":"9 Ω"},{"key":"C","text":"18 Ω"},{"key":"D","text":"4.5 Ω"}]', '{"accepted":["B"]}', 2.1),
    (sid, 12, 'SINGLE_CHOICE', 'Ikki qarshilik 3 Ω va 6 Ω parallel ulangan. Umumiy qarshilik:', '[{"key":"A","text":"2 Ω"},{"key":"B","text":"9 Ω"},{"key":"C","text":"18 Ω"},{"key":"D","text":"4.5 Ω"}]', '{"accepted":["A"]}', 2.1),
    (sid, 13, 'SINGLE_CHOICE', 'Massasi 1 kg jism 2 m/s tezlik bilan harakatlanmoqda. Kinetik energiyasi:', '[{"key":"A","text":"1 J"},{"key":"B","text":"2 J"},{"key":"C","text":"4 J"},{"key":"D","text":"0.5 J"}]', '{"accepted":["B"]}', 2.1),
    (sid, 14, 'SINGLE_CHOICE', 'Yorug''likning vakuumdagi tezligi taxminan:', '[{"key":"A","text":"3·10^5 km/s"},{"key":"B","text":"3·10^8 km/s"},{"key":"C","text":"340 m/s"},{"key":"D","text":"3·10^6 m/s"}]', '{"accepted":["A"]}', 2.1),
    (sid, 15, 'SINGLE_CHOICE', 'Temperatura 27 °C Kelvinda:', '[{"key":"A","text":"27 K"},{"key":"B","text":"246 K"},{"key":"C","text":"300 K"},{"key":"D","text":"327 K"}]', '{"accepted":["C"]}', 2.1),
    (sid, 16, 'SINGLE_CHOICE', 'Prujina bikrligi 200 N/m, 0.1 m ga cho''zildi. Elastiklik kuchi:', '[{"key":"A","text":"2 N"},{"key":"B","text":"20 N"},{"key":"C","text":"2000 N"},{"key":"D","text":"0.5 N"}]', '{"accepted":["B"]}', 2.1),
    (sid, 17, 'SINGLE_CHOICE', 'Suyuqlik ichidagi bosim chuqurlik ortishi bilan:', '[{"key":"A","text":"kamayadi"},{"key":"B","text":"o''zgarmaydi"},{"key":"C","text":"ortadi"},{"key":"D","text":"nolga teng bo''ladi"}]', '{"accepted":["C"]}', 2.1),
    (sid, 18, 'SINGLE_CHOICE', 'Matematik mayatnik tebranish davri nimaga bog''liq?', '[{"key":"A","text":"yuk massasiga"},{"key":"B","text":"ip uzunligiga"},{"key":"C","text":"tebranish amplitudasiga"},{"key":"D","text":"ip rangiga"}]', '{"accepted":["B"]}', 2.1),
    (sid, 19, 'SINGLE_CHOICE', 'Chastotasi 50 Hz bo''lgan tebranishning davri:', '[{"key":"A","text":"50 s"},{"key":"B","text":"0.02 s"},{"key":"C","text":"0.5 s"},{"key":"D","text":"2 s"}]', '{"accepted":["B"]}', 2.1),
    (sid, 20, 'SINGLE_CHOICE', 'Zaryadi 2 C bo''lgan zarra 5 V potensiallar farqini o''tdi. Bajarilgan ish:', '[{"key":"A","text":"2.5 J"},{"key":"B","text":"10 J"},{"key":"C","text":"7 J"},{"key":"D","text":"0.4 J"}]', '{"accepted":["B"]}', 2.1),
    (sid, 21, 'SINGLE_CHOICE', 'Linza fokus masofasi 0.5 m. Optik kuchi:', '[{"key":"A","text":"0.5 D"},{"key":"B","text":"1 D"},{"key":"C","text":"2 D"},{"key":"D","text":"5 D"}]', '{"accepted":["C"]}', 2.1),
    (sid, 22, 'SINGLE_CHOICE', 'Nyutonning uchinchi qonuni:', '[{"key":"A","text":"F = ma"},{"key":"B","text":"ta''sir va aks ta''sir kuchlari teng va qarama-qarshi"},{"key":"C","text":"inersiya qonuni"},{"key":"D","text":"energiyaning saqlanishi"}]', '{"accepted":["B"]}', 2.1),
    (sid, 23, 'SINGLE_CHOICE', 'Jism 2 m/s^2 tezlanish bilan tinch holatdan harakat boshladi. 4 s da bosib o''tgan yo''li:', '[{"key":"A","text":"8 m"},{"key":"B","text":"16 m"},{"key":"C","text":"32 m"},{"key":"D","text":"4 m"}]', '{"accepted":["B"]}', 2.1),
    (sid, 24, 'SINGLE_CHOICE', 'Muzning suyuqlanish temperaturasi (normal bosimda):', '[{"key":"A","text":"-10 °C"},{"key":"B","text":"0 °C"},{"key":"C","text":"4 °C"},{"key":"D","text":"100 °C"}]', '{"accepted":["B"]}', 2.1),
    (sid, 25, 'SINGLE_CHOICE', 'Foydali ish koeffitsienti 40% bo''lgan dvigatel 1000 J issiqlik oldi. Foydali ish:', '[{"key":"A","text":"400 J"},{"key":"B","text":"600 J"},{"key":"C","text":"2500 J"},{"key":"D","text":"40 J"}]', '{"accepted":["A"]}', 2.1),
    (sid, 26, 'SINGLE_CHOICE', 'Qaysi zarracha manfiy zaryadga ega?', '[{"key":"A","text":"proton"},{"key":"B","text":"neytron"},{"key":"C","text":"elektron"},{"key":"D","text":"foton"}]', '{"accepted":["C"]}', 2.1),
    (sid, 27, 'SINGLE_CHOICE', 'Suvning solishtirma issiqlik sig''imi 4200 J/(kg·°C). 1 kg suvni 10 °C ga isitish uchun kerak issiqlik:', '[{"key":"A","text":"420 J"},{"key":"B","text":"4200 J"},{"key":"C","text":"42000 J"},{"key":"D","text":"42 J"}]', '{"accepted":["C"]}', 2.1),
    (sid, 28, 'SINGLE_CHOICE', 'Tok kuchi 2 A, qarshilik 10 Ω. Quvvat:', '[{"key":"A","text":"20 W"},{"key":"B","text":"40 W"},{"key":"C","text":"5 W"},{"key":"D","text":"12 W"}]', '{"accepted":["B"]}', 2.1),
    (sid, 29, 'SINGLE_CHOICE', 'Yorug''lik zich muhitdan siyrak muhitga o''tganda:', '[{"key":"A","text":"normalga yaqinlashadi"},{"key":"B","text":"normaldan uzoqlashadi"},{"key":"C","text":"yo''nalishi o''zgarmaydi"},{"key":"D","text":"to''xtaydi"}]', '{"accepted":["B"]}', 2.1),
    (sid, 30, 'SINGLE_CHOICE', 'Massasi 50 kg bo''lgan odam Yer yuzida qanday og''irlik kuchi bilan tortiladi?', '[{"key":"A","text":"5 N"},{"key":"B","text":"50 N"},{"key":"C","text":"500 N"},{"key":"D","text":"5000 N"}]', '{"accepted":["C"]}', 2.1);

    INSERT INTO band_conversion (exam_id, section_id, min_raw, max_raw, scaled, label) VALUES
    (eid, NULL, 0, 56, 0, 'Past: tayyorgarlikni kuchaytiring'),
    (eid, NULL, 57, 112, 1, 'O''rta: kontrakt uchun raqobatbardosh'),
    (eid, NULL, 113, 150, 2, 'Yaxshi: grant uchun raqobatbardosh'),
    (eid, NULL, 151, 189, 3, 'A''lo: yuqori ehtimol bilan grant');
END $$;
