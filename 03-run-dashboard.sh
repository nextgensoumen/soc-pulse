#!/bin/bash
GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'; BOLD='\033[1m'
echo -e "${BLUE}${BOLD}==================================================${NC}"
echo -e "${GREEN}${BOLD}    🚀 Starting SOC Pulse Dashboard 🚀     ${NC}"
echo -e "${BLUE}${BOLD}==================================================${NC}\n"

cd dashboard || { echo "Error: dashboard directory not found."; exit 1; }
echo -e "📦 Installing frontend NPM packages..."
npm install --silent
echo -e "\n${GREEN}🌐 Launching Web Server on all network interfaces...${NC}"
echo -e "💡 Access the dashboard via your browser: http://<YOUR-AWS-PUBLIC-IP>:5173\n"
npm run dev -- --host 0.0.0.0
