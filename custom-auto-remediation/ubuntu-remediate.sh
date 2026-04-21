#!/bin/bash
# SOC Pulse - Custom Auto-Remediation Script (Ubuntu Optimized)
# This module specifically targets CVE-2024-3094 and is stripped of non-Ubuntu code for reliability.

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${YELLOW}${BOLD}🔍 Scanning for CVE-2024-3094 (xz-utils backdoor)...${NC}"

# Define constants
VULNERABLE_VERSIONS=("5.6.0" "5.6.1")
STABLE_VERSION="5.4.6"
STABLE_VERSION_URL="https://excellmedia.dl.sourceforge.net/project/lzmautils/xz-5.4.6.tar.bz2"

# Get current installed version safely via apt-cache
CURRENT_VERSION=$(apt-cache policy xz-utils | grep 'Installed:' | awk '{print $2}')

if [ -z "$CURRENT_VERSION" ]; then
    echo -e "${GREEN}[✓] xz-utils is not installed. You are safe!${NC}"
    exit 0
fi

echo "Current xz-utils version: $CURRENT_VERSION"

# Check if version is inside the vulnerable array
IS_VULNERABLE=0
for v in "${VULNERABLE_VERSIONS[@]}"; do
    if [[ "$CURRENT_VERSION" == *"$v"* ]]; then
        IS_VULNERABLE=1
        break
    fi
done

if [ $IS_VULNERABLE -eq 1 ]; then
    echo -e "${RED}[!] CRITICAL VULNERABILITY DETECTED: xz-utils $CURRENT_VERSION is infected!${NC}"
    echo -e "${YELLOW}Attempting immediate auto-remediation via apt-get upgrade...${NC}"
    
    sudo apt-get update && sudo apt-get install -y xz-utils
    
    # Re-verify
    NEW_VERSION=$(apt-cache policy xz-utils | grep 'Installed:' | awk '{print $2}')
    
    # Check if the upgrade successfully escaped the vulnerable window
    IS_VULNERABLE_STILL=0
    for v in "${VULNERABLE_VERSIONS[@]}"; do
        if [[ "$NEW_VERSION" == *"$v"* ]]; then
            IS_VULNERABLE_STILL=1
            break
        fi
    done
    
    if [ $IS_VULNERABLE_STILL -eq 1 ]; then
        echo -e "${RED}[!] APT Upgrade failed to patch the vulnerability. Compiling safe fallback version (${STABLE_VERSION})...${NC}"
        
        # Fallback to source compilation
        wget -q $STABLE_VERSION_URL -O "xz-$STABLE_VERSION.tar.bz2"
        tar -xjf "xz-$STABLE_VERSION.tar.bz2"
        cd "xz-$STABLE_VERSION" || exit 1
        ./configure && make && sudo make install
        
        echo -e "${GREEN}[✓] Safe version $STABLE_VERSION forced via compilation. REBOOT REQUIRED.${NC}"
    else
        echo -e "${GREEN}[✓] Successfully mitigated! xz-utils is now $NEW_VERSION.${NC}"
    fi
else
    echo -e "${GREEN}[✓] System is safe. No vulnerable versions of xz-utils detected.${NC}"
fi
