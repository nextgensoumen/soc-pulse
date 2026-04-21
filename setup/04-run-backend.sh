#!/bin/bash
GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BLUE}${BOLD}==================================================${NC}"
echo -e "${GREEN}${BOLD}    ⚙️ Starting SOC Pulse Backend Orchestrator ⚙️     ${NC}"
echo -e "${BLUE}${BOLD}==================================================${NC}\n"

echo -e "📦 Compiling local TypeScript Sub-Modules..."
cd module-webapp-scanner || { echo "Error: WebApp scanner dir missing."; exit 1; }
npm install --silent
npm run build --silent

cd ../backend || { echo "Error: backend directory not found."; exit 1; }

echo -e "📦 Installing backend NPM packages..."
npm install --silent

echo -e "\n${GREEN}🌐 Launching Backend API & WebSocket Server...${NC}"
npm start
