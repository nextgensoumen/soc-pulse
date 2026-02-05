#!/bin/bash
set -e

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
[[ $EUID -ne 0 ]] && fail "Run with sudo or root"

# OS
source /etc/os-release
[[ "$ID" != "ubuntu" ]] && fail "Only Ubuntu supported"
VER=${VERSION_ID%%.*}
[[ "$VER" -lt 22 ]] && fail "Ubuntu 22.04+ required"
ok "Ubuntu $VERSION_ID detected"

# RAM
RAM=$(free -g | awk '/Mem:/ {print $2}')
[[ $RAM -lt 6 ]] && fail "RAM too low (${RAM}GB found — 8GB required)"
[[ $RAM -lt 8 ]] && warn "RAM low (${RAM}GB) — performance may suffer" || ok "RAM ${RAM}GB OK"

# Disk
DISK=$(df -BG --output=avail / | tail -1 | tr -d 'G ')
[[ $DISK -lt 50 ]] && fail "Disk too low (${DISK}GB free — 50GB required)"
ok "Disk ${DISK}GB free"

# Internet (Wazuh repo check)
curl -Is https://packages.wazuh.com >/dev/null || fail "No internet / Wazuh repo unreachable"
ok "Internet connectivity OK"

# Ports
for p in 443 1514 1515 55000; do
  ss -lntup | grep -q ":$p " && fail "Port $p already in use"
done
ok "Required ports free"

# Existing Wazuh
systemctl list-units | grep -q wazuh && warn "Existing Wazuh detected" || ok "No previous Wazuh found"

echo -e "${GREEN}Installing Wazuh latest stable (4.14 series)${RESET}"
echo "===== System Ready for Installation ====="

banner () {
echo -e "${BLUE}
===========================================
   WAZUH SOC AUTOMATED DEPLOYMENT SYSTEM
===========================================
${RESET}"
}

step(){ echo -e "${YELLOW}\n▶ $1...${RESET}"; }
success(){ echo -e "${GREEN}✔ $1${RESET}"; }
error(){ echo -e "${RED}✖ $1${RESET}"; exit 1; }

check_service(){
systemctl is-active --quiet $1 && success "$1 running" || error "$1 failed"
}

banner

step "Updating system packages"
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

step "Retrieving dashboard credentials"
PASSWORD=$(grep -i "password" /var/ossec/logs/install.log | tail -1 | awk '{print $NF}')
IP=$(curl -s ifconfig.me)

echo -e "${GREEN}
===========================================
 🎉 SOC PULSE INSTALLATION COMPLETE 🎉
===========================================

Dashboard: https://$IP
Username : admin
Password : $PASSWORD

Log file : $LOGFILE
===========================================
${RESET}"
