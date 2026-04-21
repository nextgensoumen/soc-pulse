#!/bin/bash
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'; BOLD='\033[1m'
echo -e "${BLUE}${BOLD}==================================================${NC}"
echo -e "${GREEN}${BOLD}    🛠️  SOC Pulse - Dependency Installer 🛠️     ${NC}"
echo -e "${BLUE}${BOLD}==================================================${NC}\n"

echo -e "${YELLOW}🔄 Updating & Upgrading System...${NC}"
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get upgrade -y > /dev/null 2>&1
echo -e "${GREEN}✅ System updated!${NC}\n"

echo -e "${YELLOW}📦 Installing Core SOC Tools...${NC}"
DEPENDENCIES=("curl" "wget" "git" "python3" "python3-pip" "gcc" "make" "ansible")
for pkg in "${DEPENDENCIES[@]}"; do
    if ! dpkg -s "$pkg" &> /dev/null; then
        echo -e "${YELLOW}  ⏳ Installing $pkg...${NC}"
        sudo apt-get install -y "$pkg" > /dev/null 2>&1
    fi
    echo -e "${GREEN}  [✓] $pkg installed!${NC}"
done

if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo -e "\n${YELLOW}🌐 Installing Node.js (v20)...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y nodejs > /dev/null 2>&1
fi
echo -e "${GREEN}  [✓] Node.js ($(node -v)) & npm ($(npm -v)) ready!${NC}"

echo -e "\n${GREEN}🎉 All installations complete! You can now run: ./setup/03-run-dashboard.sh${NC}"
