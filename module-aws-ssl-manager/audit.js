#!/usr/bin/env node
/**
 * SOC Pulse — Machine IP Cryptography Engine v4.0
 * Replaces ubuntu-cert-manager.sh bash script.
 * Zero network calls — instant, non-blocking, never hangs.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  cyan:   '\x1b[0;36m',
  green:  '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  red:    '\x1b[0;31m',
  blue:   '\x1b[0;34m',
};

const run  = (cmd) => { try { return execSync(cmd, { stdio: ['ignore','pipe','pipe'] }).toString().trim(); } catch { return ''; } };
const ok   = (msg) => console.log(`${C.green}[✓]${C.reset} ${msg}`);
const warn = (msg) => console.log(`${C.yellow}[⚠]${C.reset} ${msg}`);
const info = (msg) => console.log(`${C.cyan}[ℹ]${C.reset} ${msg}`);
const sep  = (n, t) => console.log(`\n${C.bold}━━ [${n}/8] ${t} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);

const START = Date.now();
let issues = 0;

// ── Banner ────────────────────────────────────────────────────────────────
console.log(`${C.cyan}${C.bold}`);
console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║   🔑  SOC PULSE — Machine IP Cryptography Engine v4.0.0             ║');
console.log('║       Powered by gensecaihq/LetsEncrypt-IP-SSL-Manager               ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log(C.reset);
console.log(`${C.yellow}${C.bold}[AWS SAFETY] Read-only audit mode. No certificates issued or modified.${C.reset}`);

const ts  = () => new Date().toISOString().replace('T',' ').replace(/\..*/,'');
const host = run('hostname -f || hostname');
const ip   = run("hostname -I 2>/dev/null | awk '{print $1}'") || 'Unknown';

console.log(`\n${C.blue}[${ts()}]${C.reset} Host:   ${host}`);
console.log(`${C.blue}[${ts()}]${C.reset} OS:     ${run('lsb_release -ds 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d \'"\'')}`);
console.log(`${C.blue}[${ts()}]${C.reset} IP:     ${ip}`);
console.log(`${C.blue}[${ts()}]${C.reset} Init:   systemd`);

// ── [1/8] Certbot & Dependencies ─────────────────────────────────────────
sep(1, 'Certbot & Dependencies');
let certbotOk = false;
const certbotPath = run('which certbot 2>/dev/null');
if (certbotPath) {
  const ver = run('certbot --version 2>&1').match(/[\d.]+/)?.[0] || '0';
  ok(`certbot v${ver} found at ${certbotPath}`);
  certbotOk = true;
} else {
  warn('certbot: NOT INSTALLED');
  issues++;
}
for (const tool of ['openssl', 'curl', 'python3']) {
  run(`which ${tool}`) ? ok(`${tool}: ✓`) : warn(`${tool}: missing`);
}

// ── [2/8] ACME Profile Support ───────────────────────────────────────────
sep(2, 'ACME Profile Support (shortlived for 6-day certs)');
if (!certbotOk) {
  warn('ACME profile check skipped — certbot not ready');
} else {
  const hasProfile = run('certbot --help 2>&1').toLowerCase().includes('profile');
  hasProfile ? ok('ACME --preferred-profile flag: supported ✓') : warn('ACME profile flag not detected — update certbot');
}

// ── [3/8] Certificate Inventory ──────────────────────────────────────────
sep(3, 'Certificate Inventory');
const CERT_PATH = '/etc/letsencrypt/live';
if (!fs.existsSync(CERT_PATH)) {
  warn(`No certificates directory at ${CERT_PATH}`);
  issues++;
} else {
  const domains = fs.readdirSync(CERT_PATH).filter(d => fs.statSync(path.join(CERT_PATH,d)).isDirectory());
  if (domains.length === 0) {
    warn('No certificates found');
    issues++;
  } else {
    for (const domain of domains) {
      const certFile = path.join(CERT_PATH, domain, 'cert.pem');
      if (!fs.existsSync(certFile)) continue;
      const expiry = run(`openssl x509 -noout -enddate -in "${certFile}" 2>/dev/null | cut -d= -f2`);
      if (expiry) {
        const daysLeft = Math.floor((new Date(expiry) - Date.now()) / 86400000);
        if (daysLeft < 0)      { console.log(`${C.red}[✗]${C.reset}  [EXPIRED]  ${domain}`); issues++; }
        else if (daysLeft <= 1){ console.log(`${C.red}[✗]${C.reset}  [CRITICAL] ${domain} — ${daysLeft}d`); issues++; }
        else if (daysLeft <= 6){ warn(`[EXPIRING] ${domain} — ${daysLeft}d`); }
        else                   { ok(`[VALID]    ${domain} — ${daysLeft}d`); }
      }
    }
  }
}

// ── [4/8] Auto-Renewal System ────────────────────────────────────────────
sep(4, 'Auto-Renewal System (every 4h for 6-day certs)');
const timerActive = run('systemctl is-active certbot-ip-renew.timer 2>/dev/null') === 'active';
const cronExists  = fs.existsSync('/etc/cron.d/certbot-ip-renew');
const certbotTimerActive = run('systemctl is-active certbot.timer 2>/dev/null') === 'active';

if (timerActive)       ok('certbot-ip-renew.timer: ACTIVE ✓');
else                   warn('certbot-ip-renew.timer: NOT CONFIGURED');

if (cronExists)        ok('cron /etc/cron.d/certbot-ip-renew: PRESENT ✓');
else {
  warn('cron fallback: /etc/cron.d/certbot-ip-renew — NOT CONFIGURED');
  issues++;
}

if (certbotTimerActive) ok('certbot.timer (standard): ACTIVE ✓');

if (!timerActive && !cronExists && !certbotTimerActive) {
  warn('NO renewal mechanism configured');
  info("Fix: echo '0 */4 * * * root certbot renew --quiet' | sudo tee /etc/cron.d/certbot-ip-renew");
}

// ── [5/8] Recent Certificate Activity ───────────────────────────────────
sep(5, 'Recent Certificate Activity');
const LOG_FILE = '/var/log/letsencrypt-ip-manager/ip-certificate.log';
const LOG_LETSENCRYPT = '/var/log/letsencrypt/letsencrypt.log';
let logFound = false;
for (const lf of [LOG_LETSENCRYPT, LOG_FILE]) {
  if (fs.existsSync(lf) && fs.statSync(lf).size > 0) {
    console.log(`${C.cyan}  → ${lf}${C.reset}`);
    const lines = fs.readFileSync(lf,'utf8').trimEnd().split('\n').slice(-5);
    lines.forEach(l => console.log(`    ${l}`));
    logFound = true;
    break;
  }
}
if (!logFound) warn('No certbot activity logs — certbot not yet run on this host');

// ── [6/8] Network & HTTP-01 Challenge Readiness ──────────────────────────
sep(6, 'Network & HTTP-01 Challenge Readiness');
info('ACME staging connectivity: skipped (headless audit mode — no network calls)');
info(`Public IP: ${ip}`);
const port80 = run("ss -tlnp 2>/dev/null | grep ':80 '");
port80 ? ok('Port 80: listening ✓') : warn('Port 80: nothing listening — certbot standalone needs port 80');
info('AWS: ensure Security Group inbound TCP:80 from 0.0.0.0/0 for HTTP-01 challenge');

// ── [7/8] Configuration & Backup Status ──────────────────────────────────
sep(7, 'Configuration & Backup Status');
const CONFIG = '/etc/letsencrypt-ip-manager/config.conf';
const BACKUP = '/etc/letsencrypt-ip-manager/backup';
fs.existsSync(CONFIG) ? ok(`Config: ${CONFIG} ✓`) : warn(`Config: ${CONFIG} — not created yet (run --configure)`);
if (fs.existsSync(BACKUP)) {
  const backups = fs.readdirSync(BACKUP).filter(f => f.endsWith('.backup')).length;
  ok(`Backups: ${BACKUP} — ${backups} backup(s) found`);
} else {
  warn(`Backup dir: ${BACKUP} — not initialized`);
}

// ── [8/8] Certbot Installation Guide ─────────────────────────────────────
sep(8, 'Certbot Installation & Issuance Guide');
if (!certbotOk) {
  console.log(`${C.yellow}  Certbot v2.0+ required. Install via snap:${C.reset}`);
  console.log(`${C.cyan}`);
  console.log('    sudo apt update && sudo apt install -y snapd');
  console.log('    sudo snap install --classic certbot');
  console.log('    sudo ln -sf /snap/bin/certbot /usr/bin/certbot');
  console.log(C.reset);
}
console.log(`${C.yellow}  Issue a 6-day IP certificate (staging):${C.reset}`);
console.log(`${C.cyan}`);
console.log(`    sudo certbot certonly --standalone \\`);
console.log(`        --server https://acme-staging-v02.api.letsencrypt.org/directory \\`);
console.log(`        --preferred-profile shortlived \\`);
console.log(`        --agree-tos --no-eff-email \\`);
console.log(`        -d ${ip} -m your@email.com`);
console.log(C.reset);

// ── Summary ───────────────────────────────────────────────────────────────
const dur = ((Date.now() - START) / 1000).toFixed(1);
console.log(`\n${C.cyan}${C.bold}`);
console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║  SOC PULSE — Machine IP Cryptography Summary                     ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log(`║  Certbot Ready:    ${certbotOk ? 'YES ✓' : 'NO — install certbot'}`.padEnd(67) + '║');
console.log(`║  Certs Installed:  ${fs.existsSync(CERT_PATH) ? 'YES' : 'NO'}`.padEnd(67) + '║');
console.log(`║  Renewal Cron:     ${cronExists || timerActive ? 'CONFIGURED ✓' : 'NOT CONFIGURED'}`.padEnd(67) + '║');
console.log(`║  Issues Detected:  ${issues}`.padEnd(67) + '║');
console.log(`║  Duration:         ${dur}s`.padEnd(67) + '║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log(C.reset);
console.log(`${C.green}${C.bold}[✓] Module 5 completed. Exit code: 0${C.reset}\n`);
process.exit(0);
