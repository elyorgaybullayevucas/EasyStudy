# EasyStudy — xalqaro sertifikatlarga tayyorlov platformasi

Kurslar (video darslar, testlar, progress, sertifikat) **va** mock imtihonlar (IELTS, SAT, TOPIK formatida, taymer va band konversiyasi bilan) bir platformada. Har bir kursni alohida o'qituvchi tayyorlaydi; o'qituvchilar maqolalar ham chop etadi.

Stek: Spring Boot 3 (Java 21) + PostgreSQL 16 + Next.js 15 (TypeScript, Tailwind 4).

## Imkoniyatlar

**Yo'nalishlar** uch guruhda: maktab fanlari (matematika, fizika, kimyo, biologiya, ona tili, tarix, ingliz tili), mahalliy sertifikatlar (Milliy sertifikat, DTM, attestatsiya), xalqaro sertifikatlar (IELTS, SAT, TOPIK).

**Video va audio platformaning o'zida saqlanadi** (YouTube'ga chiqib ketish yo'q): o'qituvchi faylni yuklaydi, talabaga faqat yozilgan bo'lsa qisqa muddatli imzolangan havola beriladi, pleerda yuklab olish tugmasi yo'q, talaba emaili suv belgisi sifatida ko'rinadi. Saqlash ikki rejimli: `local` (VPS diski, Spring orqali Range-streaming) yoki `s3` (Backblaze B2 / Cloudflare R2 / MinIO), kod o'zgarmaydi.

**Talaba**
- Bosh sahifa: yo'nalishlar guruhlari, mashhur kurslar, tavsiya etilgan mock imtihonlar, o'qituvchilar maqolalari
- Kurslar katalogi (qidiruv, yo'nalish, daraja, sahifalash), kurs sahifasi, bepul tanishuv darsi, yozilish
- O'quv rejimi: video (YouTube / Vimeo / mp4), konspekt, "Darsni tugatdim", testlar, progress
- Sertifikat: kurs to'liq tugagach avtomatik, noyob kod, PDF chop etish, ochiq tekshirish sahifasi
- Mock imtihonlar: bo'limlar, 6 xil savol turi, server taymeri, avtosaqlash, avtomatik baholash, xom ball → band/shkala
- Shaxsiy kabinet: kurslarim, imtihon natijalarim (eng yaxshi natija), sertifikatlarim, profil

**O'qituvchi** (`TEACHER` roli, `/admin`)
- O'z kurslarini yaratadi: darslar, testlar; faqat o'z kurslarini ko'radi va tahrirlaydi
- Mock imtihonlar: bo'limlar, savollar (javob kaliti bilan), ball konversiyasi
- Maqolalar: o'z sohasi bo'yicha postlar (qoralama / nashr)
- Ochiq profil `/teachers/{id}`: sarlavha, bio, rasm, kurslari, maqolalari

**Administrator**: barcha kontent, yo'nalishlar (kategoriyalar), foydalanuvchi rollari, imtihonlarni nashr qilish/o'chirish.

## Ishga tushirish

```bash
cp .env.example .env        # JWT_SECRET ni almashtiring, DEMO_ADMIN_PASSWORD bering
docker compose up -d db backend
```

```bash
cd frontend && npm install && npm run dev
```

- Frontend: http://localhost:3000, API: http://localhost:8080, Swagger: http://localhost:8080/swagger-ui.html
- Docker'dagi PostgreSQL host'da **5433** portda (lokal PostgreSQL 5432 ni band qilgan bo'lsa).
- Image'lar `mirror.gcr.io` orqali tortiladi (`auth.docker.io` yopiq tarmoqlar uchun). Qatlam yuklanishi uzilsa buyruqni qayta bering.
- Frontend'ni Docker'da qurish ham mumkin (`docker compose up --build`), lekin sekin tarmoqda `npm ci` uzilib qolishi mumkin.
- Demo ma'lumotlar: 14 ta yo'nalish, IELTS Writing kursi (3 dars + test), IELTS Reading va SAT Math mock imtihonlari, 1 ta maqola. Demo admin `.env` dan.

### Media saqlash

| O'zgaruvchi | Lokal (default) | Object storage |
|---|---|---|
| `MEDIA_PROVIDER` | `local` | `s3` |
| `PUBLIC_API_URL` | `http://localhost:8080` | `https://api.domen.uz` (imzolangan havolalar shu manzildan) |
| `S3_ENDPOINT`, `S3_PUBLIC_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION` | — | provayder bergan qiymatlar |

Lokal rejimda fayllar `media` Docker volume'ida (`/data/media`). Limitlar: video 2 GB, audio 200 MB, rasm 10 MB (`APP_MEDIA_MAX_*_MB`). Havola muddati 4 soat (`APP_MEDIA_URL_TTL_MINUTES`). Prod'da Caddy/Nginx'da `client_max_body_size` ni ham 2 GB qiling.

## Xavfsizlik qarorlari

- Access JWT 15 daqiqa (xotirada, localStorage emas), refresh token 7 kun HttpOnly+SameSite=Strict cookie, DB da hash, rotation va reuse-detection.
- Parollar Argon2id; login/register/refresh uchun IP bo'yicha rate limit; CSP, HSTS, X-Frame-Options.
- Test va imtihon javob kalitlari client'ga hech qachon yuborilmaydi; baholash faqat serverda.
- Imtihon taymeri serverda; muddat o'tgach javob qabul qilinmaydi va urinish avtomatik baholanadi.
- O'qituvchi faqat o'z kurs/test/maqolalarini boshqaradi (server tomonda tekshiriladi); kategoriya va rollar faqat admin.
- Hibernate `ddl-auto=validate`, Flyway migratsiyalar, audit log.
- Prod'da frontend va API bir "site" da bo'lishi shart (masalan app.example.uz va api.example.uz), aks holda refresh cookie yuborilmaydi.

## API qisqacha

| Yo'l | Kim | Vazifa |
|---|---|---|
| `POST /api/auth/register, login, refresh, logout`, `GET /api/auth/me` | hamma / login | autentifikatsiya |
| `GET /api/categories` | hamma | yo'nalishlar (kurs va imtihon soni bilan) |
| `GET /api/courses`, `/api/courses/{slug}`, `/lessons/{id}` | hamma | katalog, kurs, dars (bepul yoki yozilgan) |
| `POST /api/courses/{slug}/enroll`, `GET .../progress` | login | yozilish, progress |
| `POST/DELETE /api/lessons/{id}/complete` | yozilgan | darsni tugatish |
| `GET /api/quizzes/{id}`, `POST .../submit` | yozilgan | kurs testi |
| `GET /api/certificates/{code}` | hamma | sertifikatni tekshirish |
| `GET /api/exams`, `/api/exams/{id}` | hamma | mock imtihonlar |
| `POST /api/attempts`, `PUT .../answers`, `POST .../submit`, `GET .../result` | login | imtihon urinishi |
| `GET /api/me`, `PATCH /api/me`, `POST /api/me/password`, `/courses`, `/dashboard`, `/certificates` | login | profil va kabinet |
| `GET /api/posts`, `/api/posts/{slug}`, `GET /api/teachers/{id}` | hamma | maqolalar, o'qituvchi profili |
| `/api/admin/courses, lessons, quizzes, exams, posts` | TEACHER (o'ziniki), ADMIN | kontent boshqaruvi |
| `POST /api/admin/media` (multipart: file, kind=VIDEO/AUDIO/IMAGE) | TEACHER, ADMIN | video/audio/rasm yuklash, saqlash kaliti qaytadi |
| `GET /api/media/{kind}/{file}?exp&sig` | imzolangan havola | lokal rejimda streaming (Range qo'llab-quvvatlanadi) |
| `/api/admin/categories (yozish), /api/admin/users` | ADMIN | yo'nalishlar, rollar |

## Struktura

```
backend/src/main/java/uz/easystudy/
  config/      xavfsizlik, properties, demo admin
  domain/      JPA entitylar (User, Course, Lesson, Quiz*, Enrollment, Certificate, Exam, Attempt, Post ...)
  repository/  Spring Data JPA
  service/     Course, Learning, Exam, Attempt, Grading, Post, Category, Profile, Admin, Auth
  web/         REST kontrollerlar
  resources/db/migration/  Flyway V1..V5
frontend/src/
  app/         Next.js App Router sahifalari (courses, learn, exams, attempts, blog, teachers, dashboard, admin ...)
  components/  layout, ui, auth, course, exam, post, dashboard, admin
  lib/         api.ts (client), types.ts, format.ts
```
