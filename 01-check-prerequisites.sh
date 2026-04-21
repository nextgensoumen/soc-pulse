#!/bin/bash
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'; BOLD='\033[1m'
echo -e "${YELLOW}${BOLD}🔍 Phase 1: Checking SOC Pulse Prerequisites...${NC}"

ALL_GOOD=true
DEPENDENCIES=("curl" "wget" "git" "python3" "python3-pip" "gcc" "make" "ansible" "node" "npm")

echo "Checking system tools:"
for cmd in "${DEPENDENCIES[@]}"; do
    if command -v "$cmd" &> /dev/null || dpkg -s "$cmd" &> /dev/null; then
        echo -e "${GREEN}  [✓] $cmd is installed.${NC}"
    else
        echo -e "${RED}  [ ] $cmd is MISSING.${NC}"
        ALL_GOOD=false
    fi
done

echo ""
if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}🎉 All prerequisites are met! You can skip directly to: ./03-run-dashboard.sh${NC}"
else
    echo -e "${RED}⚠️ Some prerequisites are missing! Please run: ./02-install-dependencies.sh${NC}"
fi
