#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# SOC Pulse — Dashboard Runner v2.0
# Cloud-hardened: pm2, survives SSH disconnect, auto-restart on crash
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; NC='\033[0m'; BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DASHBOARD_DIR="$PROJECT_ROOT/dashboard"

echo -e "${BLUE}${BOLD}==================================================${NC}"
echo -e "${GREEN}${BOLD}    🚀 Starting SOC Pulse Dashboard v2.0         ${NC}"
echo -e "${BLUE}${BOLD}==================================================${NC}\n"

cd "$DASHBOARD_DIR"

# ── Install frontend dependencies ─────────────────────────────────────────────
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
npm install --silent --prefer-offline 2>/dev/null || npm install --silent

# ── Detect public IP for access instructions ──────────────────────────────────
PUBLIC_IP=$(curl -fsSL --max-time 3 http://checkip.amazonaws.com 2>/dev/null \
    || curl -fsSL --max-time 3 http://ifconfig.me 2>/dev/null \
    || curl -fsSL --max-time 3 https://ipinfo.io/ip 2>/dev/null \
    || echo "<YOUR-PUBLIC-IP>")

# ── Launch dashboard via pm2 ──────────────────────────────────────────────────
echo -e "\n${GREEN}🌐 Launching dashboard on all interfaces (0.0.0.0:5173) via pm2...${NC}"

pm2 stop soc-pulse-dashboard 2>/dev/null || true
pm2 delete soc-pulse-dashboard 2>/dev/null || true

pm2 start "npm run dev -- --host 0.0.0.0 --port 5173" \
    --name "soc-pulse-dashboard" \
    --max-restarts 10 \
    --restart-delay 3000 \
    --output "$PROJECT_ROOT/logs/dashboard-out.log" \
    --error "$PROJECT_ROOT/logs/dashboard-err.log" 2>/dev/null || \
pm2 start "npm run dev -- --host 0.0.0.0 --port 5173" \
    --name "soc-pulse-dashboard" \
    --max-restarts 10

pm2 save 2>/dev/null || true

echo -e "${GREEN}  [✓] Dashboard running as pm2 process 'soc-pulse-dashboard'${NC}"
echo -e ""
echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║   🌐  Access SOC Pulse Dashboard                ║${NC}"
echo -e "${BLUE}${BOLD}║                                                  ║${NC}"
echo -e "${BLUE}${BOLD}║   http://${PUBLIC_IP}:5173             ║${NC}"
echo -e "${BLUE}${BOLD}║                                                  ║${NC}"
echo -e "${BLUE}${BOLD}║   Ensure ports 5173 + 5000 open in Security Group║${NC}"
echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo -e ""
echo -e "${BLUE}  📋  View logs:  pm2 logs soc-pulse-dashboard${NC}"
echo -e "${BLUE}  🔄  Restart:    pm2 restart soc-pulse-dashboard${NC}"
