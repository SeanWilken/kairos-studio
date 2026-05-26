#!/bin/sh
set -eu

template="/usr/share/nginx/html/runtime-config.template.js"
target="/usr/share/nginx/html/runtime-config.js"

: "${MYAI_TENANT_ID:=tenant-local}"
: "${MYAI_CORE_API_BASE_URL:=http://localhost:8000}"
: "${MYAI_DE_API_BASE_URL:=http://localhost:8010}"
: "${MYAI_APP_ID:=myai-studio-frontend}"
: "${MYAI_CORE_FRONTEND_URL:=http://localhost:8080}"
: "${MYAI_COUNCIL_FRONTEND_URL:=http://localhost:8082}"
: "${MYAI_CORE_WS_URL:=}"
: "${MYAI_ORG_ID:=}"

export MYAI_TENANT_ID
export MYAI_CORE_API_BASE_URL
export MYAI_DE_API_BASE_URL
export MYAI_APP_ID
export MYAI_CORE_FRONTEND_URL
export MYAI_COUNCIL_FRONTEND_URL
export MYAI_CORE_WS_URL
export MYAI_ORG_ID

if [ -f "$template" ]; then
  envsubst < "$template" > "$target"
fi
