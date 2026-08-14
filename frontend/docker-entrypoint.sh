#!/bin/sh
set -e

REAL_CERT_DIR="/etc/letsencrypt/live/arena180.com.br"
LOCAL_CERT_DIR="/etc/nginx/certs"

mkdir -p "$LOCAL_CERT_DIR" /var/www/certbot

if [ -f "$REAL_CERT_DIR/fullchain.pem" ]; then
  echo "Using the real Let's Encrypt certificate."
  cp "$REAL_CERT_DIR/fullchain.pem" "$LOCAL_CERT_DIR/fullchain.pem"
  cp "$REAL_CERT_DIR/privkey.pem" "$LOCAL_CERT_DIR/privkey.pem"
elif [ ! -f "$LOCAL_CERT_DIR/fullchain.pem" ]; then
  echo "No certificate available yet, generating a temporary self-signed one so nginx can start..."
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$LOCAL_CERT_DIR/privkey.pem" \
    -out "$LOCAL_CERT_DIR/fullchain.pem" \
    -subj "/CN=arena180.com.br"
fi

exec nginx -g "daemon off;"
