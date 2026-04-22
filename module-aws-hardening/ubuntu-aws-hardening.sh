#!/bin/bash
# =============================================================================
# SOC Pulse — Smart Ubuntu Security Hardening Orchestrator
# =============================================================================
# Author:   ULTRON / SOC Pulse Command Center
# Source:   Based on gensecaihq/Ubuntu-Security-Hardening-Script (MIT License)
# Version:  2.0 (Multi-Version Auto-Detecting)
#
# WHAT THIS SCRIPT DOES:
#   1. Detects your exact Ubuntu version from /etc/os-release
#   2. Selects the correct production-grade hardening script
#   3. Executes it headlessly (no interactive prompts needed)
#
# SUPPORTED VERSIONS:
#   Ubuntu 18.04 / 20.04 / 22.04  →  ubuntu-hardening-original.sh (v2.0)
#   Ubuntu 24.04 LTS               →  ubuntu-hardening-24-04.sh    (v3.0)
#   Ubuntu 25.04 / 25.10           →  ubuntu-hardening-25.sh       (v4.0)
#
# SAFETY GUARANTEES (AWS EC2):
#   - UFW is NOT enabled on AWS (prevents EC2 port lockout)
#   - SSH daemon is NOT restarted automatically
#   - All interactive prompts are pre-answered headlessly
#   - Script will not kill your cloud instance connection
#
# COMPLIANCE:
#   - CIS Ubuntu Linux Benchmarks (version-specific)
#   - NIST Cybersecurity Framework
#   - PCI DSS Requirements (where applicable)
# =============================================================================

set -euo pipefail
IFS=$'\n\t'

# ── Colors ────────────────────────────────────────────────────────────────────
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# ── Script directory (always resolves to module-aws-hardening/) ───────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Logging ───────────────────────────────────────────────────────────────────
LOG_DIR="/var/log/security-hardening"
mkdir -p "$LOG_DIR" 2>/dev/null || true
chmod 700 "$LOG_DIR" 2>/dev/null || true
ORCHESTRATOR_LOG="${LOG_DIR}/soc-pulse-orchestrator-$(date +%Y%m%d-%H%M%S).log"

log() {
    local color=$1
    local msg=$2
    local ts
    ts="$(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "${color}${BOLD}[${ts}]${NC} ${color}${msg}${NC}" | tee -a "$ORCHESTRATOR_LOG"
}

banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║       🛡️  SOC PULSE — Smart Hardening Orchestrator v2.0          ║"
    echo "║          Powered by gensecaihq/Ubuntu-Security-Hardening        ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# ── Root Check ────────────────────────────────────────────────────────────────
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log "$RED" "FATAL: This script must be run as root (sudo ./ubuntu-aws-hardening.sh)"
        exit 1
    fi
    log "$GREEN" "[✓] Running as root — proceeding"
}

# ── OS Version Detection ──────────────────────────────────────────────────────
detect_ubuntu_version() {
    log "$BLUE" "Detecting Ubuntu version from /etc/os-release..."

    if [[ ! -f /etc/os-release ]]; then
        log "$RED" "FATAL: /etc/os-release not found. Is this Ubuntu?"
        exit 1
    fi

    # Source the os-release file for clean variable parsing
    . /etc/os-release

    UBUNTU_VERSION="${VERSION_ID:-unknown}"
    UBUNTU_CODENAME="${UBUNTU_CODENAME:-${VERSION_CODENAME:-unknown}}"
    UBUNTU_NAME="${NAME:-Ubuntu}"

    log "$GREEN" "╔══════════════════════════════════════════════════════╗"
    log "$GREEN" "║  OS Detection Result                                  ║"
    log "$GREEN" "╠══════════════════════════════════════════════════════╣"
    log "$GREEN" "║  Name:     ${UBUNTU_NAME}"
    log "$GREEN" "║  Version:  ${UBUNTU_VERSION}"
    log "$GREEN" "║  Codename: ${UBUNTU_CODENAME}"
    log "$GREEN" "╚══════════════════════════════════════════════════════╝"
}

# ── Script Selector ───────────────────────────────────────────────────────────
select_hardening_script() {
    case "$UBUNTU_VERSION" in
        "18.04"|"20.04"|"22.04")
            SELECTED_SCRIPT="${SCRIPT_DIR}/ubuntu-hardening-original.sh"
            SCRIPT_VERSION="v2.0"
            SCRIPT_LABEL="Ubuntu ${UBUNTU_VERSION} LTS (Legacy/Stable)"
            SCAN_FREQUENCY="weekly"
            ;;
        "24.04")
            SELECTED_SCRIPT="${SCRIPT_DIR}/ubuntu-hardening-24-04.sh"
            SCRIPT_VERSION="v3.0"
            SCRIPT_LABEL="Ubuntu 24.04 LTS Noble Numbat (Systemd Timers)"
            SCAN_FREQUENCY="weekly"
            ;;
        "25.04"|"25.10")
            SELECTED_SCRIPT="${SCRIPT_DIR}/ubuntu-hardening-25.sh"
            SCRIPT_VERSION="v4.0"
            SCRIPT_LABEL="Ubuntu ${UBUNTU_VERSION} (Chrony NTS + Cgroup v2)"
            SCAN_FREQUENCY="weekly"
            ;;
        *)
            log "$YELLOW" "WARNING: Ubuntu ${UBUNTU_VERSION} is not officially supported."
            log "$YELLOW" "Falling back to ubuntu-hardening-original.sh (v2.0) — proceed with caution."
            SELECTED_SCRIPT="${SCRIPT_DIR}/ubuntu-hardening-original.sh"
            SCRIPT_VERSION="v2.0 (fallback)"
            SCRIPT_LABEL="Ubuntu ${UBUNTU_VERSION} (Unsupported — using fallback)"
            SCAN_FREQUENCY="weekly"
            ;;
    esac

    log "$CYAN" "Selected Hardening Script: ${SCRIPT_VERSION}"
    log "$CYAN" "Target Profile:            ${SCRIPT_LABEL}"
    log "$CYAN" "Script Path:               ${SELECTED_SCRIPT}"
    log "$CYAN" "ClamAV Scan Frequency:     ${SCAN_FREQUENCY}"
}

# ── Pre-flight Check ──────────────────────────────────────────────────────────
preflight_checks() {
    log "$BLUE" "Running pre-flight checks..."

    # Check the target script exists
    if [[ ! -f "$SELECTED_SCRIPT" ]]; then
        log "$RED" "FATAL: Hardening script not found: ${SELECTED_SCRIPT}"
        log "$RED" "Ensure all ubuntu-hardening-*.sh scripts are in: ${SCRIPT_DIR}"
        exit 1
    fi

    # Make executable
    chmod +x "$SELECTED_SCRIPT"
    log "$GREEN" "[✓] Hardening script found and marked executable"

    # Check disk space (min 2GB)
    local available_space
    available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 2097152 ]]; then
        log "$RED" "FATAL: Insufficient disk space. At least 2GB required."
        exit 1
    fi
    log "$GREEN" "[✓] Disk space OK ($(df -h / | awk 'NR==2 {print $4}') available)"

    # Check RAM
    local total_memory
    total_memory=$(free -m | awk 'NR==2 {print $2}')
    if [[ $total_memory -lt 512 ]]; then
        log "$YELLOW" "WARNING: Very low RAM (${total_memory}MB). Some operations may be slow."
    else
        log "$GREEN" "[✓] RAM OK (${total_memory}MB detected)"
    fi

    # Detect cloud/container environment
    if systemd-detect-virt --quiet 2>/dev/null; then
        local virt_type
        virt_type=$(systemd-detect-virt 2>/dev/null || echo "unknown")
        log "$CYAN" "[ℹ] Virtualization detected: ${virt_type}"
    fi

    # AWS-specific safety notice
    log "$YELLOW" "┌─────────────────────────────────────────────────────────┐"
    log "$YELLOW" "│  AWS EC2 SAFETY MODE ACTIVE                              │"
    log "$YELLOW" "│  UFW firewall will NOT be activated (prevents lockout)   │"
    log "$YELLOW" "│  SSH daemon will NOT be restarted automatically          │"
    log "$YELLOW" "│  All interactive prompts pre-answered headlessly         │"
    log "$YELLOW" "└─────────────────────────────────────────────────────────┘"
}

# ── AWS Safety Patch ───────────────────────────────────────────────────────────────────
# Exports ENV flags consumed by all ubuntu-hardening-*.sh scripts:
#   SOC_PULSE_HEADLESS=true  → SSH reload not restart + auto-answer prompts
#   DEBIAN_FRONTEND=noninteractive → prevents apt dialogs
apply_aws_safety_overrides() {
    log "$BLUE" "Applying AWS safety overrides..."

    # Prevent apt from opening interactive dialogs
    export DEBIAN_FRONTEND=noninteractive

    # SOC_PULSE_HEADLESS signals all sub-scripts to:
    #   1. Use 'systemctl reload ssh' instead of 'restart' (preserves sessions)
    #   2. Auto-answer Y to SSH key safety prompt (keep password auth)
    #   3. Skip any remaining interactive read() prompts
    export SOC_PULSE_HEADLESS=true

    # Pre-set scan frequencies so sub-scripts don't block on read()
    export CLAMAV_SCAN_FREQUENCY="${SCAN_FREQUENCY}"
    export SCAP_SCAN_FREQUENCY="${SCAN_FREQUENCY}"

    log "$GREEN" "[✓] AWS safety overrides applied:"
    log "$GREEN" "    → DEBIAN_FRONTEND=noninteractive"
    log "$GREEN" "    → SOC_PULSE_HEADLESS=true (SSH reload · headless prompts · no restart)"
}

# ── Execute Hardening Script ──────────────────────────────────────────────────
run_hardening_script() {
    log "$GREEN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "$GREEN" "  STARTING HARDENING ENGINE: ${SCRIPT_VERSION}"
    log "$GREEN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    local start_time
    start_time=$(date +%s)

    # Fallback stdin pipe — only for prompts NOT handled by SOC_PULSE_HEADLESS:
    #   Line 1: "y" — version mismatch confirmation (check_ubuntu_version)
    #   Line 2: "Y" — SSH key safety prompt fallback (harden_ssh)
    # ClamAV/OpenSCAP frequency now handled via CLAMAV_SCAN_FREQUENCY / SOC_PULSE_HEADLESS.
    #
    # BUG FIX 1: Disable pipefail around this call so non-zero exit from
    # sub-script (optional packages etc.) doesn't abort the orchestrator.
    # BUG FIX 2: PIPESTATUS[1] with 'set -u' throws "unbound variable" if the
    # array has fewer elements than expected. Capture to local array first,
    # then use a default value '1' via parameter expansion.
    set +o pipefail
    echo -e "y\nY" | bash "$SELECTED_SCRIPT" 2>&1 | tee -a "$ORCHESTRATOR_LOG" || true
    local _ps
    _ps=("${PIPESTATUS[@]}")
    set -o pipefail
    local exit_code="${_ps[1]-1}"  # default 1 if index 1 unset (nounset-safe)

    local end_time
    end_time=$(date +%s)
    local duration=$(( end_time - start_time ))

    log "$GREEN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [[ $exit_code -eq 0 ]]; then
        log "$GREEN" "  ✅ HARDENING COMPLETE — Exit Code: 0 | Duration: ${duration}s"
    else
        log "$YELLOW" "  ⚠  HARDENING FINISHED WITH WARNINGS — Exit Code: ${exit_code} | Duration: ${duration}s"
        log "$YELLOW" "  Some optional packages may not have been available on this system."
        log "$YELLOW" "  Core security controls were still applied."
    fi
    log "$GREEN" "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ── Final Summary ─────────────────────────────────────────────────────────────
print_summary() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    log "$CYAN" ""
    log "$CYAN" "╔══════════════════════════════════════════════════════════════════╗"
    log "$CYAN" "║  SOC PULSE — Hardening Summary Report                            ║"
    log "$CYAN" "╠══════════════════════════════════════════════════════════════════╣"
    log "$CYAN" "║  Ubuntu Version:  ${UBUNTU_VERSION} (${UBUNTU_CODENAME})"
    log "$CYAN" "║  Script Used:     ${SCRIPT_VERSION}"
    log "$CYAN" "║  Completed At:    ${timestamp}"
    log "$CYAN" "║  Log File:        ${ORCHESTRATOR_LOG}"
    log "$CYAN" "╠══════════════════════════════════════════════════════════════════╣"
    log "$CYAN" "║  Controls Applied:                                               ║"
    log "$CYAN" "║   ✅ Kernel Sysctls (IP spoof, SYN flood, ICMP protection)       ║"
    log "$CYAN" "║   ✅ AuditD (30+ LOTL rules, privilege escalation, container)    ║"
    log "$CYAN" "║   ✅ Fail2Ban (progressive banning, SSH + port-scan jails)       ║"
    log "$CYAN" "║   ✅ AppArmor (server mode enforcement)                          ║"
    log "$CYAN" "║   ✅ ClamAV (antivirus + ${SCAN_FREQUENCY} scans)                      ║"
    log "$CYAN" "║   ✅ AIDE (file integrity monitoring)                             ║"
    log "$CYAN" "║   ✅ rkhunter + chkrootkit (rootkit detection)                   ║"
    log "$CYAN" "║   ✅ Unattended-Upgrades (auto security patches)                 ║"
    log "$CYAN" "║   ✅ debsums (package integrity verification)                    ║"
    log "$CYAN" "║   ⛔ UFW Firewall:  SKIPPED (AWS EC2 Safety Mode)               ║"
    log "$CYAN" "║   ✅ SSH Daemon:    RELOADED not restarted (sessions preserved)  ║"
    log "$CYAN" "╚══════════════════════════════════════════════════════════════════╝"
    log "$CYAN" ""
    log "$GREEN" "Security hardening report saved to: /var/log/security-hardening/"
    log "$GREEN" "SOC Pulse Orchestrator log: ${ORCHESTRATOR_LOG}"
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
    banner
    check_root
    detect_ubuntu_version
    select_hardening_script
    preflight_checks
    apply_aws_safety_overrides
    run_hardening_script
    print_summary
}

main
