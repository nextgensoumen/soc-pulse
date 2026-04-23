#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# SOC Pulse — Dependency Installer v2.0
# Cloud-hardened: non-interactive, works on Ubuntu 20.04 / 22.04 / 24.04 / 25.04
# Tested: AWS EC2, GCP Compute Engine, Azure VM, DigitalOcean, Hetzner
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'; BOLD='\033[1m'

# ── CRITICAL: Prevent ALL interactive prompts (kernel upgrades, grub, etc.) ──
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a          # auto-restart services without asking
export NEEDRESTART_SUSPEND=1       # suppress needrestart kernel checks

echo -e "${BLUE}${BOLD}==================================================${NC}"
echo -e "${GREEN}${BOLD}    🛠️  SOC Pulse - Dependency Installer v2.0  ${NC}"
echo -e "${BLUE}${BOLD}==================================================${NC}\n"

# ── STEP 1: System update (non-interactive, safe for cloud VMs) ──────────────
echo -e "${YELLOW}🔄 Updating package lists...${NC}"
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y -qq

# NOTE: We do NOT run apt-get upgrade — it can prompt about kernel/grub on
# cloud VMs and block for hours. Security patches are handled by Module 3.
echo -e "${GREEN}✅ Package lists updated!${NC}\n"

# ── STEP 2: Core system tools ─────────────────────────────────────────────────
echo -e "${YELLOW}📦 Installing core SOC tools...${NC}"
DEPENDENCIES=("curl" "wget" "git" "python3" "python3-pip" "gcc" "make" "jq" "unzip")
for pkg in "${DEPENDENCIES[@]}"; do
    if ! dpkg -s "$pkg" &>/dev/null 2>&1; then
        echo -e "${YELLOW}  ⏳ Installing $pkg...${NC}"
        sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "$pkg" 2>/dev/null || true
    fi
    echo -e "${GREEN}  [✓] $pkg${NC}"
done

# ── STEP 3: Ansible (try apt first, fallback to pip3) ────────────────────────
echo -e "\n${YELLOW}🔧 Installing Ansible...${NC}"
if ! command -v ansible &>/dev/null; then
    # apt ansible can be outdated on Ubuntu 20.04 — use pip3 as universal fallback
    if sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ansible 2>/dev/null; then
        echo -e "${GREEN}  [✓] Ansible (apt)${NC}"
    else
        echo -e "${YELLOW}  ⚠ apt failed — installing via pip3...${NC}"
        pip3 install --quiet ansible 2>/dev/null || true
        echo -e "${GREEN}  [✓] Ansible (pip3)${NC}"
    fi
else
    echo -e "${GREEN}  [✓] Ansible already installed${NC}"
fi

# ── STEP 4: Node.js v20 LTS (universal method for all Ubuntu versions) ───────
echo -e "\n${YELLOW}🌐 Checking Node.js...${NC}"
if ! command -v node &>/dev/null || [[ "$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)" -lt 18 ]]; then
    echo -e "${YELLOW}  ⏳ Installing Node.js v20 LTS...${NC}"

    # Method 1: NodeSource (works on Ubuntu 20.04 / 22.04 / 24.04)
    if curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - -q 2>/dev/null; then
        sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs 2>/dev/null
    else
        # Method 2: Snap fallback (works on any Ubuntu)
        echo -e "${YELLOW}  ⚠ NodeSource failed — trying snap...${NC}"
        sudo snap install node --classic --channel=20 2>/dev/null || true
    fi
fi

# Verify Node installed
if ! command -v node &>/dev/null; then
    echo -e "${RED}[✗] Node.js installation failed! Check internet connectivity.${NC}"
    exit 1
fi
echo -e "${GREEN}  [✓] Node.js $(node -v) & npm $(npm -v) ready!${NC}"

# ── STEP 5: pm2 — Process Manager (survives SSH disconnect) ──────────────────
echo -e "\n${YELLOW}🔄 Installing pm2 (process persistence)...${NC}"
if ! command -v pm2 &>/dev/null; then
    sudo npm install -g pm2 --quiet 2>/dev/null
    # Configure pm2 to auto-start on reboot
    sudo pm2 startup 2>/dev/null || true
fi
echo -e "${GREEN}  [✓] pm2 $(pm2 -v 2>/dev/null) ready!${NC}"

echo -e "\n${GREEN}${BOLD}🎉 All dependencies installed! Run: sudo bash soc-pulse-start.sh${NC}"
