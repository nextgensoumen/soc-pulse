// ─────────────────────────────────────────────────────────────────────────────
// SOC Pulse — Report Generator Utility
// Parses raw module logs → generates a beautiful HTML security report
// ─────────────────────────────────────────────────────────────────────────────

const MODULE_META = {
    1: { name: 'Supply Chain Defense',      icon: '🛡️', color: '#00e5ff', bg: '#0a1628' },
    2: { name: 'Web App Scanner',           icon: '🌐', color: '#a78bfa', bg: '#0f0a28' },
    3: { name: 'System Endpoint Hardening', icon: '🔐', color: '#4ade80', bg: '#0a1a10' },
    4: { name: 'Autonomous Remediation',    icon: '🩹', color: '#fb923c', bg: '#1a0f08' },
    5: { name: 'Machine IP Cryptography',   icon: '🔑', color: '#fbbf24', bg: '#1a1508' },
};

// ── Log Parser ────────────────────────────────────────────────────────────────
export function parseLogs(logs) {
    const lines = logs.map(l => (typeof l === 'string' ? l : l.text || ''));
    const clean = lines.map(l => l.replace(/\x1b\[[0-9;]*m/g, '').trim()).filter(Boolean);

    // OS detection
    let osName = 'Ubuntu', osVersion = '', osCodename = '', scriptVersion = '';
    clean.forEach(l => {
        const vm = l.match(/Version:\s+([\d.]+)/);     if (vm) osVersion = vm[1];
        const cm = l.match(/Codename:\s+(\w+)/);        if (cm) osCodename = cm[1];
        const sm = l.match(/Selected Hardening Script:\s*(v[\d.]+)/i); if (sm) scriptVersion = sm[1];
        if (l.includes('Ubuntu')) osName = 'Ubuntu';
    });

    // Timestamps → duration
    const timestamps = clean
        .map(l => { const m = l.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/); return m ? new Date(m[1]) : null; })
        .filter(Boolean);
    const startTime  = timestamps.length ? timestamps[0] : new Date();
    const endTime    = timestamps.length ? timestamps[timestamps.length - 1] : new Date();
    const durationMs = endTime - startTime;
    const duration   = durationMs > 0
        ? `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`
        : '< 1s';

    // Counts
    const packagesInstalled = clean.filter(l => l.startsWith('Setting up ')).length;
    const warnings          = clean.filter(l => l.includes('WARNING') || l.includes('WARN')).length;
    const errors            = clean.filter(l => l.includes('ERROR') || l.includes('error_exit')).length;
    const successChecks     = clean.filter(l => l.includes('[✓]') || l.includes('successfully') || l.includes('SUCCESS')).length;

    // AWS Safety
    const awsSafe = clean.some(l => l.includes('AWS EC2 SAFETY MODE'));

    // Categorised sections
    const sections = {
        'OS Detection & Pre-flight': [],
        'Package Installation':      [],
        'Security Configuration':    [],
        'Firewall & Network':        [],
        'Audit & Compliance':        [],
        'Warnings & Notices':        [],
        'Final Summary':             [],
    };

    clean.forEach(l => {
        if (l.match(/Detect|OS Detection|Pre-flight|RAM|Disk|Virtuali/i))            sections['OS Detection & Pre-flight'].push(l);
        else if (l.match(/Installing|Setting up|Fetched|Unpacking|Preparing/i))      sections['Package Installation'].push(l);
        else if (l.match(/Configur|AppArmor|ClamAV|Auditd|AIDE|Fail2ban|Snort/i))   sections['Security Configuration'].push(l);
        else if (l.match(/UFW|Firewall|Network|iptables|port/i))                    sections['Firewall & Network'].push(l);
        else if (l.match(/Audit|Compliance|CIS|NIST|lynis|tiger|openscap/i))        sections['Audit & Compliance'].push(l);
        else if (l.match(/WARNING|WARN|Consider|may not/i))                         sections['Warnings & Notices'].push(l);
        else if (l.match(/COMPLETE|SUMMARY|REPORT|Hardening Complete|Duration/i))   sections['Final Summary'].push(l);
    });

    return {
        osName, osVersion, osCodename, scriptVersion,
        startTime, endTime, duration,
        packagesInstalled, warnings, errors, successChecks,
        awsSafe, sections, totalLines: clean.length,
    };
}

// ── HTML Report Builder ───────────────────────────────────────────────────────
export function generateReportHTML(moduleId, logs) {
    const meta   = MODULE_META[moduleId] || MODULE_META[3];
    const data   = parseLogs(logs);
    const now    = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const status = data.errors > 0 ? 'PARTIAL' : 'SUCCESS';
    const statusColor = status === 'SUCCESS' ? '#4ade80' : '#fb923c';

    const metricCard = (label, value, color, icon) => `
        <div class="metric-card">
            <div class="metric-icon" style="color:${color}">${icon}</div>
            <div class="metric-value" style="color:${color}">${value}</div>
            <div class="metric-label">${label}</div>
        </div>`;

    const sectionHTML = (title, lines, color) => {
        if (!lines.length) return '';
        const rows = lines.slice(0, 80).map(l => {
            let cls = 'log-info';
            if (l.match(/WARNING|WARN/i))    cls = 'log-warn';
            if (l.match(/ERROR/i))           cls = 'log-error';
            if (l.match(/✓|SUCCESS|success/i)) cls = 'log-success';
            if (l.match(/Setting up/i))      cls = 'log-install';
            return `<div class="log-row ${cls}">${escHtml(l)}</div>`;
        }).join('');
        return `
        <div class="section">
            <div class="section-header" style="border-left:4px solid ${color}">
                <span>${title}</span>
                <span class="section-count">${lines.length} entries</span>
            </div>
            <div class="log-block">${rows}${lines.length > 80 ? `<div class="log-more">… and ${lines.length - 80} more lines</div>` : ''}</div>
        </div>`;
    };

    const sectionColors = ['#00e5ff','#4ade80','#a78bfa','#fb923c','#fbbf24','#f87171','#34d399'];
    const sectionKeys   = Object.keys(data.sections);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>SOC Pulse — ${meta.name} Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Outfit',sans-serif;background:#080e1a;color:#e2e8f0;min-height:100vh}

  /* ── PRINT BUTTON ── */
  .print-bar{position:sticky;top:0;z-index:999;background:rgba(8,14,26,.95);backdrop-filter:blur(12px);
    border-bottom:1px solid rgba(255,255,255,.08);padding:12px 32px;display:flex;align-items:center;justify-content:space-between}
  .print-bar h1{font-size:1rem;font-weight:600;color:#94a3b8;letter-spacing:1px}
  .btn-pdf{background:linear-gradient(135deg,#FFd600,#FF6D00);color:#000;border:none;padding:10px 28px;
    border-radius:8px;font-weight:800;font-size:.85rem;cursor:pointer;letter-spacing:.5px;
    transition:all .2s;box-shadow:0 4px 15px rgba(255,214,0,.3)}
  .btn-pdf:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(255,214,0,.5)}

  /* ── HEADER ── */
  .report-header{background:linear-gradient(135deg,${meta.bg} 0%,#0a0f1e 100%);
    border-bottom:1px solid ${meta.color}33;padding:48px 48px 40px;position:relative;overflow:hidden}
  .report-header::before{content:'';position:absolute;top:-50%;right:-10%;width:500px;height:500px;
    background:radial-gradient(circle,${meta.color}15 0%,transparent 70%);pointer-events:none}
  .header-top{display:flex;align-items:center;gap:20px;margin-bottom:32px}
  .module-icon-big{font-size:3rem;background:${meta.color}15;border:1px solid ${meta.color}33;
    border-radius:16px;padding:16px;width:80px;height:80px;display:flex;align-items:center;justify-content:center}
  .header-title{flex:1}
  .brand-label{font-size:.7rem;font-weight:700;letter-spacing:3px;color:${meta.color};margin-bottom:6px;opacity:.8}
  .report-title{font-size:2rem;font-weight:800;color:#fff;line-height:1.2}
  .report-subtitle{font-size:.95rem;color:#64748b;margin-top:6px}
  .status-badge{padding:8px 20px;border-radius:20px;font-weight:700;font-size:.8rem;letter-spacing:1px;
    background:${statusColor}20;color:${statusColor};border:1px solid ${statusColor}50}

  /* ── META ROW ── */
  .meta-row{display:flex;gap:32px;flex-wrap:wrap;margin-top:8px}
  .meta-item{display:flex;flex-direction:column;gap:4px}
  .meta-item label{font-size:.65rem;letter-spacing:2px;color:#475569;font-weight:600;text-transform:uppercase}
  .meta-item span{font-size:.9rem;color:#cbd5e1;font-weight:500}

  /* ── METRICS GRID ── */
  .metrics-section{padding:32px 48px;border-bottom:1px solid rgba(255,255,255,.06)}
  .metrics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px}
  .metric-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;
    padding:24px 20px;text-align:center;transition:all .3s}
  .metric-icon{font-size:2rem;margin-bottom:8px}
  .metric-value{font-size:2rem;font-weight:800;margin-bottom:4px}
  .metric-label{font-size:.75rem;color:#64748b;font-weight:600;letter-spacing:1px;text-transform:uppercase}

  /* ── AWS BADGE ── */
  .aws-badge{margin:0 48px 24px;background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.25);
    border-radius:12px;padding:16px 24px;display:flex;align-items:center;gap:12px}
  .aws-badge .icon{font-size:1.5rem}
  .aws-badge .text strong{color:#fbbf24;display:block;font-size:.85rem;margin-bottom:2px}
  .aws-badge .text span{color:#94a3b8;font-size:.8rem}

  /* ── LOG SECTIONS ── */
  .sections-wrapper{padding:24px 48px 48px}
  .section{margin-bottom:24px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.06)}
  .section-header{background:rgba(255,255,255,.04);padding:14px 20px;display:flex;
    justify-content:space-between;align-items:center;font-weight:600;font-size:.9rem}
  .section-count{font-size:.75rem;color:#64748b;background:rgba(255,255,255,.06);
    padding:3px 10px;border-radius:20px}
  .log-block{padding:12px;background:#060b14;max-height:320px;overflow-y:auto}
  .log-row{font-family:'JetBrains Mono',monospace;font-size:.72rem;padding:3px 8px;
    border-radius:4px;margin:1px 0;line-height:1.5;white-space:pre-wrap;word-break:break-all}
  .log-info   {color:#64748b}
  .log-success{color:#4ade80;background:rgba(74,222,128,.05)}
  .log-warn   {color:#fbbf24;background:rgba(251,191,36,.05)}
  .log-error  {color:#f87171;background:rgba(248,113,113,.05)}
  .log-install{color:#00e5ff;background:rgba(0,229,255,.04)}
  .log-more{color:#475569;font-family:'JetBrains Mono',monospace;font-size:.7rem;
    padding:8px;text-align:center;border-top:1px solid rgba(255,255,255,.04);margin-top:4px}

  /* ── FOOTER ── */
  .report-footer{text-align:center;padding:32px;border-top:1px solid rgba(255,255,255,.06);
    color:#475569;font-size:.8rem}
  .report-footer strong{color:#FFd600}

  /* ── PRINT STYLES ── */
  @media print{
    .print-bar{display:none!important}
    body{background:#fff;color:#000}
    .report-header{background:#f8fafc!important;color:#000;border-bottom:2px solid #e2e8f0}
    .report-title,.metric-value,.brand-label{color:#000!important}
    .metric-card,.section{border:1px solid #e2e8f0!important;background:#f8fafc!important}
    .log-block{background:#f1f5f9!important;max-height:none!important}
    .log-row{color:#374151!important;background:transparent!important}
    .section{break-inside:avoid}
    .metrics-section{background:#f8fafc}
  }
</style>
</head>
<body>

<!-- Print Bar -->
<div class="print-bar">
  <h1>🌻 SOC PULSE — SECURITY REPORT</h1>
  <button class="btn-pdf" onclick="window.print()">⬇ Download as PDF</button>
</div>

<!-- Header -->
<div class="report-header">
  <div class="header-top">
    <div class="module-icon-big">${meta.icon}</div>
    <div class="header-title">
      <div class="brand-label">SOC PULSE — SECURITY OPERATIONS CENTER</div>
      <div class="report-title">${meta.name}</div>
      <div class="report-subtitle">Automated Security Hardening Report — Ubuntu ${data.osVersion} ${data.osCodename ? `(${data.osCodename})` : ''}</div>
    </div>
    <div class="status-badge">${status}</div>
  </div>
  <div class="meta-row">
    <div class="meta-item"><label>Generated</label><span>${now}</span></div>
    <div class="meta-item"><label>OS</label><span>${data.osName} ${data.osVersion}${data.osCodename ? ` • ${data.osCodename}` : ''}</span></div>
    <div class="meta-item"><label>Script</label><span>${data.scriptVersion || 'v3.0'}</span></div>
    <div class="meta-item"><label>Duration</label><span>${data.duration}</span></div>
    <div class="meta-item"><label>Start</label><span>${data.startTime.toLocaleTimeString()}</span></div>
    <div class="meta-item"><label>End</label><span>${data.endTime.toLocaleTimeString()}</span></div>
    <div class="meta-item"><label>Log Lines</label><span>${data.totalLines.toLocaleString()}</span></div>
  </div>
</div>

<!-- Metrics -->
<div class="metrics-section">
  <div class="metrics-grid">
    ${metricCard('Packages Installed', data.packagesInstalled, '#00e5ff', '📦')}
    ${metricCard('Checks Passed', data.successChecks, '#4ade80', '✅')}
    ${metricCard('Warnings', data.warnings, '#fbbf24', '⚠️')}
    ${metricCard('Errors', data.errors, data.errors > 0 ? '#f87171' : '#4ade80', data.errors > 0 ? '🔴' : '🟢')}
    ${metricCard('Duration', data.duration, meta.color, '⏱️')}
    ${metricCard('Log Lines', data.totalLines, '#a78bfa', '📋')}
  </div>
</div>

<!-- AWS Badge -->
${data.awsSafe ? `
<div class="aws-badge">
  <div class="icon">🛡️</div>
  <div class="text">
    <strong>AWS EC2 Safety Mode — ACTIVE</strong>
    <span>UFW firewall NOT activated · SSH daemon NOT restarted · All prompts answered headlessly</span>
  </div>
</div>` : ''}

<!-- Log Sections -->
<div class="sections-wrapper">
  ${sectionKeys.map((key, i) => sectionHTML(key, data.sections[key], sectionColors[i % sectionColors.length])).join('')}
</div>

<!-- Footer -->
<div class="report-footer">
  <p>Generated by <strong>SOC PULSE</strong> — Automated Security Operations Center</p>
  <p style="margin-top:6px">Developed by <strong>ULTRON</strong> · Powered by gensecaihq/Ubuntu-Security-Hardening-Script</p>
</div>

</body>
</html>`;
}

function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Open report in new tab ────────────────────────────────────────────────────
export function openReport(moduleId, logs) {
    const html = generateReportHTML(moduleId, logs);
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}
