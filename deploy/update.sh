#!/usr/bin/env bash
# Yangi versiyani chiqarish: git pull -> build -> qayta ishga tushirish (DB migratsiyalari backend o'zi qo'llaydi).
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f >/dev/null
docker compose -f docker-compose.prod.yml ps
