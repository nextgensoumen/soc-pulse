#!/bin/bash

# SOC Pulse Master Startup Script
# This script performs full system updates, installs all required SOC dependencies, and launches the dashboard.

echo "=================================================="
echo "    🛡️  Starting SOC Pulse Command Center 🛡️     "
echo "=================================================="

# Ensure script can use sudo
if ! command -v sudo &> /dev/null; then
    echo "[!] 'sudo' is required but not installed. Please run as root or install sudo."
    exit 1
fi

echo ""
echo "[*] Phase 1: Full System Update & Upgrade..."
echo "Updating package lists and upgrading existing packages..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get autoremove -y

echo ""
echo "[*] Phase 2: Core SOC Dependency Checks..."
echo "Checking dependencies required by the 5 SOC modules (Ansible, Python, Compilers, etc.)..."

# List of standard package dependencies needed by the SOC Platform components
DEPENDENCIES=("curl" "wget" "git" "python3" "python3-pip" "gcc" "make" "ansible")

for pkg in "${DEPENDENCIES[@]}"; do
    if dpkg -s "$pkg" &> /dev/null; then
        echo "  [✓] $pkg is already installed."
    else
        echo "  [!] $pkg is missing. Downloading and installing..."
        sudo apt-get install -y "$pkg"
    fi
done

echo ""
echo "[*] Phase 3: Node.js & Web Dashboard Environment..."

if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "  [!] Node.js or npm is missing."
    echo "  [*] Downloading NodeSource PPA and installing Node.js (v20)..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Final check
    if ! command -v node &> /dev/null; then
        echo "  [!] Error: Auto-installation failed. Please install Node.js manually."
        exit 1
    fi
else
    echo "  [✓] Node.js ($(node -v)) and npm ($(npm -v)) are already installed."
fi

# Setup Dashboard
echo ""
echo "=================================================="
echo "[*] Phase 4: Preparing the Command Center..."
cd dashboard || { echo "[!] Error: dashboard directory not found."; exit 1; }

echo "[*] Installing frontend dependencies (this may take a minute on first run)..."
npm install --silent

# Launch Application
echo ""
echo "=================================================="
echo "[✓] Setup Complete. All system dependencies verified and updated."
echo "[*] Launching SOC Pulse Dashboard on http://localhost:5173"
echo "=================================================="

# Run the dev server and bind to all network interfaces
npm run dev -- --host 0.0.0.0
