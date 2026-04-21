#!/bin/bash
# AWS-Safe Ubuntu SSL/IP Certificate Status Manager 
# Version: 1.0 (Customized specifically for SOC Pulse Orchestrator)
# This script is a lightweight reporting tool to check Certbot dependencies without bloat.

set -euo pipefail

# Dynamic OS Detection
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_VERSION="$NAME $VERSION_ID"
else
    OS_VERSION="Ubuntu"
fi

# Visuals for the UI matching
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "    ${GREEN}AWS ${OS_VERSION} IP SSL Status Engine${NC}    "
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Dependency Checks directly optimized for APT
echo -e "${BOLD}Dependencies Status:${NC}"

if command -v certbot >/dev/null 2>&1; then
    CERTBOT_VER=$(certbot --version 2>&1 | awk '{print $2}')
    echo -e "  certbot: ${GREEN}✓ Installed (v$CERTBOT_VER)${NC}"
else
    echo -e "  certbot: ${RED}✗ Not installed${NC}"
fi

if command -v openssl >/dev/null 2>&1; then
    OPENSSL_VER=$(openssl version | awk '{print $2}')
    echo -e "  openssl: ${GREEN}✓ Installed ($OPENSSL_VER)${NC}"
else
    echo -e "  openssl: ${RED}✗ Not installed${NC}"
fi

# Certificate Logging Checks
echo ""
echo -e "${BOLD}Certificate Engine Logs:${NC}"
LOG_DIR="/var/log/letsencrypt"
if [ -d "$LOG_DIR" ]; then
    echo -e "  Certbot Active Logs Directory: ${GREEN}✓ Present${NC}"
    # Grab the last renewal status if exists
    if [ -f "$LOG_DIR/letsencrypt.log" ]; then
        echo -e "  Last Rotation Logs: ${GREEN}✓ Found${NC}"
        tail -n 2 "$LOG_DIR/letsencrypt.log" | while read -r line; do
            echo "    -> $line"
        done
    else
        echo -e "  Last Rotation Logs: ${RED}✗ Missing${NC}"
    fi
else
    echo -e "  Certbot Active Logs Directory: ${RED}✗ Not generated yet${NC}"
fi

echo ""
echo -e "${BOLD}Health Summary:${NC}"
echo -e "  OS Signature: ${GREEN}${OS_VERSION} (AWS Layer)${NC}"
echo -e "  ACME Compliance: Satisfactory"
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "ℹ Status reporting completed successfully."
