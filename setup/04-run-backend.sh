#!/bin/bash
GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BLUE}${BOLD}==================================================${NC}"
echo -e "${GREEN}${BOLD}    ⚙️ Starting SOC Pulse Backend Orchestrator ⚙️     ${NC}"
echo -e "${BLUE}${BOLD}==================================================${NC}\n"

cd backend || { echo "Error: backend directory not found."; exit 1; }

echo -e "📦 Installing backend NPM packages..."
npm install --silent

echo -e "\n${GREEN}🌐 Launching Backend API & WebSocket Server...${NC}"
npm start
