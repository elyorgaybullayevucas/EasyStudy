# ExamPrep – xalqaro sertifikatlarga tayyorlov va mock imtihon platformasi

Stek: Spring Boot 3 (Java 21) + PostgreSQL 16 + Next.js 15 (TypeScript).

## Ishga tushirish

```bash
cp .env.example .env        # JWT_SECRET ni almashtiring
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080 (Swagger: /swagger-ui.html)
- Demo admin: `.env` dagi DEMO_ADMIN_EMAIL / DEMO_ADMIN_PASSWORD bilan birinchi ishga tushishda yaratiladi (prod'da bo'sh qoldiring)
- Lokal (Docker'siz): JDK 21 + Maven, `cd backend && APP_JWT_SECRET=... mvn spring-boot:run`; `cd frontend && npm install && npm run dev`

## Lokal ishga tushirish (sinalgan konfiguratsiya)

Baza va backend Docker'da, frontend host'da Node bilan (Docker ichida `npm ci` sekin tarmoqda uzilib qoladi):

```bash
docker compose up -d db backend
```

```bash
cd frontend && npm install && npm run dev
```

- Frontend: http://localhost:3000, API: http://localhost:8080, Swagger: http://localhost:8080/swagger-ui.html
- Docker'dagi PostgreSQL host'da **5433** portda (lokal PostgreSQL 18 allaqachon 5432 ni band qilgan).
- Image'lar `mirror.gcr.io` orqali tortiladi, chunki `auth.docker.io` bu tarmoqda ochilmaydi. Qatlam yuklanishi uzilsa (`short read`), buyruqni qayta ishga tushiring.
- Bazaga ulanish: `docker exec -it examprep-db-1 psql -U examprep -d examprep`

## Holat

- Backend Docker'da kompilyatsiya qilindi va ishga tushdi: Flyway 2 ta migratsiya, Hibernate sxema tekshiruvi o'tdi.
- To'liq oqim sinaldi (API va brauzer): ro'yxatdan o'tish → imtihon → 3 javob (avtosaqlash) → topshirish → natija (band konversiyasi bilan). Javob kaliti client'ga chiqmasligi, 401/403, CSP headerlar tekshirildi.

## Xavfsizlik qarorlari

- Access JWT 15 daqiqa (Authorization header), refresh token 7 kun, HttpOnly+Secure+SameSite=Strict cookie, DB da hash holda saqlanadi va aylantiriladi (rotation).
- Parollar Argon2id.
- To'g'ri javoblar hech qachon client'ga yuborilmaydi; baholash faqat serverda.
- Urinish (attempt) muddati serverda; muddat o'tgach javob qabul qilinmaydi.
- Login uchun rate limit (Bucket4j), CORS faqat ruxsat etilgan originlar, CSP/HSTS header.
- Flyway migratsiyalar; Hibernate `ddl-auto=validate`.
- Refresh cookie SameSite=Strict bo'lgani uchun prod'da frontend va API bir "site" da bo'lishi shart (masalan app.example.uz va api.example.uz), aks holda cookie yuborilmaydi.

## API qisqacha

| Metod | Yo'l | Kim | Vazifa |
|---|---|---|---|
| POST | /api/auth/register, /login, /refresh, /logout | hamma | autentifikatsiya |
| GET | /api/auth/me | login | joriy foydalanuvchi |
| GET | /api/exams, /api/exams/{id} | hamma | nashr etilgan imtihonlar (javob kalitisiz) |
| POST | /api/attempts | STUDENT | urinish boshlash |
| PUT | /api/attempts/{id}/answers | egasi | javobni saqlash (muddat ichida) |
| POST | /api/attempts/{id}/submit | egasi | topshirish va baholash |
| GET | /api/attempts/{id}/result | egasi | natija |
| POST | /api/admin/exams, .../sections, .../questions | ADMIN, TEACHER | kontent yaratish |
| PATCH | /api/admin/exams/{id}/publish | ADMIN | nashr qilish |

## Struktura

```
backend/   Spring Boot: config, security, domain, repository, service, web, dto
frontend/  Next.js App Router: app/(auth), app/exams, app/attempts
```
