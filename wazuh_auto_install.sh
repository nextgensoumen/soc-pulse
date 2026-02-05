#!/bin/bash

set -e

LOGFILE="wazuh_install.log"
exec > >(tee -a "$LOGFILE") 2>&1

GREEN="\e[32m"
RED="\e[31m"
BLUE="\e[34m"
YELLOW="\e[33m"
RESET="\e[0m"

banner () {
echo -e "${BLUE}
===========================================
   WAZUH SOC AUTOMATED DEPLOYMENT SYSTEM
===========================================
${RESET}"
}

step () {
echo -e "${YELLOW}\n▶ $1...${RESET}"
}

success () {
echo -e "${GREEN}✔ $1${RESET}"
}

error () {
echo -e "${RED}✖ $1${RESET}"
exit 1
}

check_service () {
systemctl is-active --quiet $1 && success "$1 running" || error "$1 failed"
}

banner

step "Updating system packages"
apt update && apt upgrade -y || error "System update failed"
success "System updated"

step "Installing dependencies"
apt install curl unzip apt-transport-https software-properties-common -y || error "Dependency install failed"
success "Dependencies installed"

step "Downloading latest Wazuh installer"
curl -sO https://packages.wazuh.com/4.14/wazuh-install.sh || error "Download failed"
chmod +x wazuh-install.sh
success "Installer ready"

step "Deploying Wazuh full SOC stack"
./wazuh-install.sh -a || error "Wazuh installation failed"
success "Wazuh installed successfully"

step "Checking SOC services health"
check_service wazuh-manager
check_service wazuh-indexer
check_service wazuh-dashboard

step "Fetching dashboard credentials"

PASSWORD=$(grep -i "password" /var/ossec/logs/install.log | tail -1 | awk '{print $NF}')
IP=$(curl -s ifconfig.me)

echo -e "${GREEN}
===========================================
       🎉 WAZUH SOC READY TO USE 🎉
===========================================

🌐 Dashboard:
https://$IP

👤 Username: admin
🔐 Password: $PASSWORD

📄 Install log: $LOGFILE
===========================================
${RESET}"
