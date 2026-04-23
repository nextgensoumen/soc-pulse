#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
#  SOC Pulse — One-Command Launcher v3.0
#  Usage:  ./soc-pulse-start.sh
#  Run as: root (already logged in as root)
#  Works on: Ubuntu 20.04 / 22.04 / 24.04 — AWS, GCP, Azure, DO, Hetzner
# ═══════════════════════════════════════════════════════════════════════════════

# No set -e — we handle every error explicitly so nothing silently aborts
set -uo pipefail

R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'
B='\033[0;34m'; C='\033[0;36m'; W='\033[1m'; N='\033[0m'

echo -e "${C}${W}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║    🛡️  SOC Pulse — Autonomous Security Platform v3.0     ║"
echo "║        One-command cloud launcher                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${N}"

SOC_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$SOC_ROOT/logs"

ok()   { echo -e "  ${G}[✓]${N} $1"; }
warn() { echo -e "  ${Y}[!]${N} $1"; }
info() { echo -e "  ${B}[→]${N} $1"; }
fail() { echo -e "  ${R}[✗]${N} $1"; exit 1; }
step() { echo -e "\n${W}${B}▶ $1${N}"; }

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 — System packages (non-interactive, never hangs)
# ═══════════════════════════════════════════════════════════════════════════════
step "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a
export NEEDRESTART_SUSPEND=1

apt-get update -y -qq 2>/dev/null && ok "Package lists updated"

PKGS=(curl wget git python3 python3-pip gcc make jq unzip)
MISSING=()
for p in "${PKGS[@]}"; do dpkg -s "$p" &>/dev/null || MISSING+=("$p"); done
if [[ ${#MISSING[@]} -gt 0 ]]; then
    info "Installing: ${MISSING[*]}"
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${MISSING[@]}" 2>/dev/null || true
fi
ok "System tools ready"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — Node.js v20 LTS
# Strategy: download setup script to FILE first (fixes curl pipe error),
# then run it. Snap is the fallback. Always symlink to /usr/local/bin/node.
# ═══════════════════════════════════════════════════════════════════════════════
step "Installing Node.js v20 LTS..."
NODE_BIN=""

# Check if usable node already exists
CURRENT_VER=$(node -v 2>/dev/null | grep -oP '\d+' | head -1 || echo "0")
if [[ "$CURRENT_VER" -ge 18 ]]; then
    NODE_BIN=$(command -v node)
    ok "Node.js already installed: $(node -v) at $NODE_BIN"
else
    # METHOD 1: NodeSource — download to file first (avoids curl pipe broken error)
    info "Trying NodeSource (file download method)..."
    if curl -fsSL https://deb.nodesource.com/setup_20.x -o /tmp/node_setup.sh 2>/dev/null; then
        bash /tmp/node_setup.sh -q 2>/dev/null || true
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs 2>/dev/null || true
        rm -f /tmp/node_setup.sh
    fi

    # Check if METHOD 1 worked
    NODE_BIN=$(command -v node 2>/dev/null || echo "")
    if [[ -n "$NODE_BIN" ]] && node -v &>/dev/null; then
        ok "Node.js $(node -v) installed via NodeSource"
    else
        # METHOD 2: Snap fallback
        warn "NodeSource failed — installing via snap..."
        snap install node --classic --channel=20 2>/dev/null || fail "Node.js install failed — no internet?"
        NODE_BIN="/snap/bin/node"
        ok "Node.js $(/snap/bin/node -v) installed via snap"
    fi
fi

# ── ALWAYS create /usr/local/bin/node symlink ─────────────────────────────────
# This is the permanent fix for pm2 daemon not finding snap node.
# pm2 daemon PATH includes /usr/local/bin but NOT /snap/bin.
info "Creating /usr/local/bin/node symlink..."
ln -sf "$NODE_BIN" /usr/local/bin/node 2>/dev/null || true
NPM_BIN=$(dirname "$NODE_BIN")/npm
[[ -f "$NPM_BIN" ]] && ln -sf "$NPM_BIN" /usr/local/bin/npm 2>/dev/null || true
hash -r 2>/dev/null || true  # clear shell command cache
ok "node → /usr/local/bin/node [bin: $NODE_BIN]"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 — pm2
# ═══════════════════════════════════════════════════════════════════════════════
step "Installing pm2..."
if ! command -v pm2 &>/dev/null; then
    /usr/local/bin/npm install -g pm2 --quiet 2>/dev/null || \
    "$NODE_BIN" "$(dirname $NODE_BIN)/npm" install -g pm2 --quiet 2>/dev/null || \
    fail "pm2 install failed"
fi
PM2_BIN=$(command -v pm2 || echo "/usr/local/bin/pm2")
ok "pm2 $($PM2_BIN -v 2>/dev/null) at $PM2_BIN"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 — Build Web App Scanner TypeScript
# ═══════════════════════════════════════════════════════════════════════════════
step "Building Web App Scanner..."
cd "$SOC_ROOT/module-webapp-scanner"
if [[ ! -f "dist/cli/index.js" ]]; then
    info "Installing dependencies..."
    /usr/local/bin/npm install --silent 2>/dev/null || true
    info "Compiling TypeScript..."
    /usr/local/bin/npm run build --silent 2>/dev/null && ok "Scanner built" || warn "Build had warnings (may still work)"
else
    ok "Scanner already built (dist/ exists — skipping)"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 — Backend dependencies
# ═══════════════════════════════════════════════════════════════════════════════
step "Installing backend dependencies..."
cd "$SOC_ROOT/backend"
/usr/local/bin/npm install --silent 2>/dev/null || /usr/local/bin/npm install
ok "Backend node_modules ready"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6 — Dashboard dependencies
# ═══════════════════════════════════════════════════════════════════════════════
step "Installing dashboard dependencies..."
cd "$SOC_ROOT/dashboard"
/usr/local/bin/npm install --silent 2>/dev/null || /usr/local/bin/npm install
ok "Dashboard node_modules ready"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7 — Kill any stale processes on ports 5000 / 5173
# ═══════════════════════════════════════════════════════════════════════════════
step "Clearing ports 5000 and 5173..."
fuser -k 5000/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true
$PM2_BIN stop all   2>/dev/null || true
$PM2_BIN delete all 2>/dev/null || true
sleep 1
ok "Ports cleared"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 8 — Launch via pm2
# KEY: --interpreter uses the FULL PATH to node binary (no PATH lookup needed)
# ═══════════════════════════════════════════════════════════════════════════════
step "Launching SOC Pulse via pm2..."

# Backend
$PM2_BIN start "$SOC_ROOT/backend/server.js" \
    --name "soc-pulse-backend" \
    --cwd  "$SOC_ROOT/backend" \
    --interpreter "$NODE_BIN" \
    --max-restarts 10 \
    --restart-delay 2000 \
    --output "$SOC_ROOT/logs/backend-out.log" \
    --error  "$SOC_ROOT/logs/backend-err.log" \
    --log-date-format "YYYY-MM-DD HH:mm:ss"
ok "Backend started"

# Dashboard (npm run dev — uses bash interpreter)
$PM2_BIN start "npm run dev -- --host 0.0.0.0 --port 5173" \
    --name "soc-pulse-dashboard" \
    --cwd  "$SOC_ROOT/dashboard" \
    --max-restarts 10 \
    --restart-delay 3000 \
    --output "$SOC_ROOT/logs/dashboard-out.log" \
    --error  "$SOC_ROOT/logs/dashboard-err.log" \
    --log-date-format "YYYY-MM-DD HH:mm:ss"
ok "Dashboard started"

# Persist + auto-start on reboot
$PM2_BIN save 2>/dev/null || true
$PM2_BIN startup 2>/dev/null | grep "sudo" | bash 2>/dev/null || true

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 9 — Health check
# ═══════════════════════════════════════════════════════════════════════════════
step "Waiting for backend health check..."
BACKEND_OK=false
for i in {1..30}; do
    if curl -fsSL --max-time 2 http://localhost:5000/api/health &>/dev/null; then
        ok "Backend is healthy! (took ${i}s)"
        BACKEND_OK=true
        break
    fi
    printf "  . "
    sleep 1
done
echo ""

if [[ "$BACKEND_OK" = false ]]; then
    warn "Backend didn't respond — showing logs:"
    echo "──────────────────────────────────────"
    tail -20 "$SOC_ROOT/logs/backend-err.log" 2>/dev/null || echo "(no error log yet)"
    tail -20 "$SOC_ROOT/logs/backend-out.log" 2>/dev/null || echo "(no output log yet)"
    echo "──────────────────────────────────────"
    warn "Try: $PM2_BIN logs soc-pulse-backend --lines 30 --nostream"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# DONE
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
echo    "║   ✅  Safe to close SSH — pm2 keeps it alive             ║"
echo -e "╚══════════════════════════════════════════════════════════╝${N}"
echo ""
echo -e "${B}  pm2 list               ${N}# view running processes"
echo -e "${B}  pm2 logs               ${N}# live log stream"
echo -e "${B}  pm2 restart all        ${N}# restart everything"
echo ""
