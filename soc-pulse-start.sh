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
chmod +x setup/01-check-prerequisites.sh setup/02-install-dependencies.sh setup/03-run-dashboard.sh

echo -e "${YELLOW}[Master Script] >>> Launching setup/01-check-prerequisites.sh${NC}"
./setup/01-check-prerequisites.sh

echo -e "\n${BLUE}--------------------------------------------------${NC}"
echo -e "${YELLOW}[Master Script] >>> Launching setup/02-install-dependencies.sh${NC}"
# We run this to ensure the system is completely updated and any missing pieces from step 01 are forcefully grabbed
./setup/02-install-dependencies.sh

echo -e "\n${BLUE}--------------------------------------------------${NC}"
echo -e "${YELLOW}[Master Script] >>> Launching setup/03-run-dashboard.sh${NC}"
./setup/03-run-dashboard.sh
