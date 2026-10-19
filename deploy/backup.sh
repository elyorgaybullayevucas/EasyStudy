#!/usr/bin/env bash
# Kunlik zaxira: PostgreSQL dump + media (local provider bo'lsa). 14 kunlik nusxalar /var/backups/easystudy da.
# Tashqi saqlash uchun (tavsiya): rclone bilan Hetzner Storage Box / Backblaze B2 ga nusxalang (pastdagi izohga qarang).
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT="/var/backups/easystudy"
STAMP="$(date +%F_%H%M)"
mkdir -p "$OUT"
cd "$APP_DIR"

docker compose -f docker-compose.prod.yml exec -T db pg_dump -U easystudy -Fc easystudy > "$OUT/db_$STAMP.dump"

# Media (videolar) - hajm katta bo'lsa rclone bilan to'g'ridan-to'g'ri object storage'ga sinxronlang
docker run --rm -v easystudy_media:/data:ro -v "$OUT":/out alpine tar czf "/out/media_$STAMP.tgz" -C /data . 2>/dev/null || true

find "$OUT" -type f -mtime +14 -delete
echo "$(date -Is) backup ok: $OUT/db_$STAMP.dump"

# Tashqi nusxa (ixtiyoriy): rclone sozlangan bo'lsa
# rclone copy "$OUT" remote:easystudy-backups --max-age 2d
