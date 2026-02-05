#!/bin/bash
set -euo pipefail

RED="\e[31m"
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
RESET="\e[0m"

fail(){ echo -e "${RED}❌ $1${RESET}"; exit 1; }
warn(){ echo -e "${YELLOW}⚠️ $1${RESET}"; }
ok(){ echo -e "${GREEN}✔ $1${RESET}"; }

LOGFILE="wazuh_install.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "===== SOC Pulse System Preflight Check ====="

# Root
[[ $EUID -ne 0 ]] && fail "Run with sudo"

# OS
source /etc/os-release
[[ "$ID" != "ubuntu" ]] && fail "Only Ubuntu supported"
VER=${VERSION_ID%%.*}
[[ "$VER" -lt 22 ]] && fail "Ubuntu 22.04+ required"
ok "Ubuntu $VERSION_ID detected"

# RAM
RAM=$(free -g | awk '/Mem:/ {print $2}')
[[ $RAM -lt 4 ]] && fail "RAM critically low"
[[ $RAM -lt 8 ]] && warn "RAM low (${RAM}GB)" || ok "RAM ${RAM}GB OK"

# Disk
DISK=$(df -BG --output=avail / | tail -1 | tr -d 'G ')
[[ $DISK -lt 30 ]] && fail "Disk critically low"
[[ $DISK -lt 50 ]] && warn "Disk low (${DISK}GB)" || ok "Disk ${DISK}GB OK"

# Internet
curl -Is https://packages.wazuh.com >/dev/null || fail "No internet"
ok "Internet OK"

# Ports (warning only)
for p in 443 1514 1515 55000; do
  ss -lntup | grep -qw ":$p" && warn "Port $p in use" || ok "Port $p free"
done

# Old Wazuh
systemctl list-units | grep -q wazuh && warn "Old Wazuh detected" || ok "Fresh system"

echo -e "${GREEN}System ready for Wazuh installation${RESET}"

banner () {
echo -e "${BLUE}
===========================================
      SOC PULSE AUTOMATED DEPLOYMENT
===========================================
${RESET}"
}

step(){ echo -e "${YELLOW}\n▶ $1...${RESET}"; }
success(){ echo -e "${GREEN}✔ $1${RESET}"; }
error(){ echo -e "${RED}✖ $1${RESET}"; exit 1; }

check_service(){
systemctl is-active --quiet "$1" && success "$1 running" || error "$1 failed"
}

banner

step "Updating system"
apt update && apt upgrade -y
success "System updated"

step "Installing dependencies"
apt install curl unzip apt-transport-https software-properties-common -y
success "Dependencies installed"

step "Downloading Wazuh installer"
curl -sO https://packages.wazuh.com/4.14/wazuh-install.sh
chmod +x wazuh-install.sh
success "Installer ready"

step "Installing Wazuh SOC stack"
./wazuh-install.sh -a
success "Wazuh installed"

step "Verifying services"
check_service wazuh-manager
check_service wazuh-indexer
check_service wazuh-dashboard

# ----------------------------
# AUTO PASSWORD RESET FEATURE
# ----------------------------

step "Setting dashboard password to admin/admin"

sudo /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh \
-a -u admin -p admin

success "Dashboard password set to admin"

# ----------------------------

IP=$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')

echo -e "${GREEN}
===========================================
 🎉 SOC PULSE INSTALL COMPLETE 🎉
===========================================

Dashboard URL:
https://$IP

Login:
Username: admin
Password: admin

Log file:
$LOGFILE
===========================================
${RESET}"
