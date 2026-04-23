#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# SOC Pulse — Backend Runner v2.0
# Cloud-hardened: pm2 process manager, survives SSH disconnect, auto-restart
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'; BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}${BOLD}==================================================${NC}"
echo -e "${GREEN}${BOLD}   ⚙️  SOC Pulse Backend Orchestrator v2.0       ${NC}"
echo -e "${BLUE}${BOLD}==================================================${NC}\n"

# ── STEP 1: Build Web App Scanner TypeScript ──────────────────────────────────
SCANNER_DIR="$PROJECT_ROOT/module-webapp-scanner"
if [[ -d "$SCANNER_DIR" ]]; then
    echo -e "${YELLOW}📦 Building Web App Scanner (TypeScript)...${NC}"
    cd "$SCANNER_DIR"
    npm install --silent --prefer-offline 2>/dev/null || npm install --silent
    # Only rebuild if dist/ is missing or src/ is newer
    if [[ ! -f "dist/cli/index.js" ]] || [[ "src" -nt "dist" ]]; then
        npm run build --silent 2>/dev/null || echo -e "${YELLOW}  ⚠ Build warning (may be pre-built)${NC}"
    else
        echo -e "${GREEN}  [✓] Pre-built dist/ found — skipping rebuild${NC}"
    fi
fi

# ── STEP 2: Install backend dependencies ──────────────────────────────────────
BACKEND_DIR="$PROJECT_ROOT/backend"
cd "$BACKEND_DIR"
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
npm install --silent --prefer-offline 2>/dev/null || npm install --silent

# ── STEP 3: Launch backend via pm2 (survives SSH disconnect) ──────────────────
echo -e "\n${GREEN}🌐 Launching Backend API + WebSocket Server via pm2...${NC}"

# Stop existing instance if running (graceful)
pm2 stop soc-pulse-backend 2>/dev/null || true
pm2 delete soc-pulse-backend 2>/dev/null || true

# Start with pm2 — auto-restart on crash, max 10 restart attempts
pm2 start server.js \
    --name "soc-pulse-backend" \
    --interpreter "node" \
    --node-args "--experimental-vm-modules" \
    --max-restarts 10 \
    --restart-delay 2000 \
    --env production \
    --output "$PROJECT_ROOT/logs/backend-out.log" \
    --error "$PROJECT_ROOT/logs/backend-err.log" \
    --log-date-format "YYYY-MM-DD HH:mm:ss" 2>/dev/null || \
pm2 start server.js \
    --name "soc-pulse-backend" \
    --max-restarts 10 \
    --restart-delay 2000

pm2 save 2>/dev/null || true

echo -e "${GREEN}  [✓] Backend running as pm2 process 'soc-pulse-backend'${NC}"
echo -e "${BLUE}  📊  Health check: curl http://localhost:5000/api/health${NC}"
echo -e "${BLUE}  📋  View logs:    pm2 logs soc-pulse-backend${NC}"
echo -e "${BLUE}  🔄  Restart:      pm2 restart soc-pulse-backend${NC}"
