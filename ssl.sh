#!/usr/bin/env bash
set -euo pipefail

DOMAIN="hms.rest"
PROJECT_DIR="${PROJECT_DIR:-$PWD}"
SSL_DIR="${PROJECT_DIR}/ssl"
ACME_HOME="${HOME}/.acme.sh"
SAVE_ENV="false"

print_usage() {
  echo "Usage: ./ssl.sh [--domain hms.rest] [--gd-key KEY] [--gd-secret SECRET] [--save-env]"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="$2"
      shift 2
      ;;
    --gd-key)
      GD_Key="$2"
      shift 2
      ;;
    --gd-secret)
      GD_Secret="$2"
      shift 2
      ;;
    --save-env)
      SAVE_ENV="true"
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      print_usage
      exit 1
      ;;
  esac
done

if [[ -z "${GD_Key:-}" || -z "${GD_Secret:-}" ]]; then
  echo "GD_Key and GD_Secret must be set in the shell before running this script."
  echo "Example:"
  echo '  export GD_Key="your_godaddy_api_key"'
  echo '  export GD_Secret="your_godaddy_api_secret"'
  exit 1
fi

if [[ "${GD_Key}" == "YOUR_GODADDY_API_KEY" || "${GD_Secret}" == "YOUR_GODADDY_API_SECRET" ]]; then
  echo "Replace placeholder GoDaddy credentials before running this script."
  exit 1
fi

export GD_Key
export GD_Secret

if [[ "${SAVE_ENV}" == "true" ]]; then
  if grep -q '^export GD_Key=' "${HOME}/.bashrc"; then
    sed -i "s|^export GD_Key=.*$|export GD_Key=\"${GD_Key}\"|" "${HOME}/.bashrc"
  else
    echo "export GD_Key=\"${GD_Key}\"" >> "${HOME}/.bashrc"
  fi

  if grep -q '^export GD_Secret=' "${HOME}/.bashrc"; then
    sed -i "s|^export GD_Secret=.*$|export GD_Secret=\"${GD_Secret}\"|" "${HOME}/.bashrc"
  else
    echo "export GD_Secret=\"${GD_Secret}\"" >> "${HOME}/.bashrc"
  fi

  echo "Saved GD_Key and GD_Secret to ${HOME}/.bashrc"
fi

if [[ ! -d "${ACME_HOME}" ]]; then
  curl https://get.acme.sh | sh
fi

mkdir -p "${SSL_DIR}"

"${ACME_HOME}/acme.sh" --issue --dns dns_gd -d "${DOMAIN}" -d "*.${DOMAIN}" --server letsencrypt

reload_command="true"
if docker ps --format '{{.Names}}' | grep -qx 'hms_nginx'; then
  reload_command="docker exec hms_nginx nginx -s reload"
fi

"${ACME_HOME}/acme.sh" --install-cert -d "${DOMAIN}" \
  --key-file "${SSL_DIR}/privkey.pem" \
  --fullchain-file "${SSL_DIR}/fullchain.pem" \
  --reloadcmd "${reload_command}"

echo "Certificates installed to ${SSL_DIR}"
ls -l "${SSL_DIR}"