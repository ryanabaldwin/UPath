#!/bin/bash
# Bootstrap Let's Encrypt SSL certificate for upath.tannernielson.com
# Run ONCE on the server before starting the full stack.
# Requires: docker, docker compose, curl

set -e

DOMAIN="upath.tannernielson.com"
EMAIL="your-email@example.com"   # <-- CHANGE THIS to your real email
RSA_KEY_SIZE=4096
DATA_PATH="./nginx/certbot"
STAGING=0   # Set to 1 to use Let's Encrypt staging (for testing, avoids rate limits)

# ── Confirm before replacing existing certs ──────────────────────────────────
if [ -d "$DATA_PATH/conf/live/$DOMAIN" ]; then
  read -p "Certificate already exists for $DOMAIN. Replace it? (y/N) " decision
  if [[ "$decision" != "y" && "$decision" != "Y" ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# ── Download recommended TLS parameters (once) ───────────────────────────────
if [ ! -e "$DATA_PATH/conf/options-ssl-nginx.conf" ] || [ ! -e "$DATA_PATH/conf/ssl-dhparams.pem" ]; then
  echo "Downloading recommended TLS parameters..."
  mkdir -p "$DATA_PATH/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o "$DATA_PATH/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
    -o "$DATA_PATH/conf/ssl-dhparams.pem"
fi

# ── Create dummy self-signed cert so nginx can start ─────────────────────────
echo "Creating temporary self-signed certificate..."
mkdir -p "$DATA_PATH/conf/live/$DOMAIN"
docker compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -subj '/CN=localhost'" certbot

# ── Start nginx with dummy cert ───────────────────────────────────────────────
echo "Starting nginx..."
docker compose up --force-recreate -d nginx

# ── Delete dummy cert, get real cert ─────────────────────────────────────────
echo "Removing dummy certificate..."
docker compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$DOMAIN && \
  rm -Rf /etc/letsencrypt/archive/$DOMAIN && \
  rm -Rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

echo "Requesting Let's Encrypt certificate for $DOMAIN..."

STAGING_ARG=""
if [ "$STAGING" != "0" ]; then STAGING_ARG="--staging"; fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    -d $DOMAIN \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos \
    --force-renewal" certbot

echo "Reloading nginx with real certificate..."
docker compose exec nginx nginx -s reload

echo "Done! SSL certificate issued for $DOMAIN."
