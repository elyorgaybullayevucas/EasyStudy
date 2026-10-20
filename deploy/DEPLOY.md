# EasyStudy — online serverga joylash

Arxitektura: bitta VPS → Docker Compose (PostgreSQL + Spring backend + Next.js frontend) → Caddy (avtomatik HTTPS, Let's Encrypt). Tashqariga faqat 80/443 ochiq, DB va backend ichki tarmoqda. Frontend va API bitta domenda (`/api/*` → backend), shuning uchun refresh-cookie `SameSite=Strict; Secure` holida ishlaydi.

## 1. Server tanlash

| Variant | Narx (oyiga) | Resurs | Kimga |
|---|---|---|---|
| **Hetzner Cloud CX22** (Germaniya/Finlyandiya) — tavsiya | ≈ €4.5 (IPv4 bilan) | 2 vCPU, 4 GB, 40 GB NVMe, 20 TB trafik | Boshlash uchun eng maqul: arzon, ishonchli, 1 klikda kengayadi (CX32: 4 vCPU/8 GB ≈ €7.5) |
| Hetzner CX32 | ≈ €8 | 4 vCPU, 8 GB, 80 GB | 500+ faol talaba, ko'p video |
| DigitalOcean / Vultr (Frankfurt, Singapur) | $24 | 2 vCPU, 4 GB, 80 GB | Karta to'lovi Hetznerda o'tmasa |
| Mahalliy (ahost.uz, UZINFOCOM bulut) | 300–600 ming so'm | 2–4 vCPU, 4–8 GB | O'zbekiston ichida past ping va ma'lumotlar mamlakat ichida bo'lishi talab qilinsa |

Tavsiya: **Hetzner CX22, Ubuntu 24.04, Falkenstein yoki Helsinki**. Video hajmi 30 GB dan oshganda media uchun **Hetzner Object Storage** (S3, ≈ €5/TB) yoki Backblaze B2 ni `MEDIA_PROVIDER=s3` bilan ulaysiz — kod tayyor, server almashtirilmaydi.

Hetznerda: Cloud Console → New project → Add server → Location (Falkenstein) → Image Ubuntu 24.04 → Type Shared CX22 → SSH key qo'shing (parol bilan kirmang) → Create. IPv4 ni ro'yxatdan o'tkazing.

## 1a. Tekin variantlar (test davri uchun)

**Oracle Cloud Always Free (tavsiya).** ARM Ampere A1: 4 OCPU, 24 GB RAM, 200 GB disk, 10 TB trafik — muddatsiz bepul. Qadamlar:

1. cloud.oracle.com → Sign up (karta tekshiruv uchun, pul yechilmaydi). Home region: Frankfurt / Amsterdam.
2. Compute → Instances → Create: Image **Ubuntu 24.04 (aarch64)**, Shape **VM.Standard.A1.Flex** → 4 OCPU, 24 GB ("Always Free" belgisi). "Out of capacity" chiqsa 2 OCPU/12 GB qiling yoki keyinroq urinib ko'ring. SSH public key qo'shing (`deploy` kaliti).
3. Networking → VCN → Subnet → **Security List** → Ingress Rules: `0.0.0.0/0` TCP 80, TCP 443, UDP 443 qo'shing (bu bo'lmasa sayt ochilmaydi).
4. `ssh ubuntu@IP`, so'ng `sudo -i` va 3-bo'limdagi buyruq. Skript Oracle'ning ichki iptables qoidalarini o'zi ochadi.
5. Domen bo'lmasa vaqtincha bepul DNS: DuckDNS (`easystudy.duckdns.org`) yoki Cloudflare'da arzon domen — Caddy sertifikatni oladi.

Eslatma: 3 oy ishlatilmagan Always Free server o'chirilishi mumkin; kunlik zaxira (`backup.sh`) shuning uchun ham muhim.

**Cloudflare Tunnel (serversiz, kompyuteringizdan).** Lokal ishlab turgan platformaga internetdan HTTPS havola:

```bash
# Windows: winget install Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:3000
```

Chiqadigan `https://....trycloudflare.com` havolasini ulashasiz. `frontend` ni `NEXT_PUBLIC_API_URL` shu havolaga qaratib qayta ishga tushirish kerak bo'ladi (yoki Caddy bilan prod compose'ni lokalda ko'tarib, 80-portni tunnelga berasiz). Cheklov: bitta yuklash 100 MB, kompyuter yoniq turishi shart. Faqat qisqa demo uchun.

**Vaqtinchalik kreditlar:** Google Cloud $300 (90 kun), DigitalOcean $200 (60 kun), Azure $200 (30 kun), GitHub Student Pack (talabalar). Muddat tugagach pullik — test uchun Oracle qulayroq.

## 2. Domen

DNS'da ikki A yozuv: `easystudy.uz → SERVER_IP` va `www → SERVER_IP` (TTL 300). Domen tarqalguncha (5–30 daqiqa) skriptni ishga tushirmang — Caddy sertifikatni DNS orqali oladi.

## 3. O'rnatish (bitta buyruq)

Serverga `ssh root@SERVER_IP` bilan kiring:

```bash
curl -fsSL https://raw.githubusercontent.com/elyorgaybullayevucas/EasyStudy/main/deploy/server-setup.sh -o setup.sh && bash setup.sh easystudy.uz admin@easystudy.uz
```

Skript: tizimni yangilaydi, firewall (22/80/443) + fail2ban + avtomatik xavfsizlik yangilanishlari, 2 GB swap, Docker, repo `/opt/easystudy` ga, `.env` ga tasodifiy DB paroli / JWT siri / admin paroli, build (10–15 daqiqa), kunlik zaxira (03:00). Oxirida **admin login/parolni ko'rsatadi — saqlab qo'ying.**

Keyin AI kalitini qo'shing:

```bash
nano /opt/easystudy/.env      # ANTHROPIC_API_KEY=sk-ant-...  (AI_PROVIDER=claude allaqachon)
cd /opt/easystudy && docker compose -f docker-compose.prod.yml up -d backend
```

Speaking'ni ham AI tekshirsin desangiz: `TRANSCRIPTION_PROVIDER=openai` + `OPENAI_API_KEY`.

## 4. Birinchi kirish

`https://easystudy.uz` → admin bilan kiring → **Profil** → parolni o'zgartiring → `.env` dagi `DEMO_ADMIN_PASSWORD=` ni bo'sh qiling. Admin panel → Imtihonlar: IELTS/DTM mock'lar seed bilan keladi; Listening audiosini biriktiring:

```bash
# lokal kompyuterdan (audio fayl 50 MB):
python scripts/attach_media.py --api https://easystudy.uz --email admin@easystudy.uz --password '...' --exam-code IELTS_AC_MOCK_1 --section Listening --file scripts/listening/ielts-mock1.wav
```

## 5. Kundalik ishlar

| Nima | Buyruq (`cd /opt/easystudy`) |
|---|---|
| Yangi versiya chiqarish | `bash deploy/update.sh` |
| Holat | `docker compose -f docker-compose.prod.yml ps` |
| Loglar | `docker compose -f docker-compose.prod.yml logs -f backend` (yoki `frontend`, `caddy`) |
| Zaxira (qo'lda) | `bash deploy/backup.sh` → `/var/backups/easystudy` |
| Tiklash | `docker compose -f docker-compose.prod.yml exec -T db pg_restore -U easystudy -d easystudy --clean < /var/backups/easystudy/db_XXXX.dump` |
| Disk | `df -h` va `docker system df` |

Zaxiralar server diskida; serverdan tashqariga ham nusxalang: Hetzner Storage Box (€3.5/oy, 1 TB) yoki B2 — `rclone` o'rnatib `backup.sh` oxiridagi qatorni yoqing.

## 6. Kengayish yo'li

1. 4 GB yetmay qolsa → Hetzner konsolida **Rescale** (CX32, 1 daqiqa to'xtash).
2. Video 30 GB+ → `MEDIA_PROVIDER=s3` (Object Storage), eski fayllar `rclone` bilan ko'chiriladi.
3. 2–3 ming faol foydalanuvchi → DB ni alohida serverga (Hetzner managed yoki ikkinchi VPS), backend 2 nusxa, Caddy load-balancer.
4. Monitoring: Hetzner grafiklar + `docker compose logs`; xohlasangiz Uptime Kuma (bepul) alohida konteynerda.

## 7. Xavfsizlik ro'yxati (skript bajargan)

- SSH faqat kalit bilan (Hetznerda SSH key tanlang); `ufw` — faqat 22/80/443; `fail2ban`.
- HTTPS majburiy, HSTS, HTTP/3; cookie `Secure`; CORS faqat o'z domeni.
- DB porti tashqariga ochilmagan; `.env` 600 ruxsat, git'da yo'q.
- Avtomatik xavfsizlik yangilanishlari (`unattended-upgrades`); konteynerlar `restart: unless-stopped`, loglar aylanadi.
