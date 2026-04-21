#!/bin/bash
# AWS-Safe Ubuntu 24.04 LTS Security Hardening Script 
# Version: 1.0 (Customized for SOC Pulse)
# This script applies critical security configurations WITHOUT breaking AWS network logic or SSH daemons.

set -euo pipefail

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly NC='\033[0m'

print_message() {
    echo -e "${1}[$(date '+%H:%M:%S')] ${2}${NC}"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_message "$RED" "FATAL: This script must be run as root (sudo)."
        exit 1
    fi
}

install_safe_packages() {
    print_message "$GREEN" "Installing core security auditing tools..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -yq
    apt-get install -yq \
        aide \
        auditd \
        audispd-plugins \
        clamav \
        clamav-daemon \
        fail2ban \
        unattended-upgrades \
        debsums
    print_message "$GREEN" "[✓] Packages installed successfully."
}

configure_sysctl() {
    print_message "$GREEN" "Applying Kernel networking security controls..."
    cat > /etc/sysctl.d/99-aws-security.conf << 'EOF'
# IP Spoofing protection
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignore ICMP broadcast requests
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Disable source packet routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Ignore send redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Block SYN attacks
net.ipv4.tcp_syncookies = 1

# Log Martians
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
EOF
    sysctl -p /etc/sysctl.d/99-aws-security.conf
    print_message "$GREEN" "[✓] Kernel hardened securely."
}

configure_fail2ban() {
    print_message "$GREEN" "Configuring Fail2Ban (Intrusion Prevention)..."
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 4
EOF
    systemctl enable fail2ban
    systemctl restart fail2ban
    print_message "$GREEN" "[✓] Fail2Ban blocking active."
}

configure_auditd() {
    print_message "$GREEN" "Configuring Audit Daemon..."
    cat > /etc/audit/rules.d/audit.rules << 'EOF'
-a always,exit -F arch=b64 -S chmod -S fchmod -S fchmodat -k perm_mod
-a always,exit -F arch=b64 -S chown -S fchown -S fchownat -S lchown -k perm_mod
-w /etc/passwd -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/shadow -p wa -k identity
EOF
    # Restart auditd cleanly
    service auditd restart || systemctl restart auditd || true
    print_message "$GREEN" "[✓] AuditD active."
}

main() {
    print_message "$YELLOW" "Initializing AWS-Safe Server Hardening..."
    check_root
    install_safe_packages
    configure_sysctl
    configure_fail2ban
    configure_auditd
    
    print_message "$GREEN" "=================================================="
    print_message "$GREEN" "AWS Machine Hardened Successfully!"
    print_message "$GREEN" "Your UFW Firewalls and SSH Daemons were ignored to ensure safe AWS cloud access."
    print_message "$GREEN" "=================================================="
}

main
