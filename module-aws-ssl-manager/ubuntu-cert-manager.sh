#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  SOC PULSE — Machine IP Cryptography Engine v3.0                    ║
# ║  Powered by gensecaihq/LetsEncrypt-IP-SSL-Manager                  ║
# ║  Features: IP cert audit · 6-day renewal · certbot validation       ║
# ╚══════════════════════════════════════════════════════════════════════╝
# AWS-Safe · Headless · Non-interactive · SOC Pulse integrated

set -euo pipefail

# ── Color codes ───────────────────────────────────────────────────────
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# ── Script metadata ───────────────────────────────────────────────────
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

# ── Headless mode (SOC Pulse orchestrator) ────────────────────────────
HEADLESS="${SOC_PULSE_HEADLESS:-false}"
START_TIME=$(date +%s)

# ── Logging setup ─────────────────────────────────────────────────────
init_logging() {
    mkdir -p "$LOG_DIR" 2>/dev/null || true
    chmod 750 "$LOG_DIR" 2>/dev/null || true
    touch "$LOG_FILE" "$AUDIT_LOG" "$RENEWAL_LOG" 2>/dev/null || true
}

log() {
    local level="${1:-INFO}" msg="${2:-}"
    local ts; ts=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${ts}] [${level}] ${msg}" >> "$LOG_FILE" 2>/dev/null || true
    case "$level" in
        INFO)  echo -e "${GREEN}[✓]${NC} ${msg}" ;;
        WARN)  echo -e "${YELLOW}[⚠]${NC} ${msg}" ;;
        ERROR) echo -e "${RED}[✗]${NC} ${msg}" ;;
        AUDIT) echo -e "${CYAN}[ℹ]${NC} ${msg}" ;;
        *)     echo -e "${BLUE}[…]${NC} ${msg}" ;;
    esac
}

# ── OS Detection ──────────────────────────────────────────────────────
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS_NAME="${NAME:-Unknown}"
        OS_VERSION="${VERSION_ID:-}"
    else
        OS_NAME="Linux"; OS_VERSION="Unknown"
    fi
    HOSTNAME_VAL=$(hostname -f 2>/dev/null || hostname)
    PUBLIC_IP=$(curl -s -4 --connect-timeout 5 icanhazip.com 2>/dev/null \
        || curl -s -4 --connect-timeout 5 ifconfig.me 2>/dev/null \
        || echo "Unknown")
}

# ── IP Validation ─────────────────────────────────────────────────────
validate_ip() {
    local ip="$1"
    # IPv4
    if [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
        IFS='.' read -ra o <<< "$ip"
        for part in "${o[@]}"; do [[ "$part" -le 255 ]] || return 1; done
        # Reject private/reserved
        [[ "${o[0]}" == "10" ]] && return 1
        [[ "${o[0]}" == "127" ]] && return 1
        [[ "${o[0]}" == "172" && "${o[1]}" -ge 16 && "${o[1]}" -le 31 ]] && return 1
        [[ "${o[0]}" == "192" && "${o[1]}" == "168" ]] && return 1
        [[ "${o[0]}" == "169" && "${o[1]}" == "254" ]] && return 1
        return 0
    fi
    # IPv6 basic check
    [[ "$ip" =~ ^[0-9a-fA-F:]+$ ]] && return 0
    return 1
}

# ── Version comparison ────────────────────────────────────────────────
version_gte() {
    printf '%s\n%s' "$2" "$1" | sort -C -V
}

# ── Certbot dependency audit ──────────────────────────────────────────
audit_certbot() {
    echo -e "\n${BOLD}━━ Certbot & Dependencies ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if command -v certbot &>/dev/null; then
        local ver; ver=$(certbot --version 2>&1 | grep -oP '\d+\.\d+\.\d+' | head -1)
        if version_gte "${ver:-0.0.0}" "$CERTBOT_MIN_VERSION"; then
            log INFO "certbot: v${ver} (meets minimum v${CERTBOT_MIN_VERSION} ✓)"
            CERTBOT_OK=true
        else
            log WARN "certbot: v${ver} — needs upgrade to v${CERTBOT_MIN_VERSION}+ for IP certificate support"
            CERTBOT_OK=false
        fi
    else
        log WARN "certbot: NOT INSTALLED — IP certificates require certbot v${CERTBOT_MIN_VERSION}+"
        CERTBOT_OK=false
    fi

    if command -v openssl &>/dev/null; then
        local ssl_ver; ssl_ver=$(openssl version | awk '{print $2}')
        log INFO "openssl: v${ssl_ver} ✓"
    else
        log WARN "openssl: not found"
    fi

    for tool in curl python3; do
        if command -v "$tool" &>/dev/null; then
            log INFO "${tool}: ✓ available"
        else
            log WARN "${tool}: not found"
        fi
    done
}

# ── ACME Profile check ────────────────────────────────────────────────
check_acme_profiles() {
    echo -e "\n${BOLD}━━ ACME Profile Support ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    if [[ "${CERTBOT_OK:-false}" == "true" ]]; then
        # Test if shortlived profile is accepted by certbot
        if certbot --help 2>&1 | grep -qi "profile\|acme-profile"; then
            log INFO "ACME profile flag: supported ✓ (shortlived profile available for 6-day IP certs)"
        else
            log WARN "ACME profile flag: not detected — update certbot for IP cert support"
        fi
        log AUDIT "Staging ACME: ${STAGING_ACME_URL}"
    else
        log WARN "ACME profile check skipped — certbot not installed/outdated"
    fi
}

# ── Certificate inventory ─────────────────────────────────────────────
audit_certificates() {
    echo -e "\n${BOLD}━━ Certificate Inventory ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    local cert_count=0 expiring_count=0 expired_count=0

    if [[ ! -d "$CERT_LIVE_PATH" ]]; then
        log WARN "No certificates found at ${CERT_LIVE_PATH}"
        log AUDIT "Run certbot to issue your first certificate"
        return 0
    fi

    for cert_dir in "$CERT_LIVE_PATH"/*/; do
        [[ -d "$cert_dir" ]] || continue
        local domain; domain=$(basename "$cert_dir")
        local cert_file="${cert_dir}cert.pem"
        [[ -f "$cert_file" ]] || continue

        cert_count=$((cert_count + 1))
        local expiry; expiry=$(openssl x509 -noout -enddate -in "$cert_file" 2>/dev/null | cut -d= -f2)
        local expiry_epoch; expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry" +%s 2>/dev/null || echo 0)
        local now_epoch; now_epoch=$(date +%s)
        local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

        if [[ $days_left -lt 0 ]]; then
            log ERROR "  [EXPIRED]  ${domain} — expired ${days_left#-} days ago"
            expired_count=$((expired_count + 1))
        elif [[ $days_left -le 2 ]]; then
            log WARN  "  [CRITICAL] ${domain} — expires in ${days_left}d (renewal required NOW)"
            expiring_count=$((expiring_count + 1))
        elif [[ $days_left -le $CERT_VALIDITY_DAYS ]]; then
            log WARN  "  [EXPIRING] ${domain} — expires in ${days_left}d"
            expiring_count=$((expiring_count + 1))
        else
            log INFO  "  [VALID]    ${domain} — ${days_left}d remaining (until ${expiry})"
        fi
    done

    echo ""
    log INFO "Total certificates found: ${cert_count}"
    [[ $expiring_count -gt 0 ]] && log WARN "${expiring_count} certificate(s) expiring soon"
    [[ $expired_count -gt 0 ]]  && log ERROR "${expired_count} certificate(s) EXPIRED"
    [[ $cert_count -eq 0 ]]     && log AUDIT "No active certificates — use certbot to issue IP certificates"
}

# ── Renewal system audit ──────────────────────────────────────────────
audit_renewal() {
    echo -e "\n${BOLD}━━ Auto-Renewal System (Critical for 6-day certs) ━━━━━━━━━━━━━${NC}"

    local renewal_ok=false

    # Check systemd timer
    if systemctl is-active --quiet certbot-ip-renew.timer 2>/dev/null; then
        log INFO "Systemd timer: certbot-ip-renew.timer — ACTIVE ✓"
        systemctl status certbot-ip-renew.timer --no-pager -l 2>/dev/null | tail -5 | sed 's/^/    /' || true
        renewal_ok=true
    elif systemctl list-unit-files certbot-ip-renew.timer &>/dev/null 2>&1; then
        log WARN "Systemd timer: certbot-ip-renew.timer — EXISTS but NOT ACTIVE"
    else
        log WARN "Systemd timer: certbot-ip-renew.timer — NOT CONFIGURED"
    fi

    # Check cron
    if [[ -f /etc/cron.d/certbot-ip-renew ]]; then
        log INFO "Cron job: /etc/cron.d/certbot-ip-renew — PRESENT ✓"
        renewal_ok=true
    else
        log WARN "Cron job: /etc/cron.d/certbot-ip-renew — NOT CONFIGURED"
    fi

    # Check standard certbot renewal timer
    if systemctl is-active --quiet certbot.timer 2>/dev/null; then
        log INFO "Standard certbot.timer: ACTIVE ✓"
        renewal_ok=true
    fi

    if [[ "$renewal_ok" == "false" ]]; then
        log WARN "NO renewal mechanism configured — 6-day IP certs will expire without automation"
        log AUDIT "Recommendation: configure renewal every 4 hours (cron: 0 */4 * * *)"
    fi
}

# ── Certbot renewal log tail ──────────────────────────────────────────
audit_renewal_logs() {
    echo -e "\n${BOLD}━━ Recent Certificate Activity ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    for logf in "/var/log/letsencrypt/letsencrypt.log" "$LOG_FILE" "$RENEWAL_LOG"; do
        if [[ -f "$logf" && -s "$logf" ]]; then
            echo -e "${CYAN}  → ${logf}${NC}"
            tail -5 "$logf" 2>/dev/null | sed 's/^/    /' || true
            break
        fi
    done

    if [[ ! -f /var/log/letsencrypt/letsencrypt.log ]]; then
        log WARN "No certbot activity logs found — certbot not yet run on this host"
    fi
}

# ── Port 80 accessibility check ───────────────────────────────────────
check_http_challenge() {
    echo -e "\n${BOLD}━━ HTTP-01 Challenge Readiness (Port 80) ━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Check if something is listening on port 80
    if ss -tlnp 2>/dev/null | grep -q ':80 '; then
        local svc; svc=$(ss -tlnp 2>/dev/null | grep ':80 ' | awk '{print $7}' | head -1)
        log INFO "Port 80: listening ✓ (${svc:-unknown service})"
    elif netstat -tlnp 2>/dev/null | grep -q ':80 '; then
        log INFO "Port 80: listening ✓"
    else
        log WARN "Port 80: nothing listening — certbot standalone mode will work, but webroot mode needs a web server"
    fi

    # AWS Security Group hint
    log AUDIT "AWS note: ensure Security Group inbound rule allows TCP:80 from 0.0.0.0/0 for ACME challenge"
}

# ── Installation recommendation ───────────────────────────────────────
print_installation_guide() {
    if [[ "${CERTBOT_OK:-false}" == "false" ]]; then
        echo -e "\n${BOLD}━━ Certbot Installation Guide ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}  To enable IP certificate support, install certbot v${CERTBOT_MIN_VERSION}+:${NC}"
        echo -e "${CYAN}"
        echo "    # Ubuntu/Debian (recommended — snap version has IP cert support):"
        echo "    sudo apt update && sudo apt install -y snapd"
        echo "    sudo snap install --classic certbot"
        echo "    sudo ln -sf /snap/bin/certbot /usr/bin/certbot"
        echo ""
        echo "    # Then issue a 6-day IP certificate (staging):"
        echo "    sudo certbot certonly --standalone \\"
        echo "        --server ${STAGING_ACME_URL} \\"
        echo "        --agree-tos --no-eff-email \\"
        echo "        --preferred-profile shortlived \\"
        echo "        -d \${PUBLIC_IP} -m your@email.com"
        echo -e "${NC}"
    fi
}

# ── Summary box ───────────────────────────────────────────────────────
print_summary() {
    local end_time; end_time=$(date +%s)
    local duration=$(( end_time - START_TIME ))
    local ts; ts=$(date '+%Y-%m-%d %H:%M:%S')

    echo ""
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║  SOC PULSE — Machine IP Cryptography Report                      ║"
    echo "╠══════════════════════════════════════════════════════════════════╣"
    printf "║  %-30s %-33s ║\n" "Host:"       "${HOSTNAME_VAL:-$(hostname)}"
    printf "║  %-30s %-33s ║\n" "OS:"         "${OS_NAME:-Linux} ${OS_VERSION:-}"
    printf "║  %-30s %-33s ║\n" "Public IP:"  "${PUBLIC_IP:-Unknown}"
    printf "║  %-30s %-33s ║\n" "Completed:"  "${ts}"
    printf "║  %-30s %-33s ║\n" "Engine:"     "LetsEncrypt-IP-SSL-Manager v${SCRIPT_VERSION}"
    echo "╠══════════════════════════════════════════════════════════════════╣"
    printf "║  %-30s %-33s ║\n" "Certbot Ready:" "${CERTBOT_OK:-false}"
    printf "║  %-30s %-33s ║\n" "Cert validity:" "${CERT_VALIDITY_DAYS}-day (shortlived profile)"
    printf "║  %-30s %-33s ║\n" "Renewal cadence:" "Every 4 hours (aggressive for 6d certs)"
    printf "║  %-30s %-33s ║\n" "ACME server:" "Staging (production rollout 2025)"
    printf "║  %-30s %-33s ║\n" "Duration:"   "${duration}s"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${CYAN}  Log: ${LOG_FILE}${NC}"
}

# ── Banner ────────────────────────────────────────────────────────────
print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║   🔑  SOC PULSE — Machine IP Cryptography Engine v${SCRIPT_VERSION}          ║"
    echo "║       Powered by gensecaihq/LetsEncrypt-IP-SSL-Manager              ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${YELLOW}${BOLD}[AWS SAFETY] Read-only audit mode. No certificates are issued or modified.${NC}"
    echo ""
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Mode:   ${BOLD}CERTIFICATE AUDIT & STATUS REPORT${NC}"
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Engine: LetsEncrypt-IP-SSL-Manager v${SCRIPT_VERSION}"
    echo ""
}

# ── Main ──────────────────────────────────────────────────────────────
main() {
    init_logging
    print_banner
    detect_os

    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Host:   ${HOSTNAME_VAL:-$(hostname)}"
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} OS:     ${OS_NAME:-Linux} ${OS_VERSION:-}"
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} IP:     ${PUBLIC_IP:-detecting...}"

    audit_certbot
    check_acme_profiles
    audit_certificates
    audit_renewal
    audit_renewal_logs
    check_http_challenge
    print_installation_guide
    print_summary

    log AUDIT "SOC Pulse Module 5 — IP Cryptography audit completed"
    echo -e "\n${GREEN}${BOLD}[✓] Module 5 completed successfully.${NC}"
}

main "$@"
