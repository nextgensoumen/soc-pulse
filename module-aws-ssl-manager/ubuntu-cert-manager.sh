#!/bin/bash
# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  SOC PULSE — Machine IP Cryptography Engine v3.0                     ║
# ║  Powered by gensecaihq/LetsEncrypt-IP-SSL-Manager                   ║
# ║  Cloned source: github.com/gensecaihq/LetsEncrypt-IP-SSL-Manager     ║
# ║  Modes: --audit | --status | --integrity-check | --list | --force-renew║
# ╚═══════════════════════════════════════════════════════════════════════╝
# Exit codes (per API_REFERENCE.md from cloned repo):
#   0=success 1=general 2=bad-args 3=no-root 4=network
#   5=cert-error 6=config-error 7=dep-error 8=system-error 9=lock

set -euo pipefail

# ── Env vars (API_REFERENCE.md: Environment Variables section) ───────────
FORCE="${FORCE:-false}"       # skip confirmations
QUIET="${QUIET:-false}"       # suppress non-essential output
STAGING="${STAGING:-true}"    # IP certs are staging-only currently
DEBUG="${DEBUG:-false}"
[[ "$DEBUG" == "true" ]] && set -x

# ── SOC Pulse headless override ───────────────────────────────────────────
HEADLESS="${SOC_PULSE_HEADLESS:-false}"
[[ "$HEADLESS" == "true" ]] && FORCE="true"

# ── Mode dispatch ─────────────────────────────────────────────────────────
MODE="${1:---audit}"

# ── Colors ────────────────────────────────────────────────────────────────
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# ── Constants (from cloned script globals) ────────────────────────────────
readonly SCRIPT_VERSION="3.0.0"
readonly LOG_DIR="/var/log/letsencrypt-ip-manager"
readonly LOG_FILE="${LOG_DIR}/ip-certificate.log"
readonly AUDIT_LOG="${LOG_DIR}/audit.log"
readonly RENEWAL_LOG="${LOG_DIR}/renewal.log"
readonly CERT_BASE_PATH="/etc/letsencrypt"
readonly CERT_LIVE_PATH="${CERT_BASE_PATH}/live"
readonly CONFIG_FILE="/etc/letsencrypt-ip-manager/config.conf"
readonly BACKUP_DIR="/etc/letsencrypt-ip-manager/backup"
readonly CERTBOT_MIN_VERSION="2.0.0"
readonly CERT_VALIDITY_DAYS=6
readonly STAGING_ACME_URL="https://acme-staging-v02.api.letsencrypt.org/directory"
readonly RENEWAL_INTERVAL="0 */4 * * *"

START_TIME=$(date +%s)
ISSUES_FOUND=0
CERTBOT_OK=false

# ── Logging ───────────────────────────────────────────────────────────────
init_logging() {
    mkdir -p "$LOG_DIR" 2>/dev/null || true
    chmod 750 "$LOG_DIR" 2>/dev/null || true
    touch "$LOG_FILE" "$AUDIT_LOG" "$RENEWAL_LOG" 2>/dev/null || true
}

log() {
    local level="${1:-INFO}" msg="${2:-}"
    local ts; ts=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${ts}] [${level}] ${msg}" >> "$LOG_FILE" 2>/dev/null || true
    [[ "$QUIET" == "true" && "$level" == "INFO" ]] && return 0
    case "$level" in
        INFO)  echo -e "${GREEN}[✓]${NC} ${msg}" ;;
        WARN)  echo -e "${YELLOW}[⚠]${NC} ${msg}" ;;
        ERROR) echo -e "${RED}[✗]${NC} ${msg}"; ISSUES_FOUND=$((ISSUES_FOUND+1)) ;;
        AUDIT) echo -e "${CYAN}[ℹ]${NC} ${msg}" ;;
        DEBUG) [[ "$DEBUG" == "true" ]] && echo -e "${MAGENTA}[D]${NC} ${msg}" ;;
        *)     echo -e "${BLUE}[…]${NC} ${msg}" ;;
    esac
}

# ── Config loader (from cloned script load_config()) ──────────────────────
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        log DEBUG "Loading config from $CONFIG_FILE"
        # shellcheck disable=SC1090
        source "$CONFIG_FILE" 2>/dev/null || log WARN "Config file parse error"
    fi
}

# ── OS + network detection ────────────────────────────────────────────────
detect_os() {
    if [[ -f /etc/os-release ]]; then
        # shellcheck disable=SC1091
        . /etc/os-release
        OS_NAME="${NAME:-Linux}"
        OS_VERSION="${VERSION_ID:-}"
        OS_ARCH=$(uname -m)
    else
        OS_NAME="Linux"; OS_VERSION="Unknown"; OS_ARCH=$(uname -m)
    fi
    HOSTNAME_VAL=$(hostname -f 2>/dev/null || hostname)
    # Detect init system (from cloned script detect_init_system)
    if systemctl --version &>/dev/null 2>&1; then INIT_SYSTEM="systemd"
    elif command -v rc-service &>/dev/null; then INIT_SYSTEM="openrc"
    else INIT_SYSTEM="sysv"; fi

    PUBLIC_IP=$(curl -s -4 --connect-timeout 5 --max-time 8 icanhazip.com 2>/dev/null \
        || curl -s -4 --connect-timeout 5 --max-time 8 ifconfig.me 2>/dev/null \
        || echo "Unknown")
}

# ── IP validation (from cloned script validate_ip_address()) ─────────────
validate_ip() {
    local ip="$1"
    if [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
        IFS='.' read -ra o <<< "$ip"
        for part in "${o[@]}"; do [[ "$part" -le 255 ]] || return 1; done
        [[ "${o[0]}" == "10" ]] && return 1
        [[ "${o[0]}" == "127" ]] && return 1
        [[ "${o[0]}" == "172" && "${o[1]}" -ge 16 && "${o[1]}" -le 31 ]] && return 1
        [[ "${o[0]}" == "192" && "${o[1]}" == "168" ]] && return 1
        [[ "${o[0]}" == "169" && "${o[1]}" == "254" ]] && return 1
        return 0
    fi
    [[ "$ip" =~ ^[0-9a-fA-F:]+$ ]] && return 0
    return 1
}

# ── Version compare ───────────────────────────────────────────────────────
version_gte() { printf '%s\n%s' "$2" "$1" | sort -C -V; }

# ── Section: Dependencies ─────────────────────────────────────────────────
section_dependencies() {
    echo -e "\n${BOLD}━━ [1/8] Certbot & Dependencies ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    if command -v certbot &>/dev/null; then
        local ver; ver=$(certbot --version 2>&1 | grep -oP '\d+\.\d+\.\d+' | head -1 || echo "0.0.0")
        if version_gte "${ver}" "$CERTBOT_MIN_VERSION"; then
            log INFO "certbot v${ver} — meets v${CERTBOT_MIN_VERSION}+ requirement ✓"
            CERTBOT_OK=true
        else
            log WARN "certbot v${ver} — needs upgrade to v${CERTBOT_MIN_VERSION}+ for IP cert support"
        fi
    else
        log WARN "certbot: NOT INSTALLED (exit code 7)"
    fi
    for tool in openssl curl python3; do
        command -v "$tool" &>/dev/null && log INFO "${tool}: ✓" || log WARN "${tool}: missing"
    done
}

# ── Section: ACME Profiles ────────────────────────────────────────────────
section_acme_profiles() {
    echo -e "\n${BOLD}━━ [2/8] ACME Profile Support (shortlived for 6-day certs) ━━━━━━${NC}"
    if [[ "$CERTBOT_OK" == "true" ]]; then
        if certbot --help 2>&1 | grep -qi "profile"; then
            log INFO "ACME --preferred-profile flag: supported ✓"
        else
            log WARN "ACME profile flag not detected — update certbot"
        fi
        local env_tag; env_tag=$([[ "$STAGING" == "true" ]] && echo "STAGING" || echo "PRODUCTION")
        log AUDIT "ACME server: ${env_tag} → ${STAGING_ACME_URL}"
    else
        log WARN "ACME profile check skipped — certbot not ready"
    fi
}

# ── Section: Certificate Inventory ───────────────────────────────────────
section_certificates() {
    echo -e "\n${BOLD}━━ [3/8] Certificate Inventory ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    local cert_count=0 expiring=0 expired=0

    if [[ ! -d "$CERT_LIVE_PATH" ]]; then
        log WARN "No certificates directory at ${CERT_LIVE_PATH}"
        return 0
    fi

    for cert_dir in "$CERT_LIVE_PATH"/*/; do
        [[ -d "$cert_dir" ]] || continue
        local domain; domain=$(basename "$cert_dir")
        local cert_file="${cert_dir}cert.pem"
        [[ -f "$cert_file" ]] || continue
        cert_count=$((cert_count+1))

        local expiry; expiry=$(openssl x509 -noout -enddate -in "$cert_file" 2>/dev/null | cut -d= -f2 || echo "")
        local days_left=-999
        if [[ -n "$expiry" ]]; then
            local exp_epoch; exp_epoch=$(date -d "$expiry" +%s 2>/dev/null || echo 0)
            days_left=$(( (exp_epoch - $(date +%s)) / 86400 ))
        fi

        if   [[ $days_left -lt 0 ]];              then log ERROR "  [EXPIRED]  ${domain} — ${days_left#-}d ago"; expired=$((expired+1))
        elif [[ $days_left -le 1 ]];              then log ERROR "  [CRITICAL] ${domain} — ${days_left}d (renew NOW!)"; expiring=$((expiring+1))
        elif [[ $days_left -le $CERT_VALIDITY_DAYS ]]; then log WARN  "  [EXPIRING] ${domain} — ${days_left}d"; expiring=$((expiring+1))
        else                                            log INFO  "  [VALID]    ${domain} — ${days_left}d until ${expiry}"; fi
    done

    echo ""
    log INFO "Certificates found: ${cert_count} | Expiring: ${expiring} | Expired: ${expired}"
    [[ $cert_count -eq 0 ]] && log AUDIT "No certs yet — run certbot with --preferred-profile shortlived to issue IP cert"
}

# ── Section: Renewal System ───────────────────────────────────────────────
section_renewal() {
    echo -e "\n${BOLD}━━ [4/8] Auto-Renewal System (every 4h for 6-day certs) ━━━━━━━━${NC}"
    local ok=false

    if systemctl is-active --quiet certbot-ip-renew.timer 2>/dev/null; then
        log INFO "certbot-ip-renew.timer: ACTIVE ✓ (${INIT_SYSTEM})"
        ok=true
    elif systemctl list-unit-files certbot-ip-renew.timer &>/dev/null 2>&1; then
        log WARN "certbot-ip-renew.timer: exists but INACTIVE"
    else
        log WARN "certbot-ip-renew.timer: NOT CONFIGURED"
    fi

    if [[ -f /etc/cron.d/certbot-ip-renew ]]; then
        log INFO "cron /etc/cron.d/certbot-ip-renew: PRESENT ✓"
        ok=true
    else
        log WARN "cron fallback: /etc/cron.d/certbot-ip-renew — NOT CONFIGURED"
    fi

    systemctl is-active --quiet certbot.timer 2>/dev/null && { log INFO "certbot.timer (standard): ACTIVE ✓"; ok=true; }

    [[ "$ok" == "false" ]] && {
        log WARN "NO renewal mechanism configured"
        log AUDIT "Fix: echo '${RENEWAL_INTERVAL} root certbot renew --quiet' | sudo tee /etc/cron.d/certbot-ip-renew"
    }
}

# ── Section: Renewal Logs ─────────────────────────────────────────────────
section_renewal_logs() {
    echo -e "\n${BOLD}━━ [5/8] Recent Certificate Activity ━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    local found=false
    for lf in "/var/log/letsencrypt/letsencrypt.log" "$LOG_FILE" "$RENEWAL_LOG"; do
        if [[ -f "$lf" && -s "$lf" ]]; then
            echo -e "${CYAN}  → ${lf}${NC}"
            tail -5 "$lf" 2>/dev/null | sed 's/^/    /' || true
            found=true; break
        fi
    done
    [[ "$found" == "false" ]] && log WARN "No certbot activity logs — certbot not yet run on this host"
}

# ── Section: Network / Port 80 ────────────────────────────────────────────
section_network() {
    echo -e "\n${BOLD}━━ [6/8] Network & HTTP-01 Challenge Readiness ━━━━━━━━━━━━━━━━━${NC}"

    # In headless/audit mode: skip ALL network checks — any curl or ss call
    # can hang indefinitely on AWS due to DNS stalls or firewall drops.
    # This is an audit of local config only — live network checks are irrelevant.
    if [[ "${HEADLESS:-false}" == "true" ]]; then
        log INFO "ACME staging connectivity: skipped (headless audit mode)"
        log INFO "Public IP ${PUBLIC_IP:-Unknown}: fetched at startup"
        if ss -tlnp 2>/dev/null | grep -q ':80 '; then
            log INFO "Port 80: listening ✓"
        else
            log WARN "Port 80: nothing listening — certbot standalone needs port 80"
        fi
        log AUDIT "AWS: ensure Security Group inbound TCP:80 from 0.0.0.0/0 for HTTP-01 challenge"
        return 0
    fi

    # Connectivity to ACME staging (interactive mode only)
    if curl -s --connect-timeout 5 --max-time 8 "$STAGING_ACME_URL" &>/dev/null; then
        log INFO "ACME staging connectivity: ✓ reachable"
    else
        log WARN "ACME staging connectivity: FAILED (exit code 4)"
    fi

    # Public IP validation
    if validate_ip "${PUBLIC_IP:-}"; then
        log INFO "Public IP ${PUBLIC_IP}: valid public address ✓"
    else
        log WARN "Public IP ${PUBLIC_IP}: private/reserved — IP certs need a public IP"
    fi

    # Port 80
    if ss -tlnp 2>/dev/null | grep -q ':80 '; then
        local svc; svc=$(ss -tlnp 2>/dev/null | grep ':80 ' | awk '{print $7}' | head -1 || echo "service")
        log INFO "Port 80: listening ✓ (${svc})"
    else
        log WARN "Port 80: nothing listening — certbot standalone mode required for ACME challenge"
    fi

    log AUDIT "AWS: ensure Security Group inbound TCP:80 from 0.0.0.0/0 for HTTP-01 challenge"
}

# ── Section: Config & Backup ──────────────────────────────────────────────
section_config() {
    echo -e "\n${BOLD}━━ [7/8] Configuration & Backup Status ━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if [[ -f "$CONFIG_FILE" ]]; then
        log INFO "Config: ${CONFIG_FILE} ✓"
        # Show key values (from show_config in cloned script)
        grep -E '^(USER_EMAIL|USER_WEBROOT|AUTO_RENEWAL|LOG_LEVEL)' "$CONFIG_FILE" 2>/dev/null | sed 's/^/    /' || true
    else
        log WARN "Config: ${CONFIG_FILE} — not created yet (run --configure)"
    fi

    if [[ -d "$BACKUP_DIR" ]]; then
        local bcount; bcount=$(ls -1 "$BACKUP_DIR"/*.backup 2>/dev/null | wc -l || echo 0)
        log INFO "Backups: ${BACKUP_DIR} — ${bcount} backup(s) found"
    else
        log WARN "Backup dir: ${BACKUP_DIR} — not initialized"
    fi
}

# ── Section: Installation Guide ───────────────────────────────────────────
section_install_guide() {
    echo -e "\n${BOLD}━━ [8/8] Certbot Installation & Issuance Guide ━━━━━━━━━━━━━━━━━${NC}"
    if [[ "$CERTBOT_OK" == "false" ]]; then
        echo -e "${YELLOW}  Certbot v${CERTBOT_MIN_VERSION}+ required. Install via snap (recommended):${NC}"
        echo -e "${CYAN}"
        echo "    sudo apt update && sudo apt install -y snapd"
        echo "    sudo snap install --classic certbot"
        echo "    sudo ln -sf /snap/bin/certbot /usr/bin/certbot"
        echo -e "${NC}"
    fi
    echo -e "${YELLOW}  Issue a 6-day IP certificate (staging environment):${NC}"
    echo -e "${CYAN}"
    echo "    sudo certbot certonly --standalone \\"
    echo "        --server ${STAGING_ACME_URL} \\"
    echo "        --preferred-profile shortlived \\"
    echo "        --agree-tos --no-eff-email \\"
    echo "        -d ${PUBLIC_IP:-YOUR_PUBLIC_IP} -m your@email.com"
    echo ""
    echo "    # Setup 4-hour renewal (critical for 6-day certs):"
    echo "    echo '${RENEWAL_INTERVAL} root certbot renew --quiet' | sudo tee /etc/cron.d/certbot-ip-renew"
    echo -e "${NC}"
    log AUDIT "Ansible fleet scanning available: research/CVE-2024-3094-Vulnerability-Checker-Fixer/ansible/"
}

# ── --integrity-check (from API_REFERENCE.md) ─────────────────────────────
run_integrity_check() {
    echo -e "\n${BOLD}━━ Integrity Check ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    local issues=0

    # Config file validity
    if [[ -f "$CONFIG_FILE" ]]; then
        source "$CONFIG_FILE" 2>/dev/null && log INFO "Config file: valid ✓" || { log ERROR "Config file: CORRUPTED"; issues=$((issues+1)); }
    else
        log WARN "Config file: missing"; issues=$((issues+1))
    fi

    # Log dir writable
    if [[ -w "$LOG_DIR" ]]; then log INFO "Log directory: writable ✓"
    else log ERROR "Log directory: NOT writable"; issues=$((issues+1)); fi

    # Cert dir readable
    if [[ -d "$CERT_BASE_PATH" ]]; then
        [[ -r "$CERT_BASE_PATH" ]] && log INFO "Cert directory: readable ✓" || { log ERROR "Cert directory: NOT readable"; issues=$((issues+1)); }
    fi

    # Certbot
    [[ "$CERTBOT_OK" == "true" ]] && log INFO "Certbot: ✓" || { log ERROR "Certbot: missing/outdated"; issues=$((issues+1)); }

    # Network
    curl -s --connect-timeout 3 --max-time 6 "$STAGING_ACME_URL" &>/dev/null && log INFO "Network/ACME: ✓" || { log WARN "Network/ACME: unreachable"; issues=$((issues+1)); }

    echo ""
    if [[ $issues -eq 0 ]]; then
        log INFO "Integrity check PASSED — 0 issues"
    else
        log WARN "Integrity check found ${issues} issue(s) — exit code: ${issues}"
    fi
    # Exit code = number of issues (0-99 per API_REFERENCE.md)
    exit $issues
}

# ── --force-renew (from API_REFERENCE.md) ─────────────────────────────────
run_force_renew() {
    echo -e "\n${BOLD}━━ Force Renewal ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    if [[ $EUID -ne 0 ]]; then log ERROR "Root required for renewal (exit code 3)"; exit 3; fi
    if [[ "$CERTBOT_OK" != "true" ]]; then log ERROR "Certbot not ready (exit code 7)"; exit 7; fi
    log AUDIT "Force-renewing all certificates (bypasses expiry window)"
    certbot renew --force-renewal \
        --server "$STAGING_ACME_URL" \
        --preferred-profile shortlived \
        --quiet && log INFO "Force renewal complete ✓" || { log ERROR "Force renewal failed (exit code 5)"; exit 5; }
}

# ── --list (from API_REFERENCE.md) ────────────────────────────────────────
run_list() {
    echo -e "\n${BOLD}━━ IP Certificate Status Report ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    section_certificates
}

# ── --status (8-section from API_REFERENCE.md --status description) ───────
run_status() {
    print_banner
    detect_os
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Host:   ${HOSTNAME_VAL}"
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} OS:     ${OS_NAME} ${OS_VERSION} (${OS_ARCH})"
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Init:   ${INIT_SYSTEM}"
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} IP:     ${PUBLIC_IP}"
    section_dependencies
    section_acme_profiles
    section_certificates
    section_renewal
    section_renewal_logs
    section_network
    section_config
    section_install_guide
    print_summary
}

# ── --audit (default SOC Pulse mode) ──────────────────────────────────────
run_audit() {
    print_banner
    detect_os
    load_config
    echo -e "${YELLOW}${BOLD}[AWS SAFETY] Read-only audit mode. No certificates issued or modified.${NC}"
    echo ""
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Host:   ${HOSTNAME_VAL}"
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} OS:     ${OS_NAME} ${OS_VERSION}"
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} IP:     ${PUBLIC_IP}"
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Init:   ${INIT_SYSTEM}"
    section_dependencies
    section_acme_profiles
    section_certificates
    section_renewal
    section_renewal_logs
    section_network
    section_config
    section_install_guide
    print_summary
}

# ── Banner ────────────────────────────────────────────────────────────────
print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║   🔑  SOC PULSE — Machine IP Cryptography Engine v${SCRIPT_VERSION}          ║"
    echo "║       Powered by gensecaihq/LetsEncrypt-IP-SSL-Manager              ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# ── Summary ───────────────────────────────────────────────────────────────
print_summary() {
    local end_time; end_time=$(date +%s)
    local dur=$(( end_time - START_TIME ))
    local ts; ts=$(date '+%Y-%m-%d %H:%M:%S')
    echo ""
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║  SOC PULSE — Machine IP Cryptography Summary                     ║"
    echo "╠══════════════════════════════════════════════════════════════════╣"
    printf "║  %-28s %-35s ║\n" "Host:"       "${HOSTNAME_VAL:-$(hostname)}"
    printf "║  %-28s %-35s ║\n" "Public IP:"  "${PUBLIC_IP:-Unknown}"
    printf "║  %-28s %-35s ║\n" "Certbot Ready:" "${CERTBOT_OK}"
    printf "║  %-28s %-35s ║\n" "Cert Validity:" "${CERT_VALIDITY_DAYS}-day shortlived (staging)"
    printf "║  %-28s %-35s ║\n" "Renewal Cadence:" "Every 4h (0 */4 * * *)"
    printf "║  %-28s %-35s ║\n" "Issues Detected:" "${ISSUES_FOUND}"
    printf "║  %-28s %-35s ║\n" "Completed At:" "${ts}"
    printf "║  %-28s %-35s ║\n" "Duration:" "${dur}s"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${CYAN}  Log: ${LOG_FILE}${NC}"
    log AUDIT "SOC Pulse Module 5 — IP Cryptography audit complete | Issues: ${ISSUES_FOUND}"
    echo -e "\n${GREEN}${BOLD}[✓] Module 5 completed. Exit code: ${ISSUES_FOUND}${NC}"
}

# ── Main dispatch ─────────────────────────────────────────────────────────
main() {
    init_logging

    case "$MODE" in
        --audit|-a|"")
            run_audit ;;
        --status|-s)
            run_status ;;
        --integrity-check|--integrity)
            detect_os; section_dependencies; run_integrity_check ;;
        --list|-l)
            detect_os; run_list ;;
        --force-renew|--force)
            detect_os; section_dependencies; run_force_renew ;;
        --help|-h)
            echo "Usage: $0 [--audit|--status|--integrity-check|--list|--force-renew]"
            echo "Env:   FORCE=true QUIET=true STAGING=true DEBUG=true SOC_PULSE_HEADLESS=true"
            exit 0 ;;
        --version|-v)
            echo "SOC Pulse IP Cryptography Engine v${SCRIPT_VERSION}"; exit 0 ;;
        *)
            echo "Unknown mode: $MODE. Use --help"; exit 2 ;;
    esac
}

main "$@"
