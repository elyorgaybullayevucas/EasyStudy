#!/usr/bin/env bash
# EasyStudy: yangi Ubuntu 22.04/24.04 VPS ni noldan sozlash va ishga tushirish (x86 va ARM/Oracle Ampere).
# Ishlatish (root sifatida):
#   curl -fsSL https://raw.githubusercontent.com/elyorgaybullayevucas/EasyStudy/main/deploy/server-setup.sh -o setup.sh
#   bash setup.sh easystudy.uz admin@easystudy.uz
set -euo pipefail

DOMAIN="${1:?Foydalanish: bash setup.sh <domen> <email>}"
EMAIL="${2:?Foydalanish: bash setup.sh <domen> <email>}"
REPO="https://github.com/elyorgaybullayevucas/EasyStudy.git"
APP_DIR="/opt/easystudy"
if [ "$(id -u)" != "0" ]; then echo "root sifatida ishga tushiring: sudo bash setup.sh ..."; exit 1; fi

echo "==> 1/7 Tizim yangilanishi"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q && apt-get upgrade -yq
apt-get install -yq ca-certificates curl git ufw fail2ban unattended-upgrades

echo "==> 2/7 Firewall (faqat SSH, HTTP, HTTPS) va fail2ban"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable
# Oracle Cloud Ubuntu obrazlari: oldindan iptables REJECT qoidalari 80/443 ni yopadi -> ochamiz va saqlaymiz
if [ -f /etc/iptables/rules.v4 ] && grep -q "REJECT" /etc/iptables/rules.v4; then
  for p in 80 443; do iptables -C INPUT -p tcp --dport $p -j ACCEPT 2>/dev/null || iptables -I INPUT 5 -m state --state NEW -p tcp --dport $p -j ACCEPT; done
  iptables -C INPUT -p udp --dport 443 -j ACCEPT 2>/dev/null || iptables -I INPUT 5 -m state --state NEW -p udp --dport 443 -j ACCEPT
  apt-get install -yq iptables-persistent >/dev/null && netfilter-persistent save >/dev/null
  echo "    Oracle: VCN Security List'da ham 80/443 (TCP) ingress qoidasi qo'shilgan bo'lishi shart"
fi
systemctl enable --now fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> 3/7 Swap (2 GB) - 4 GB RAM li serverda build uchun kerak"
if ! swapon --show | grep -q swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> 4/7 Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

echo "==> 5/7 Kod"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

echo "==> 6/7 .env (maxfiy kalitlar avtomatik)"
if [ ! -f .env ]; then
  cp .env.prod.example .env
  sed -i "s|^DOMAIN=.*|DOMAIN=$DOMAIN|; s|^ACME_EMAIL=.*|ACME_EMAIL=$EMAIL|" .env
  sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -hex 24)|" .env
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')|" .env
  ADMIN_PW="$(openssl rand -base64 12 | tr -d '/+=' | cut -c1-14)A1!"
  sed -i "s|^DEMO_ADMIN_EMAIL=.*|DEMO_ADMIN_EMAIL=$EMAIL|; s|^DEMO_ADMIN_PASSWORD=.*|DEMO_ADMIN_PASSWORD=$ADMIN_PW|" .env
  chmod 600 .env
  echo "    Admin: $EMAIL / $ADMIN_PW  (saqlab qo'ying; kirgach profilda o'zgartiring)"
  echo "    AI uchun .env da ANTHROPIC_API_KEY ni to'ldiring (AI_PROVIDER=claude)."
fi

echo "==> 7/7 Build va ishga tushirish (birinchi marta 10-15 daqiqa)"
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps

echo "==> Zaxira nusxa: har kuni 03:00 (deploy/backup.sh)"
chmod +x deploy/backup.sh
( crontab -l 2>/dev/null | grep -v easystudy/deploy/backup.sh; echo "0 3 * * * $APP_DIR/deploy/backup.sh >> /var/log/easystudy-backup.log 2>&1" ) | crontab -

echo
echo "Tayyor: https://$DOMAIN  (sertifikat 1-2 daqiqada olinadi; DNS A yozuvi serverga ko'rsatgan bo'lishi shart)"
echo "Loglar: docker compose -f docker-compose.prod.yml logs -f backend"
