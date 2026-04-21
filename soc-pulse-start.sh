#!/bin/bash
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}==================================================${NC}"
echo -e "${GREEN}${BOLD}   🛡️  Welcome to SOC Pulse Command Center 🛡️    ${NC}"
echo -e "${BLUE}${BOLD}==================================================${NC}\n"

# Ensure other scripts have execution permissions
chmod +x 01-check-prerequisites.sh 02-install-dependencies.sh 03-run-dashboard.sh

echo -e "${YELLOW}[Master Script] >>> Launching 01-check-prerequisites.sh${NC}"
./01-check-prerequisites.sh

echo -e "\n${BLUE}--------------------------------------------------${NC}"
echo -e "${YELLOW}[Master Script] >>> Launching 02-install-dependencies.sh${NC}"
# We run this to ensure the system is completely updated and any missing pieces from step 01 are forcefully grabbed
./02-install-dependencies.sh

echo -e "\n${BLUE}--------------------------------------------------${NC}"
echo -e "${YELLOW}[Master Script] >>> Launching 03-run-dashboard.sh${NC}"
./03-run-dashboard.sh
