#!/bin/bash

# SOC Pulse Master Startup Script
# This script prepares the environment, installs dependencies, and launches the SOC dashboard.

echo "=================================================="
echo "    🛡️  Starting SOC Pulse Command Center 🛡️     "
echo "=================================================="

# 1. Check Prerequisites
echo "[*] Checking system requirements..."

if ! command -v node &> /dev/null; then
    echo "[!] Error: Node.js is not installed."
    echo "    Please install Node.js (v18+) to run the dashboard."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "[!] Error: npm is not installed."
    echo "    Please install npm to run the dashboard."
    exit 1
fi

echo "[✓] Node.js and npm are installed."

# 2. Setup Dashboard
echo "[*] Preparing the Web Dashboard..."
cd dashboard || { echo "[!] Error: dashboard directory not found."; exit 1; }

echo "[*] Installing frontend dependencies (this may take a minute on first run)..."
npm install --silent

# 3. Launch Application
echo "=================================================="
echo "[✓] Setup Complete."
echo "[*] Launching SOC Pulse Dashboard on http://localhost:5173"
echo "=================================================="

# Run the dev server and bind to all network interfaces (so it works on remote Ubuntu servers)
npm run dev -- --host 0.0.0.0
