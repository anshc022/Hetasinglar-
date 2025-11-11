#!/usr/bin/env bash
set -euo pipefail

DOMAIN_PRIMARY="hetasinglar.se"
DOMAIN_WWW="www.hetasinglar.se"
EMAIL="admin@hetasinglar.se"
NGINX_CONF="/etc/nginx/conf.d/hetasinglar.conf"

log() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
ok()  { echo -e "\033[1;32m[OK]\033[0m   $*"; }
warn(){ echo -e "\033[1;33m[WARN]\033[0m $*"; }
err() { echo -e "\033[1;31m[ERR ]\033[0m $*"; }

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    err "This script must be run as root (sudo)."
    exit 1
  fi
}

install_certbot() {
  log "Detecting OS and installing certbot + nginx plugin..."
  if [ -f /etc/os-release ]; then
    . /etc/os-release
  else
    err "/etc/os-release not found. Unsupported system."
    exit 1
  fi

  case "${ID}" in
    amzn)
      # Amazon Linux 2/2023
      if command -v dnf >/dev/null 2>&1; then
        dnf install -y certbot python3-certbot-nginx || true
      else
        yum install -y epel-release || true
        yum install -y certbot python3-certbot-nginx || true
      fi
      ;;
    ubuntu|debian)
      apt-get update
      DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx
      ;;
    *)
      warn "Unknown distro ${ID}. Attempting generic install (may fail)."
      if command -v apt-get >/dev/null 2>&1; then
        apt-get update && apt-get install -y certbot python3-certbot-nginx
      elif command -v yum >/dev/null 2>&1; then
        yum install -y epel-release || true
        yum install -y certbot python3-certbot-nginx || true
      elif command -v dnf >/dev/null 2>&1; then
        dnf install -y certbot python3-certbot-nginx || true
      else
        err "Could not install certbot automatically."
        exit 1
      fi
      ;;
  esac
  ok "Certbot installed"
}

ensure_nginx() {
  log "Ensuring nginx is installed and running..."
  if ! command -v nginx >/dev/null 2>&1; then
    err "nginx is not installed. Please install nginx first."
    exit 1
  fi
  systemctl enable nginx || true
  systemctl start nginx || true
  ok "nginx running"
}

issue_certificates() {
  log "Requesting Let's Encrypt certificates for ${DOMAIN_PRIMARY} and ${DOMAIN_WWW}..."
  set +e
  certbot --nginx \
    -d "${DOMAIN_PRIMARY}" -d "${DOMAIN_WWW}" \
    --redirect --agree-tos -m "${EMAIL}" --non-interactive
  local status=$?
  set -e
  if [ $status -ne 0 ]; then
    warn "Issuing for both domains failed (maybe ${DOMAIN_WWW} isn't pointed). Trying apex domain only..."
    certbot --nginx \
      -d "${DOMAIN_PRIMARY}" \
      --redirect --agree-tos -m "${EMAIL}" --non-interactive
  fi
  ok "Certificates issued"
}

ensure_tls_protocols() {
  log "Ensuring nginx allows TLSv1.2 and TLSv1.3..."
  if [ -f "${NGINX_CONF}" ]; then
    if ! grep -q "ssl_protocols" "${NGINX_CONF}"; then
      # Insert after first ssl_certificate occurrence
      sed -i '/ssl_certificate\b/a \\n    ssl_protocols TLSv1.2 TLSv1.3;\n' "${NGINX_CONF}" || true
      ok "Added ssl_protocols to ${NGINX_CONF}"
    else
      # Replace existing line to include both 1.2 and 1.3
      sed -i 's/^\s*ssl_protocols.*/    ssl_protocols TLSv1.2 TLSv1.3;/' "${NGINX_CONF}" || true
      ok "Updated ssl_protocols in ${NGINX_CONF}"
    fi
  else
    warn "${NGINX_CONF} not found. Skipping protocol tweak (certbot likely managed config)."
  fi
}

reload_nginx() {
  log "Testing and reloading nginx..."
  nginx -t
  systemctl reload nginx
  ok "nginx reloaded"
}

summary() {
  echo ""
  ok "Done. Verify in a browser: https://${DOMAIN_PRIMARY}"
  echo "Certificate paths should be:"
  echo "  /etc/letsencrypt/live/${DOMAIN_PRIMARY}/fullchain.pem"
  echo "  /etc/letsencrypt/live/${DOMAIN_PRIMARY}/privkey.pem"
}

main() {
  require_root
  ensure_nginx
  install_certbot
  issue_certificates
  ensure_tls_protocols
  reload_nginx
  summary
}

main "$@"
