-- Platforma ichida saqlanadigan video/audio kalitlari va yo'nalish guruhlari

ALTER TABLE lessons ADD COLUMN video_key VARCHAR(255);

ALTER TABLE categories ADD COLUMN grp VARCHAR(30) NOT NULL DEFAULT 'OTHER'
    CHECK (grp IN ('SCHOOL','LOCAL_CERT','INTERNATIONAL','OTHER'));
ALTER TABLE categories ADD COLUMN position INT NOT NULL DEFAULT 100;

UPDATE categories SET grp = 'INTERNATIONAL', position = 10 WHERE slug = 'ielts';
UPDATE categories SET grp = 'INTERNATIONAL', position = 11 WHERE slug = 'sat';
UPDATE categories SET grp = 'INTERNATIONAL', position = 12 WHERE slug = 'topik';
UPDATE categories SET grp = 'SCHOOL', position = 30, icon = 'chart' WHERE slug = 'matematika';
UPDATE categories SET grp = 'OTHER', position = 90 WHERE slug = 'dasturlash';

INSERT INTO categories (name, slug, description, icon, grp, position) VALUES
('Milliy sertifikat', 'milliy-sertifikat', 'Ingliz tili, matematika, fizika va boshqa fanlardan milliy sertifikat imtihoniga tayyorlov', 'sparkles', 'LOCAL_CERT', 20),
('DTM (universitetga kirish)', 'dtm', 'Davlat test markazi testlari: majburiy va mutaxassislik fanlari', 'briefcase', 'LOCAL_CERT', 21),
('Attestatsiya', 'attestatsiya', 'O''qituvchilar va mutaxassislar attestatsiyasiga tayyorlov', 'briefcase', 'LOCAL_CERT', 22),
('Ingliz tili', 'ingliz-tili', 'Maktab dasturi: grammatika, lug''at, o''qish va tinglash', 'globe', 'SCHOOL', 31),
('Fizika', 'fizika', 'Mexanika, elektr, optika: nazariya va masalalar', 'sparkles', 'SCHOOL', 32),
('Kimyo', 'kimyo', 'Umumiy, anorganik va organik kimyo', 'sparkles', 'SCHOOL', 33),
('Biologiya', 'biologiya', 'Botanika, zoologiya, odam anatomiyasi, genetika', 'sparkles', 'SCHOOL', 34),
('Ona tili va adabiyot', 'ona-tili-adabiyot', 'Grammatika, imlo, adabiyot tahlili va insho', 'palette', 'SCHOOL', 35),
('Tarix', 'tarix', 'O''zbekiston tarixi va jahon tarixi', 'briefcase', 'SCHOOL', 36);
