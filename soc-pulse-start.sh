#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# SOC Pulse — Master Start Script v2.0
# Cloud-hardened: any Ubuntu version, any cloud provider
# Survives SSH disconnect via pm2
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "${BLUE}${BOLD}"
echo -e "╔══════════════════════════════════════════════════╗"
echo -e "║   🛡️  SOC Pulse — Master Orchestrator v2.0      ║"
echo -e "║       Cloud-hardened. Production-ready.          ║"
echo -e "╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── Must run as root ───────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}[✗] Please run as root: sudo bash soc-pulse-start.sh${NC}"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Create logs dir ───────────────────────────────────────────────────────────
mkdir -p "$SCRIPT_DIR/logs"

# ── Make all setup scripts executable ─────────────────────────────────────────
chmod +x "$SCRIPT_DIR/setup/"*.sh

# ── PHASE 1: Check & install prerequisites ────────────────────────────────────
echo -e "${YELLOW}${BOLD}[Phase 1/4] Checking prerequisites...${NC}"
bash "$SCRIPT_DIR/setup/01-check-prerequisites.sh"

# ── PHASE 2: Install all dependencies ─────────────────────────────────────────
echo -e "\n${YELLOW}${BOLD}[Phase 2/4] Installing dependencies...${NC}"
bash "$SCRIPT_DIR/setup/02-install-dependencies.sh"

# ── PHASE 3: Launch backend (pm2 — background, persists after SSH exit) ───────
echo -e "\n${YELLOW}${BOLD}[Phase 3/4] Starting backend server...${NC}"
bash "$SCRIPT_DIR/setup/04-run-backend.sh"

# Give backend 4s to bind to port 5000 before dashboard starts
echo -e "${YELLOW}  ⏳ Waiting for backend to initialize...${NC}"
for i in {1..8}; do
    if curl -fsSL --max-time 1 http://localhost:5000/api/health &>/dev/null; then
        echo -e "${GREEN}  [✓] Backend is live!${NC}"
        break
    fi
    sleep 0.5
done

# ── PHASE 4: Launch dashboard (pm2 — background) ──────────────────────────────
echo -e "\n${YELLOW}${BOLD}[Phase 4/4] Starting dashboard...${NC}"
bash "$SCRIPT_DIR/setup/03-run-dashboard.sh"

# ── FINAL STATUS ──────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   ✅  SOC Pulse is running!                      ║${NC}"
echo -e "${GREEN}${BOLD}║                                                  ║${NC}"
echo -e "${GREEN}${BOLD}║   Both services managed by pm2.                  ║${NC}"
echo -e "${GREEN}${BOLD}║   Safe to close this SSH session.                ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}  🔧  Useful commands:${NC}"
echo -e "${BLUE}      pm2 list                    # view all processes${NC}"
echo -e "${BLUE}      pm2 logs                    # view live logs${NC}"
echo -e "${BLUE}      pm2 restart all             # restart everything${NC}"
echo -e "${BLUE}      pm2 stop all                # stop everything${NC}"
echo -e "${BLUE}      pm2 startup && pm2 save     # survive reboots${NC}"
echo ""
echo -e "${BLUE}  📊  Backend health: curl http://localhost:5000/api/health${NC}"
