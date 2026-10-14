-- O'qituvchi profili va maqolalar (blog) moduli

ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN headline VARCHAR(160);

CREATE TABLE posts (
    id          BIGSERIAL PRIMARY KEY,
    author_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    title       VARCHAR(200) NOT NULL,
    slug        VARCHAR(220) NOT NULL UNIQUE,
    excerpt     VARCHAR(400) NOT NULL,
    content     TEXT NOT NULL DEFAULT '',
    cover_url   VARCHAR(500),
    published   BOOLEAN NOT NULL DEFAULT FALSE,
    views       BIGINT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_published ON posts(published, created_at DESC);

-- Demo o'qituvchi (parol: DemoDataInitializer orqali emas; hisobni admin paneldan rol berib yaratish mumkin)
-- Demo maqola admin nomidan
INSERT INTO posts (author_id, category_id, title, slug, excerpt, content, published)
SELECT u.id, c.id,
       'IELTS Writing Task 2: eng ko''p uchraydigan 5 xato',
       'ielts-writing-task-2-5-xato',
       'Band 6 dan 7 ga o''tishga to''sqinlik qiladigan xatolar va ularni tuzatish yo''llari.',
       '1. Savolga to''liq javob bermaslik (Task Response). Savolda ikkita tomon so''ralsa, ikkalasini ham yoriting.

2. Umumiy gaplar. "Many people think..." o''rniga aniq misol va sabab keltiring.

3. Bog''lovchi so''zlarni ortiqcha ishlatish. Har jumlada "Moreover, Furthermore" shart emas.

4. Grammatik xilma-xillik yo''qligi. Murakkab gaplar, shart mayli va passiv konstruksiyalarni aralashtiring.

5. Xulosa yozmaslik. 250 so''zga yetmasangiz ham, qisqa xulosa majburiy.',
       TRUE
FROM users u, categories c WHERE u.role = 'ADMIN' AND c.slug = 'ielts' LIMIT 1;
