#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
#  SOC Pulse — One-Command Launcher
#  Usage:  ./soc-pulse-start.sh
#  Run as: root  (already logged in as root — no sudo needed)
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'
B='\033[0;34m'; C='\033[0;36m'; W='\033[1m'; N='\033[0m'

# ── Banner ────────────────────────────────────────────────────────────────────
echo -e "${C}${W}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║    🛡️  SOC Pulse — Autonomous Security Platform          ║"
echo "║        One-command cloud launcher                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${N}"

# ── Resolve project root (where this script lives) ───────────────────────────
SOC_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$SOC_ROOT/logs"

ok()   { echo -e "  ${G}[✓]${N} $1"; }
warn() { echo -e "  ${Y}[!]${N} $1"; }
info() { echo -e "  ${B}[→]${N} $1"; }
fail() { echo -e "  ${R}[✗]${N} $1"; exit 1; }
step() { echo -e "\n${W}${B}▶ $1${N}"; }

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 — System package update (non-interactive, never hangs)
# ═══════════════════════════════════════════════════════════════════════════════
step "Updating package lists..."
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a
export NEEDRESTART_SUSPEND=1

apt-get update -y -qq 2>/dev/null && ok "Package lists updated"

# Core tools (skip if already installed)
PKGS=(curl wget git python3 python3-pip gcc make jq unzip)
MISSING=()
for p in "${PKGS[@]}"; do
    dpkg -s "$p" &>/dev/null || MISSING+=("$p")
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
    info "Installing: ${MISSING[*]}"
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${MISSING[@]}" 2>/dev/null || true
fi
ok "System tools ready"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — Node.js v20 LTS
# ═══════════════════════════════════════════════════════════════════════════════
step "Checking Node.js..."
NODE_VER=$(node -v 2>/dev/null | grep -oP '\d+' | head -1 || echo "0")
if [[ "$NODE_VER" -lt 18 ]]; then
    info "Installing Node.js v20 LTS..."
    if curl -fsSL https://deb.nodesource.com/setup_20.x | bash - -q 2>/dev/null; then
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs 2>/dev/null
    else
        warn "NodeSource failed — trying snap fallback..."
        snap install node --classic --channel=20 2>/dev/null || fail "Node.js install failed"
    fi
fi
command -v node &>/dev/null || fail "Node.js not found after install"
ok "Node.js $(node -v)  |  npm $(npm -v)"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 — pm2 (process manager — survives SSH disconnect)
# ═══════════════════════════════════════════════════════════════════════════════
step "Checking pm2..."
if ! command -v pm2 &>/dev/null; then
    info "Installing pm2 globally..."
    npm install -g pm2 --quiet 2>/dev/null
fi
ok "pm2 $(pm2 -v 2>/dev/null)"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 — Build Web App Scanner (TypeScript → dist/)
# ═══════════════════════════════════════════════════════════════════════════════
step "Building Web App Scanner..."
SCANNER="$SOC_ROOT/module-webapp-scanner"
cd "$SCANNER"
if [[ ! -f "dist/cli/index.js" ]]; then
    info "Installing scanner dependencies..."
    npm install --silent --prefer-offline 2>/dev/null || npm install --silent
    info "Compiling TypeScript..."
    npm run build --silent 2>/dev/null && ok "Scanner built" || warn "Build warning — may already be compiled"
else
    ok "Scanner already built (dist/ exists)"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 — Install backend dependencies
# ═══════════════════════════════════════════════════════════════════════════════
step "Installing backend dependencies..."
cd "$SOC_ROOT/backend"
npm install --silent --prefer-offline 2>/dev/null || npm install --silent
ok "Backend node_modules ready"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6 — Install dashboard dependencies
# ═══════════════════════════════════════════════════════════════════════════════
step "Installing dashboard dependencies..."
cd "$SOC_ROOT/dashboard"
npm install --silent --prefer-offline 2>/dev/null || npm install --silent
ok "Dashboard node_modules ready"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7 — Launch everything via pm2
# ═══════════════════════════════════════════════════════════════════════════════
step "Launching SOC Pulse services..."

# Stop old instances gracefully
pm2 stop soc-pulse-backend  2>/dev/null || true
pm2 stop soc-pulse-dashboard 2>/dev/null || true
pm2 delete soc-pulse-backend  2>/dev/null || true
pm2 delete soc-pulse-dashboard 2>/dev/null || true

# Start backend
# --cwd is CRITICAL: tells pm2 to run server.js from backend/ so Node.js
# finds backend/package.json with "type":"module" (ESM). Without this it crashes.
pm2 start "$SOC_ROOT/backend/server.js" \
    --name "soc-pulse-backend" \
    --cwd  "$SOC_ROOT/backend" \
    --max-restarts 10 \
    --restart-delay 2000 \
    --output "$SOC_ROOT/logs/backend-out.log" \
    --error  "$SOC_ROOT/logs/backend-err.log" \
    --log-date-format "YYYY-MM-DD HH:mm:ss" \
    2>/dev/null
ok "Backend started (pm2: soc-pulse-backend)"

# Start dashboard
pm2 start "npm run dev -- --host 0.0.0.0 --port 5173" \
    --name "soc-pulse-dashboard" \
    --cwd "$SOC_ROOT/dashboard" \
    --max-restarts 10 \
    --restart-delay 3000 \
    --output "$SOC_ROOT/logs/dashboard-out.log" \
    --error  "$SOC_ROOT/logs/dashboard-err.log" \
    --log-date-format "YYYY-MM-DD HH:mm:ss" \
    2>/dev/null
ok "Dashboard started (pm2: soc-pulse-dashboard)"

# Save pm2 state (auto-restore on reboot)
pm2 save 2>/dev/null || true

# Configure pm2 startup (survive reboot)
pm2 startup 2>/dev/null | tail -1 | bash 2>/dev/null || true

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 8 — Health check
# ═══════════════════════════════════════════════════════════════════════════════
step "Waiting for backend to come online..."
for i in {1..30}; do
    if curl -fsSL --max-time 1 http://localhost:5000/api/health &>/dev/null; then
        ok "Backend health check passed! (${i}s)"
        break
    fi
    sleep 1
    [[ $i -eq 30 ]] && warn "Backend slow to start — check: pm2 logs soc-pulse-backend --lines 30"
done

# ═══════════════════════════════════════════════════════════════════════════════
# DONE — Print access info
# ═══════════════════════════════════════════════════════════════════════════════
PUBLIC_IP=$(curl -fsSL --max-time 3 http://checkip.amazonaws.com 2>/dev/null \
    || curl -fsSL --max-time 3 http://ifconfig.me 2>/dev/null \
    || curl -fsSL --max-time 3 https://ipinfo.io/ip 2>/dev/null \
    || echo "<YOUR-PUBLIC-IP>")

echo ""
echo -e "${G}${W}╔══════════════════════════════════════════════════════════╗"
echo    "║   ✅  SOC Pulse is LIVE!                                 ║"
echo    "║                                                          ║"
printf  "║   🌐  Dashboard  →  http://%-29s║\n" "${PUBLIC_IP}:5173  "
printf  "║   ⚙️   Backend   →  http://%-29s║\n" "${PUBLIC_IP}:5000  "
echo    "║                                                          ║"
echo    "║   ⚠️  Open ports 5173 + 5000 in your Security Group!     ║"
echo    "║   ✅  Safe to close this SSH session (pm2 keeps it live) ║"
echo -e "╚══════════════════════════════════════════════════════════╝${N}"
echo ""
echo -e "${B}  pm2 list               ${N}# see running services"
echo -e "${B}  pm2 logs               ${N}# live log stream"
echo -e "${B}  pm2 restart all        ${N}# restart everything"
echo -e "${B}  pm2 stop all           ${N}# stop everything"
echo ""
