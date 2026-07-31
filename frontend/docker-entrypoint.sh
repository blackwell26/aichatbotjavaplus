#!/bin/sh
set -eu

API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api/v1}"
CLIENT_LOG_URL="${CLIENT_LOG_URL:-$API_BASE_URL/client-logs}"
WS_BASE_URL="${WS_BASE_URL:-ws://localhost:8080/ws}"
AUTH_ISSUER="${AUTH_ISSUER:-http://localhost:9000}"

sed \
  -e "s|__API_BASE_URL__|$API_BASE_URL|g" \
  -e "s|__CLIENT_LOG_URL__|$CLIENT_LOG_URL|g" \
  -e "s|__WS_BASE_URL__|$WS_BASE_URL|g" \
  -e "s|__AUTH_ISSUER__|$AUTH_ISSUER|g" \
  /usr/share/nginx/html/runtime-config.template.js > /usr/share/nginx/html/runtime-config.js

exec "$@"
