-- Real (kompyuterda topshiriladigan) imtihon formati:
--  * exams.navigation_mode: SEQUENTIAL (IELTS: bo'limlar ketma-ket, har birining taymeri) / FREE (DTM: barcha fanlar bir vaqtda, yagona taymer)
--  * IELTS_AC_MOCK_1: Listening 4 qism / 40 savol, Reading 3 matn / 40 savol, Speaking 9 savol (savolma-savol), rasmiy 40 savollik band jadvallari
--  * DTM_MOCK_1: erkin navigatsiya, 180 daqiqa

ALTER TABLE exams ADD COLUMN navigation_mode VARCHAR(20) NOT NULL DEFAULT 'SEQUENTIAL';
UPDATE exams SET navigation_mode = 'FREE' WHERE template_code IN ('DTM', 'ATTESTATSIYA', 'DTM_SUBJECT', 'MILLIY_SUBJECT');

UPDATE exams SET
    instructions = 'Haqiqiy DTM formati: 5 fan, 90 savol, umumiy 180 daqiqa. Barcha fanlar bir vaqtda ochiq - fanlar va savollar orasida erkin yurasiz, javobni istalgan vaqt o''zgartirasiz. Har savolda 4 variant, bittasi to''g''ri; noto''g''ri javob uchun ball ayirilmaydi. Ball: majburiy fanlar 1.1, 1-mutaxassislik 3.1, 2-mutaxassislik 2.1 (maks 189). Natija topshirilishi bilan chiqadi.'
WHERE code = 'DTM_MOCK_1';

DO $$
DECLARE
    eid BIGINT;
    sid BIGINT;
    tfng JSONB := '[{"key":"TRUE","text":"True"},{"key":"FALSE","text":"False"},{"key":"NG","text":"Not Given"}]';
    ynng JSONB := '[{"key":"YES","text":"Yes"},{"key":"NO","text":"No"},{"key":"NG","text":"Not Given"}]';
    srcs JSONB := '[{"key":"A","text":"was difficult to get hold of"},{"key":"B","text":"contained some mistakes"},{"key":"C","text":"was out of date"},{"key":"D","text":"was the most useful"},{"key":"E","text":"was expensive"},{"key":"F","text":"was too detailed"}]';
    heads JSONB := '[{"key":"i","text":"The cost of light"},{"key":"ii","text":"A role alongside traditional farming"},{"key":"iii","text":"How the system works"},{"key":"iv","text":"Where the idea came from"},{"key":"v","text":"A warning about carbon emissions"},{"key":"vi","text":"Public opposition to indoor farms"},{"key":"vii","text":"Government support for new farms"},{"key":"viii","text":"Health benefits of indoor produce"}]';
    p1 TEXT;
    p2 TEXT;
    p3 TEXT;
BEGIN
    SELECT id INTO eid FROM exams WHERE code = 'IELTS_AC_MOCK_1';
    IF eid IS NULL THEN RETURN; END IF;

    -- Savollar qayta yoziladi: eski (sinov) urinishlar o'chiriladi (answers, attempt_sections kaskad)
    DELETE FROM attempts WHERE exam_id = eid;

    UPDATE exams SET
        description = 'Haqiqiy computer-delivered IELTS Academic formati: Listening (4 qism, 40 savol, ~30 daqiqa), Reading (3 matn, 40 savol, 60 daqiqa), Writing (Task 1 + Task 2, 60 daqiqa), Speaking (3 qism, 11-14 daqiqa). Natija: har ko''nikma uchun band 0-9 va umumiy band, rasmiy Test Report Form ko''rinishida.',
        instructions = 'Bo''limlar haqiqiy imtihondagi tartibda: Listening -> Reading -> Writing -> Speaking. Listening audiosi bo''lim boshlanishi bilan avtomatik ijro etiladi va faqat bir marta eshittiriladi (to''xtatib yoki qaytarib bo''lmaydi). Listening/Reading: 40 ta javob rasmiy jadval bo''yicha bandga aylantiriladi. Writing: Task 2 vazni Task 1 dan ikki barobar. Speaking: har savol ovoz bilan o''qiladi va javobingiz yoziladi. Umumiy band = 4 bo''lim o''rtachasi (.25 -> .5, .75 -> keyingi butun). Writing va Speaking AI tomonidan darhol baholanadi.'
    WHERE id = eid;

    -- =====================================================================
    -- LISTENING: 4 qism, 40 savol
    -- =====================================================================
    SELECT id INTO sid FROM sections WHERE exam_id = eid AND part_type = 'LISTENING' ORDER BY order_index LIMIT 1;
    DELETE FROM questions WHERE section_id = sid;
    DELETE FROM band_conversion WHERE section_id = sid;
    UPDATE sections SET duration_minutes = 32,
        instructions = 'Part 1 (1-10): suhbat - sport markaziga a''zo bo''lish. Part 2 (11-20): kutubxona haqida ma''ruza. Part 3 (21-30): ikki talaba va o''qituvchi - qirg''oq eroziyasi loyihasi. Part 4 (31-40): ma''ruza - shahar asalarichiligi. Audio avtomatik boshlanadi va BIR MARTA eshittiriladi. Har qism oldidan savollarni o''qish uchun vaqt beriladi. Audio tugagach javoblarni tekshirish uchun 2 daqiqa.'
    WHERE id = sid;

    INSERT INTO questions (section_id, order_index, type, prompt, passage, options, answer_key, points) VALUES
    -- Part 1: 1-10
    (sid, 1, 'GAP_FILL', E'Questions 1-10. Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.\n\nSurname: ____', E'PART 1 - Riverside Sports Centre: Membership form\nFirst name: Daniel', NULL, '{"accepted":["Hartley"]}', 1),
    (sid, 2, 'GAP_FILL', 'Date of birth: 14 ____ 1998', NULL, NULL, '{"accepted":["March"]}', 1),
    (sid, 3, 'GAP_FILL', 'Address: ____ Mill Lane', NULL, NULL, '{"accepted":["27","twenty-seven","twenty seven"]}', 1),
    (sid, 4, 'GAP_FILL', 'Phone: 0794 ____', NULL, NULL, '{"accepted":["553 812","553812"]}', 1),
    (sid, 5, 'GAP_FILL', 'Type of membership chosen: ____ (monthly cost: 32 pounds)', NULL, NULL, '{"accepted":["standard"]}', 1),
    (sid, 6, 'GAP_FILL', 'Main activity he wants to do: ____', NULL, NULL, '{"accepted":["swimming","swim"]}', 1),
    (sid, 7, 'GAP_FILL', 'Pool is closed for cleaning every ____ morning.', NULL, NULL, '{"accepted":["Tuesday"]}', 1),
    (sid, 8, 'GAP_FILL', 'Free class included with membership: ____ on Saturdays', NULL, NULL, '{"accepted":["yoga"]}', 1),
    (sid, 9, 'GAP_FILL', 'He must bring a ____ to collect his card.', NULL, NULL, '{"accepted":["passport"]}', 1),
    (sid, 10, 'GAP_FILL', 'Car park code: ____', NULL, NULL, '{"accepted":["4471"]}', 1),
    -- Part 2: 11-20
    (sid, 11, 'SINGLE_CHOICE', E'Questions 11-15. Choose the correct letter, A, B or C.\n\nThe Northgate Library building was originally', 'PART 2 - Northgate Library: welcome talk',
        '[{"key":"A","text":"a school"},{"key":"B","text":"a railway station"},{"key":"C","text":"a textile factory"}]', '{"accepted":["C"]}', 1),
    (sid, 12, 'SINGLE_CHOICE', 'The library moved into the building in', NULL,
        '[{"key":"A","text":"1987"},{"key":"B","text":"1997"},{"key":"C","text":"2007"}]', '{"accepted":["B"]}', 1),
    (sid, 13, 'SINGLE_CHOICE', 'On the ground floor, visitors can find', NULL,
        '[{"key":"A","text":"the cafe and the newspapers"},{"key":"B","text":"the children''s section"},{"key":"C","text":"the study rooms"}]', '{"accepted":["A"]}', 1),
    (sid, 14, 'SINGLE_CHOICE', 'Study rooms must be booked', NULL,
        '[{"key":"A","text":"at the front desk"},{"key":"B","text":"online"},{"key":"C","text":"by phone"}]', '{"accepted":["B"]}', 1),
    (sid, 15, 'SINGLE_CHOICE', 'The maximum number of books a member can borrow is', NULL,
        '[{"key":"A","text":"6"},{"key":"B","text":"8"},{"key":"C","text":"12"}]', '{"accepted":["C"]}', 1),
    (sid, 16, 'GAP_FILL', E'Questions 16-20. Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.\n\nMonday - ____ club for adults', 'Weekly events and practical information', NULL, '{"accepted":["chess"]}', 1),
    (sid, 17, 'GAP_FILL', 'Wednesday - story time for children under ____', NULL, NULL, '{"accepted":["five","5"]}', 1),
    (sid, 18, 'GAP_FILL', 'Friday - help with ____ and online forms', NULL, NULL, '{"accepted":["computers","computer"]}', 1),
    (sid, 19, 'GAP_FILL', 'Local history talks take place in the ____ room.', NULL, NULL, '{"accepted":["garden"]}', 1),
    (sid, 20, 'GAP_FILL', 'Printing costs ____ pence per page.', NULL, NULL, '{"accepted":["10","ten"]}', 1),
    -- Part 3: 21-30
    (sid, 21, 'SINGLE_CHOICE', E'Questions 21-26. Choose the correct letter, A, B or C.\n\nWhy did Emma and Jack choose Sandford Bay for their study?', 'PART 3 - Emma and Jack discuss their coastal erosion project with their tutor',
        '[{"key":"A","text":"It was close to the university."},{"key":"B","text":"There were many years of previous measurements."},{"key":"C","text":"Their tutor suggested it."}]', '{"accepted":["B"]}', 1),
    (sid, 22, 'SINGLE_CHOICE', 'What problem did they have on the first day?', NULL,
        '[{"key":"A","text":"The weather was too bad to take measurements."},{"key":"B","text":"Their equipment was damaged."},{"key":"C","text":"They could not find the survey markers."}]', '{"accepted":["C"]}', 1),
    (sid, 23, 'SINGLE_CHOICE', 'According to Jack, the cliff is retreating by about', NULL,
        '[{"key":"A","text":"20 centimetres a year."},{"key":"B","text":"50 centimetres a year."},{"key":"C","text":"one metre a year."}]', '{"accepted":["B"]}', 1),
    (sid, 24, 'SINGLE_CHOICE', 'Emma believes the main reason for faster erosion is', NULL,
        '[{"key":"A","text":"more powerful storms."},{"key":"B","text":"the removal of the sea wall."},{"key":"C","text":"visitors walking on the cliff path."}]', '{"accepted":["A"]}', 1),
    (sid, 25, 'SINGLE_CHOICE', 'The tutor advises the students to', NULL,
        '[{"key":"A","text":"collect more measurements."},{"key":"B","text":"compare their results with another bay."},{"key":"C","text":"interview local residents."}]', '{"accepted":["B"]}', 1),
    (sid, 26, 'SINGLE_CHOICE', 'For the presentation, the tutor suggests they should', NULL,
        '[{"key":"A","text":"use fewer slides."},{"key":"B","text":"begin with a map."},{"key":"C","text":"avoid technical terms."}]', '{"accepted":["B"]}', 1),
    (sid, 27, 'SINGLE_CHOICE', E'Questions 27-30. What do the speakers say about each of the following sources of information? Choose the correct letter, A-F. You may use any letter more than once.\n\nThe council report', 'Sources of information', srcs, '{"accepted":["D"]}', 1),
    (sid, 28, 'SINGLE_CHOICE', 'The newspaper archive', NULL, srcs, '{"accepted":["B"]}', 1),
    (sid, 29, 'SINGLE_CHOICE', 'The satellite images', NULL, srcs, '{"accepted":["E"]}', 1),
    (sid, 30, 'SINGLE_CHOICE', 'The residents'' photographs', NULL, srcs, '{"accepted":["A"]}', 1),
    -- Part 4: 31-40
    (sid, 31, 'GAP_FILL', E'Questions 31-40. Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.\n\nBackground\nHoneybees pollinate about a ____ of the crops we eat.', E'PART 4 - Lecture: Urban beekeeping', NULL, '{"accepted":["third","1/3"]}', 1),
    (sid, 32, 'GAP_FILL', 'Rural colonies have declined because of pesticides and loss of ____.', NULL, NULL, '{"accepted":["habitat","habitats"]}', 1),
    (sid, 33, 'GAP_FILL', E'Why cities suit bees\nA wide variety of flowering plants in parks and ____', NULL, NULL, '{"accepted":["gardens","garden"]}', 1),
    (sid, 34, 'GAP_FILL', 'City temperatures are usually about ____ degrees higher, so the season is longer.', NULL, NULL, '{"accepted":["2","two"]}', 1),
    (sid, 35, 'GAP_FILL', 'Fewer agricultural ____ are used in cities.', NULL, NULL, '{"accepted":["chemicals"]}', 1),
    (sid, 36, 'GAP_FILL', E'Case study: Paris\nHives have been kept on the roof of the opera house since ____.', NULL, NULL, '{"accepted":["1985"]}', 1),
    (sid, 37, 'GAP_FILL', 'Honey production per hive in the city can be ____ as high as in the countryside.', NULL, NULL, '{"accepted":["twice","2x"]}', 1),
    (sid, 38, 'GAP_FILL', E'Problems\nRisk of ____ spreading between crowded hives', NULL, NULL, '{"accepted":["disease","diseases"]}', 1),
    (sid, 39, 'GAP_FILL', 'Wild bees may be pushed out, so ____ should be planted to support all species.', NULL, NULL, '{"accepted":["wildflowers","wild flowers"]}', 1),
    (sid, 40, 'GAP_FILL', E'Advice for beginners\nJoin a local ____ before buying a hive.', NULL, NULL, '{"accepted":["association"]}', 1);

    -- Rasmiy IELTS Listening jadvali (40 savol)
    INSERT INTO band_conversion (exam_id, section_id, min_raw, max_raw, scaled) VALUES
    (eid, sid, 39, 40, 9), (eid, sid, 37, 38, 8.5), (eid, sid, 35, 36, 8), (eid, sid, 32, 34, 7.5), (eid, sid, 30, 31, 7),
    (eid, sid, 26, 29, 6.5), (eid, sid, 23, 25, 6), (eid, sid, 18, 22, 5.5), (eid, sid, 16, 17, 5), (eid, sid, 13, 15, 4.5),
    (eid, sid, 10, 12, 4), (eid, sid, 8, 9, 3.5), (eid, sid, 6, 7, 3), (eid, sid, 4, 5, 2.5), (eid, sid, 0, 3, 2);

    -- =====================================================================
    -- READING: 3 matn, 40 savol
    -- =====================================================================
    SELECT id INTO sid FROM sections WHERE exam_id = eid AND part_type = 'READING' ORDER BY order_index LIMIT 1;
    SELECT passage INTO p1 FROM questions WHERE section_id = sid AND passage LIKE 'READING PASSAGE 1%' LIMIT 1;
    SELECT passage INTO p2 FROM questions WHERE section_id = sid AND passage LIKE 'READING PASSAGE 2%' LIMIT 1;
    DELETE FROM questions WHERE section_id = sid;
    DELETE FROM band_conversion WHERE section_id = sid;
    UPDATE sections SET duration_minutes = 60,
        instructions = '3 ta matn, 40 savol, 60 daqiqa (vaqt matnlar o''rtasida taqsimlanmaydi - o''zingiz boshqarasiz). Passage 1: 1-13, Passage 2: 14-26, Passage 3: 27-40. Matn chap tomonda, savollar o''ng tomonda. Javoblarni faqat matndan oling.'
    WHERE id = sid;

    p3 := E'READING PASSAGE 3: Growing Up - the Promise of Vertical Farming\n\nA\nThe idea of growing food in tall buildings rather than open fields is older than it looks. Greenhouses stacked several storeys high were sketched by architects in the 1900s, but the modern concept was popularised in 1999 by Dickson Despommier, a professor of public health at Columbia University in New York. Set a challenge by his students to feed the population of Manhattan from rooftop gardens, Despommier calculated that rooftops alone would never be enough and proposed instead that entire towers be devoted to agriculture. His book on the subject, published a decade later, turned a classroom exercise into a global movement.\n\nB\nA typical vertical farm looks nothing like a field. Crops grow on trays stacked in racks from floor to ceiling, lit not by the sun but by rows of LED lamps tuned to the red and blue wavelengths that plants use most efficiently. The roots sit not in soil but in water enriched with nutrients, a technique known as hydroponics, or are simply misted with the solution at intervals. Because the building is sealed, insects cannot reach the plants, so no pesticides are required, and the water that is not absorbed is captured and recycled. Operators claim their farms use around ninety-five per cent less water than conventional agriculture and can harvest the same crop every few weeks regardless of the weather outside.\n\nC\nThe difficulty is money. Sunlight is free; electricity is not. Lighting and climate control account for the greater part of a vertical farm''s running costs, and these costs do not fall when the harvest is poor. As a result, the only crops that reliably pay for themselves are fast-growing leafy greens and herbs, which fetch a high price per kilogram and need little space to mature. Wheat, rice and potatoes, the staples on which the world actually depends, remain far too cheap to justify growing them under lamps. Several well-funded companies have discovered this the hard way and closed their doors.\n\nD\nThere is also an awkward question about the environment. A vertical farm powered by electricity from coal or gas may produce more carbon per lettuce than a field in a warm country, even after the lettuce has been transported hundreds of kilometres by lorry. Only where the grid is largely renewable, or where a farm installs its own solar or wind supply, does the carbon arithmetic work in its favour. Critics argue that the industry has been slow to admit this.\n\nE\nNone of this means the idea is finished. In dense cities, in deserts and on islands where farmland is scarce and fresh produce must be imported, a farm that occupies a warehouse and ignores the climate has obvious advantages. The most realistic future for vertical farming is therefore a modest one: not the replacement of conventional agriculture that its early champions promised, but a specialised supplement to it, supplying particular crops to particular places where nothing else can.';

    INSERT INTO questions (section_id, order_index, type, prompt, passage, options, answer_key, points) VALUES
    -- Passage 1: 1-13
    (sid, 1, 'TRUE_FALSE_NG', E'Questions 1-6. Do the following statements agree with the information given in Reading Passage 1? Choose TRUE if the statement agrees with the information, FALSE if it contradicts the information, NOT GIVEN if there is no information on this.\n\nRoman roads were built mainly to make trade easier.', p1, tfng, '{"accepted":["FALSE"]}', 1),
    (sid, 2, 'TRUE_FALSE_NG', 'Surveyors used a special instrument to keep roads straight.', NULL, tfng, '{"accepted":["TRUE"]}', 1),
    (sid, 3, 'TRUE_FALSE_NG', 'Roman roads were always built on flat ground.', NULL, tfng, '{"accepted":["FALSE"]}', 1),
    (sid, 4, 'TRUE_FALSE_NG', 'The curved surface of the road helped water run off.', NULL, tfng, '{"accepted":["TRUE"]}', 1),
    (sid, 5, 'TRUE_FALSE_NG', 'Milestones were painted in bright colours.', NULL, tfng, '{"accepted":["NG"]}', 1),
    (sid, 6, 'TRUE_FALSE_NG', 'Government officials had to pay to stay at road stations.', NULL, tfng, '{"accepted":["FALSE"]}', 1),
    (sid, 7, 'GAP_FILL', E'Questions 7-10. Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.\n\nThe main purpose of the roads was ____.', NULL, NULL, '{"accepted":["military"]}', 1),
    (sid, 8, 'GAP_FILL', 'Marshes were crossed using timber ____ pressed into the mud.', NULL, NULL, '{"accepted":["rafts"]}', 1),
    (sid, 9, 'GAP_FILL', 'The top layer of a road was made of fitted ____.', NULL, NULL, '{"accepted":["paving blocks","blocks"]}', 1),
    (sid, 10, 'GAP_FILL', 'In the Middle Ages, ____ and merchants still used the Roman routes.', NULL, NULL, '{"accepted":["pilgrims"]}', 1),
    (sid, 11, 'GAP_FILL', E'Questions 11-13. Answer the questions below. Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.\n\nApproximately how many kilometres of road did the network contain at its largest?', NULL, NULL, '{"accepted":["80,000","80000","80,000 kilometres","80000 kilometres","80,000 km"]}', 1),
    (sid, 12, 'GAP_FILL', 'What was mixed with the smaller stones in the middle layer of a road?', NULL, NULL, '{"accepted":["lime"]}', 1),
    (sid, 13, 'GAP_FILL', 'What did official stations provide for messengers?', NULL, NULL, '{"accepted":["fresh horses","horses"]}', 1),
    -- Passage 2: 14-26
    (sid, 14, 'SINGLE_CHOICE', E'Questions 14-18. Choose the correct letter, A, B, C or D.\n\nWhat was the main problem with early sleep research?', p2,
     '[{"key":"A","text":"Volunteers refused to take part."},{"key":"B","text":"Scientists lacked instruments to measure it."},{"key":"C","text":"Sleep cycles were too short to observe."},{"key":"D","text":"Researchers disagreed about dreaming."}]', '{"accepted":["B"]}', 1),
    (sid, 15, 'SINGLE_CHOICE', 'According to the passage, REM sleep', NULL,
     '[{"key":"A","text":"occurs only once a night."},{"key":"B","text":"is deeper than slow-wave sleep."},{"key":"C","text":"is linked to dreaming."},{"key":"D","text":"repairs body tissue."}]', '{"accepted":["C"]}', 1),
    (sid, 16, 'SINGLE_CHOICE', 'The experiment with beta-amyloid showed that', NULL,
     '[{"key":"A","text":"it causes Alzheimer''s disease directly."},{"key":"B","text":"levels rise when people do not sleep."},{"key":"C","text":"it is produced only during REM sleep."},{"key":"D","text":"it disappears after one night."}]', '{"accepted":["B"]}', 1),
    (sid, 17, 'SINGLE_CHOICE', 'What does the writer say about people who sleep less than six hours?', NULL,
     '[{"key":"A","text":"They usually know they are tired."},{"key":"B","text":"They perform better under pressure."},{"key":"C","text":"They tend to overestimate how well they function."},{"key":"D","text":"They need less sleep than average."}]', '{"accepted":["C"]}', 1),
    (sid, 18, 'SINGLE_CHOICE', 'Why are screens mentioned?', NULL,
     '[{"key":"A","text":"They are the main cause of shift work."},{"key":"B","text":"Their light resembles daylight and delays melatonin."},{"key":"C","text":"They help people fall asleep faster."},{"key":"D","text":"They are used in sleep laboratories."}]', '{"accepted":["B"]}', 1),
    (sid, 19, 'GAP_FILL', E'Questions 19-23. Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.\n\nThe brain alternates between two stages about every ninety ____.', NULL, NULL, '{"accepted":["minutes"]}', 1),
    (sid, 20, 'GAP_FILL', 'During slow-wave sleep the body releases growth ____.', NULL, NULL, '{"accepted":["hormone"]}', 1),
    (sid, 21, 'GAP_FILL', 'Students who slept after learning showed better ____ of the words.', NULL, NULL, '{"accepted":["recall","memory"]}', 1),
    (sid, 22, 'GAP_FILL', 'Most adults need between seven and ____ hours of sleep.', NULL, NULL, '{"accepted":["nine","9"]}', 1),
    (sid, 23, 'GAP_FILL', 'Researchers recommend regular hours and a ____ bedroom.', NULL, NULL, '{"accepted":["dark"]}', 1),
    (sid, 24, 'TRUE_FALSE_NG', E'Questions 24-26. Do the following statements agree with the claims of the writer in Reading Passage 2? Choose YES if the statement agrees with the claims of the writer, NO if it contradicts the claims, NOT GIVEN if it is impossible to say what the writer thinks.\n\nEarly scientists believed sleep was an active process.', NULL, ynng, '{"accepted":["NO"]}', 1),
    (sid, 25, 'TRUE_FALSE_NG', 'Shift workers are usually paid more because of the health risks.', NULL, ynng, '{"accepted":["NG"]}', 1),
    (sid, 26, 'TRUE_FALSE_NG', 'The researchers'' advice is simple but not popular.', NULL, ynng, '{"accepted":["YES"]}', 1),
    -- Passage 3: 27-40
    (sid, 27, 'SINGLE_CHOICE', E'Questions 27-31. Reading Passage 3 has five paragraphs, A-E. Choose the correct heading for each paragraph from the list of headings (i-viii).\n\nParagraph A', p3, heads, '{"accepted":["iv"]}', 1),
    (sid, 28, 'SINGLE_CHOICE', 'Paragraph B', NULL, heads, '{"accepted":["iii"]}', 1),
    (sid, 29, 'SINGLE_CHOICE', 'Paragraph C', NULL, heads, '{"accepted":["i"]}', 1),
    (sid, 30, 'SINGLE_CHOICE', 'Paragraph D', NULL, heads, '{"accepted":["v"]}', 1),
    (sid, 31, 'SINGLE_CHOICE', 'Paragraph E', NULL, heads, '{"accepted":["ii"]}', 1),
    (sid, 32, 'TRUE_FALSE_NG', E'Questions 32-36. Do the following statements agree with the claims of the writer in Reading Passage 3? Choose YES, NO or NOT GIVEN.\n\nVertical farms use far less water than conventional farms.', NULL, ynng, '{"accepted":["YES"]}', 1),
    (sid, 33, 'TRUE_FALSE_NG', 'Most vertical farms grow a wide range of crops profitably.', NULL, ynng, '{"accepted":["NO"]}', 1),
    (sid, 34, 'TRUE_FALSE_NG', 'The first commercial vertical farm was built in Asia.', NULL, ynng, '{"accepted":["NG"]}', 1),
    (sid, 35, 'TRUE_FALSE_NG', 'Lettuce from a vertical farm always has a lower carbon footprint than field-grown lettuce.', NULL, ynng, '{"accepted":["NO"]}', 1),
    (sid, 36, 'TRUE_FALSE_NG', 'Vertical farms could be valuable in places where farmland is scarce.', NULL, ynng, '{"accepted":["YES"]}', 1),
    (sid, 37, 'GAP_FILL', E'Questions 37-40. Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.\n\nInside a vertical farm, crops grow on stacked ____ under LED lamps.', NULL, NULL, '{"accepted":["trays"]}', 1),
    (sid, 38, 'GAP_FILL', 'Their roots are held in nutrient-rich ____ rather than soil.', NULL, NULL, '{"accepted":["water"]}', 1),
    (sid, 39, 'GAP_FILL', 'Because the building is sealed, growers do not need any ____.', NULL, NULL, '{"accepted":["pesticides"]}', 1),
    (sid, 40, 'GAP_FILL', 'The biggest running cost is ____.', NULL, NULL, '{"accepted":["electricity"]}', 1);

    -- Rasmiy IELTS Academic Reading jadvali (40 savol)
    INSERT INTO band_conversion (exam_id, section_id, min_raw, max_raw, scaled) VALUES
    (eid, sid, 39, 40, 9), (eid, sid, 37, 38, 8.5), (eid, sid, 35, 36, 8), (eid, sid, 33, 34, 7.5), (eid, sid, 30, 32, 7),
    (eid, sid, 27, 29, 6.5), (eid, sid, 23, 26, 6), (eid, sid, 19, 22, 5.5), (eid, sid, 15, 18, 5), (eid, sid, 13, 14, 4.5),
    (eid, sid, 10, 12, 4), (eid, sid, 8, 9, 3.5), (eid, sid, 6, 7, 3), (eid, sid, 4, 5, 2.5), (eid, sid, 0, 3, 2);

    -- =====================================================================
    -- WRITING: yo'riqnoma aniqlashtirildi (format o'zgarmaydi)
    -- =====================================================================
    UPDATE sections SET instructions = 'Ikkala vazifa ham bajarilishi shart, umumiy 60 daqiqa (vaqt vazifalar orasida bo''linmaydi; tavsiya: Task 1 - 20, Task 2 - 40 daqiqa). Task 1 kamida 150 so''z, Task 2 kamida 250 so''z; so''z soni yozuv maydoni ostida ko''rsatiladi. Baholash mezonlari: Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy (har biri 0-9). Writing band = (Task 1 + 2 x Task 2) / 3.'
    WHERE exam_id = eid AND part_type = 'WRITING';

    -- =====================================================================
    -- SPEAKING: 9 savol, savolma-savol (examiner ovozi + yozib olish)
    -- =====================================================================
    SELECT id INTO sid FROM sections WHERE exam_id = eid AND part_type = 'SPEAKING' ORDER BY order_index LIMIT 1;
    DELETE FROM questions WHERE section_id = sid;
    UPDATE sections SET duration_minutes = 15,
        instructions = 'Haqiqiy suhbat formati: har savol imtihonchi ovozi bilan o''qiladi, keyin javobingiz mikrofonga yoziladi. Part 1 (4 savol): har biriga 45 soniyagacha. Part 2: cue card - 1 daqiqa tayyorlanish (yozuv olishingiz mumkin), 2 daqiqagacha gapirish. Part 3 (4 savol): har biriga 60 soniyagacha. Javobni qayta yozib bo''lmaydi. Baholash: Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation (0-9).'
    WHERE id = sid;

    INSERT INTO questions (section_id, order_index, type, prompt, passage, options, answer_key, points, weight, prep_seconds, answer_seconds) VALUES
    (sid, 1, 'SPEAKING', 'Let''s talk about what you do. Do you work or are you a student?', 'PART 1 - Introduction and interview', NULL, '{"accepted":[]}', 9, 1, 0, 45),
    (sid, 2, 'SPEAKING', 'What do you like most about the place where you live?', NULL, NULL, '{"accepted":[]}', 9, 1, 0, 45),
    (sid, 3, 'SPEAKING', 'How often do you use public transport, and why?', NULL, NULL, '{"accepted":[]}', 9, 1, 0, 45),
    (sid, 4, 'SPEAKING', 'What kind of weather do you prefer? Why?', NULL, NULL, '{"accepted":[]}', 9, 1, 0, 45),
    (sid, 5, 'SPEAKING', E'Describe a skill you learned that has been useful in your life.\n\nYou should say:\n- what the skill is\n- how and when you learned it\n- how you use it now\n\nand explain why it has been useful to you.', 'PART 2 - Individual long turn. You have one minute to prepare; you can make notes. Then speak for one to two minutes.', NULL, '{"accepted":[]}', 9, 2, 60, 120),
    (sid, 6, 'SPEAKING', 'Which skills do you think are most important for young people today?', 'PART 3 - Two-way discussion', NULL, '{"accepted":[]}', 9, 1, 0, 60),
    (sid, 7, 'SPEAKING', 'Is it better to learn practical skills at school or at home? Why?', NULL, NULL, '{"accepted":[]}', 9, 1, 0, 60),
    (sid, 8, 'SPEAKING', 'Do you think technology makes it easier or harder to learn new skills?', NULL, NULL, '{"accepted":[]}', 9, 1, 0, 60),
    (sid, 9, 'SPEAKING', 'Should employers pay for their staff to learn new skills?', NULL, NULL, '{"accepted":[]}', 9, 1, 0, 60);
END $$;
