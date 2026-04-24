import React, { useMemo, useState } from 'react';

// Knowledge base for each of the 8 audit sections — built from real logs
const SECTION_KNOWLEDGE = {
  'Certbot': {
    what: 'Certbot is the official tool from Let\'s Encrypt to automatically issue free SSL/TLS certificates for your server. Without it, you cannot get or renew HTTPS certificates automatically.',
    okMeans: 'Certbot is installed and ready to issue SSL certificates.',
    problemMeans: 'Certbot is not installed. Your server cannot automatically manage SSL certificates.',
    mitigation: [
      'Install certbot: sudo apt install certbot python3-certbot-nginx',
      'Or for Apache: sudo apt install certbot python3-certbot-apache',
      'After installing, issue a certificate: sudo certbot --nginx -d yourdomain.com',
      'Note: SSL certificates require a real domain name, not just an IP address.',
    ],
  },
  'Certificate Status': {
    what: 'This section checks whether any active SSL/TLS certificates are currently installed on this server. Certificates are what enable HTTPS — the padlock icon users see in their browser.',
    okMeans: 'At least one valid SSL certificate is installed and active.',
    problemMeans: 'No SSL certificates are installed. All traffic to this server is unencrypted (HTTP only).',
    mitigation: [
      'Register a domain name pointing to this server\'s IP address.',
      'Install certbot (see Section 1), then run: sudo certbot --nginx -d yourdomain.com',
      'For IP-only access (no domain), consider a self-signed certificate for internal tools.',
      'Use Cloudflare\'s free SSL proxy as a temporary solution for domain-based sites.',
    ],
  },
  'Certificate Expiry': {
    what: 'SSL certificates have an expiry date — typically 90 days for Let\'s Encrypt certificates. An expired certificate causes browsers to show a "Your connection is not private" warning to all visitors, breaking your site.',
    okMeans: 'All certificates are valid and not close to expiring.',
    problemMeans: 'A certificate is expired or expiring soon. Users will see security warnings.',
    mitigation: [
      'Renew immediately: sudo certbot renew --force-renewal',
      'Enable auto-renewal to prevent future expirations: sudo systemctl enable certbot.timer',
      'Verify auto-renewal works: sudo certbot renew --dry-run',
    ],
  },
  'SSL/TLS Configuration': {
    what: 'This checks your web server (nginx or Apache) to ensure it uses modern, secure TLS versions (TLS 1.2 and 1.3) and disables old broken protocols like SSLv3 and TLS 1.0 that attackers can exploit.',
    okMeans: 'Your web server is configured to use only modern, secure TLS protocols.',
    problemMeans: 'No web server (nginx/apache) was found, or it uses weak TLS settings that are exploitable.',
    mitigation: [
      'Install a web server: sudo apt install nginx',
      'Configure nginx to use TLS 1.2+ in /etc/nginx/nginx.conf',
      'Add: ssl_protocols TLSv1.2 TLSv1.3; ssl_ciphers HIGH:!aNULL:!MD5;',
      'Test your SSL config: https://www.ssllabs.com/ssltest/ after setup',
    ],
  },
  'Auto-Renewal': {
    what: 'Let\'s Encrypt certificates expire every 90 days. Auto-renewal automatically renews them before they expire. Without it, you must manually renew every 3 months or your site will break.',
    okMeans: 'Certbot\'s automatic renewal timer/cron job is active. Certificates renew automatically.',
    problemMeans: 'No auto-renewal is configured. Certificates will expire and break your site unless manually renewed.',
    mitigation: [
      'Enable certbot\'s systemd timer: sudo systemctl enable certbot.timer && sudo systemctl start certbot.timer',
      'Or add a cron job: 0 0,12 * * * root certbot renew --quiet',
      'Test renewal: sudo certbot renew --dry-run',
    ],
  },
  'HSTS': {
    what: 'HSTS (HTTP Strict Transport Security) is a web security policy that forces browsers to always use HTTPS when connecting to your site — even if a user types "http://". This protects against protocol downgrade attacks.',
    okMeans: 'HSTS header is configured. Browsers are forced to use HTTPS.',
    problemMeans: 'HSTS is not configured. Attackers can force a "downgrade" to unencrypted HTTP to intercept traffic.',
    mitigation: [
      'In nginx, add to your server block: add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
      'In Apache, add: Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"',
      'Restart your web server after: sudo systemctl restart nginx',
    ],
  },
  'Certificate Transparency': {
    what: 'Certificate Transparency (CT) is a public log of all SSL certificates ever issued. It lets you verify that no unauthorized certificate has been issued for your domain by a rogue certificate authority.',
    okMeans: 'Your certificate is logged in public CT logs — verifiable and trustworthy.',
    problemMeans: 'No certificates to check, or certificates are not logged in CT logs.',
    mitigation: [
      'All Let\'s Encrypt certificates are automatically added to CT logs — no action needed once certbot is set up.',
      'To monitor for unauthorized certs on your domain, use: https://crt.sh/?q=yourdomain.com',
      'Enable CT monitoring alerts via services like Facebook CT Monitor or SSLMate.',
    ],
  },
  'Summary': {
    what: 'The final audit summary showing the total count of issues found across all 8 sections.',
    okMeans: '0 issues detected. All SSL/certificate systems are properly configured.',
    problemMeans: 'One or more issues were found. Review the sections above for details.',
    mitigation: [],
  },
};

const getSectionKnowledge = (title) => {
  for (const key of Object.keys(SECTION_KNOWLEDGE)) {
    if (title.toLowerCase().includes(key.toLowerCase())) return SECTION_KNOWLEDGE[key];
  }
  return null;
};

const getSectionStatus = (content) => {
  if (content.includes('[⚠]') || content.includes('NOT installed') || content.includes('NOT configured') || content.includes('NOT found') || content.includes('No certs')) return 'WARNING';
  if (content.includes('[✓]') && !content.includes('[⚠]')) return 'OK';
  return 'INFO';
};

const renderLine = (line, idx) => {
  const clean = line.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
  if (!clean.trim()) return null;
  let color = '#94a3b8', icon = '▪';
  let text = clean;
  if (clean.includes('[⚠]')) { color = '#f59e0b'; icon = '⚠️'; text = clean.replace('[⚠]', '').trim(); }
  else if (clean.includes('[✓]')) { color = '#10b981'; icon = '✅'; text = clean.replace('[✓]', '').trim(); }
  else if (clean.includes('[ℹ]')) { color = '#38bdf8'; icon = 'ℹ️'; text = clean.replace('[ℹ]', '').trim(); }
  return (
    <div key={idx} style={{ display: 'flex', gap: '8px', color, fontSize: '0.82rem', fontFamily: 'monospace', marginBottom: '5px', lineHeight: '1.4' }}>
      <span style={{ minWidth: '18px' }}>{icon}</span>
      <span style={{ wordBreak: 'break-word' }}>{text}</span>
    </div>
  );
};

const MachineIpCryptoDetails = ({ logs, onBack }) => {
  const [showRawLogs, setShowRawLogs] = useState(false);

  const parsedData = useMemo(() => {
    let rawText = '';
    if (Array.isArray(logs)) rawText = logs.map(l => l.text).join('\n');
    else rawText = String(logs || '');
    const cleanText = rawText.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

    const hostMatch = cleanText.match(/Host:\s*(.*)/);
    const osMatch = cleanText.match(/OS:\s*(.*)/);
    const ipMatch = cleanText.match(/IP:\s*(.*)/);
    const certbotMatch = cleanText.match(/Certbot Ready:\s*(.*?)║/);
    const certsMatch = cleanText.match(/Certs Installed:\s*(.*?)║/);
    const cronMatch = cleanText.match(/Renewal Cron:\s*(.*?)║/);
    const issuesMatch = cleanText.match(/Issues Detected:\s*(\d+)/);
    const durationMatch = cleanText.match(/duration:\s*([0-9.]+s)/);

    // Parse 8 audit sections
    const sections = [];
    const sectionRegex = /━━ \[(\d\/\d)\] (.*?) ━+\n([\s\S]*?)(?=━━ \[|╔═════|$)/g;
    let m;
    while ((m = sectionRegex.exec(cleanText)) !== null) {
      const title = m[2].trim();
      const content = m[3].trim();
      sections.push({
        step: m[1],
        title,
        content,
        status: getSectionStatus(content),
        knowledge: getSectionKnowledge(title),
      });
    }

    const certbotReady = certbotMatch?.[1]?.trim() || 'Unknown';
    const certsInstalled = certsMatch?.[1]?.trim() || 'Unknown';
    const renewalCron = cronMatch?.[1]?.trim() || 'Unknown';
    const issuesDetected = issuesMatch ? parseInt(issuesMatch[1]) : 0;

    // Problems: sections with WARNING status
    const problemSections = sections.filter(s => s.status === 'WARNING');
    const okSections = sections.filter(s => s.status !== 'WARNING');

    // Determine overall mode from logs
    const isAuditMode = cleanText.includes('AWS SAFETY') || cleanText.includes('audit mode') || cleanText.includes('Read-only');

    return {
      host: hostMatch?.[1]?.trim() || 'Unknown',
      os: osMatch?.[1]?.trim() || 'Unknown',
      ip: ipMatch?.[1]?.trim() || 'Unknown',
      certbotReady, certsInstalled, renewalCron, issuesDetected,
      duration: durationMatch?.[1]?.trim() || '0s',
      sections, problemSections, okSections, isAuditMode, cleanText,
    };
  }, [logs]);

  return (
    <div className="details-view-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2.2rem' }}>🔑</span> Machine IP Cryptography Report
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            SSL/TLS Certificate Audit — Host: <span style={{ color: '#a78bfa', fontFamily: 'monospace' }}>{parsedData.host}</span> | IP: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{parsedData.ip}</span> | {parsedData.os}
          </p>
        </div>
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >← Back to Dashboard</button>
      </div>

      {/* AWS Audit Mode Banner */}
      {parsedData.isAuditMode && (
        <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid #38bdf8', borderLeft: '4px solid #38bdf8', borderRadius: '8px', padding: '14px 20px', marginBottom: '25px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '1.4rem' }}>🔍</span>
          <div>
            <h4 style={{ margin: 0, color: '#38bdf8' }}>Read-Only Audit Mode (AWS Safety)</h4>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>This module ran in audit-only mode. No certificates were issued or modified. This is intentional on AWS EC2 to prevent accidental changes.</p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Certbot Engine', value: parsedData.certbotReady, color: parsedData.certbotReady?.includes('NO') ? '#f59e0b' : '#10b981' },
          { label: 'Active Certs', value: parsedData.certsInstalled, color: parsedData.certsInstalled === 'NO' ? '#64748b' : '#10b981' },
          { label: 'Auto-Renewal', value: parsedData.renewalCron, color: parsedData.renewalCron?.includes('NOT') ? '#ef4444' : '#38bdf8' },
          { label: 'Issues Found', value: parsedData.issuesDetected, color: parsedData.issuesDetected > 0 ? '#ef4444' : '#10b981' },
          { label: 'Exec Time', value: parsedData.duration, color: '#a78bfa' },
        ].map((c, i) => (
          <div key={i} style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: `1px solid ${c.color}`, borderRadius: '12px', padding: '16px' }}>
            <h4 style={{ margin: 0, color: c.color, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '1px' }}>{c.label}</h4>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fff', marginTop: '8px', wordBreak: 'break-all' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* ===== SECTION 1: PROBLEMS FOUND ===== */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ color: '#f8fafc', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🔴</span> Problems Found
          <span style={{ background: parsedData.problemSections.length > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: parsedData.problemSections.length > 0 ? '#f59e0b' : '#10b981', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'normal' }}>
            {parsedData.problemSections.length} section(s) with warnings
          </span>
        </h3>

        {parsedData.problemSections.length === 0 ? (
          <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <div style={{ color: '#10b981', fontWeight: 'bold' }}>All 8 audit sections passed — Certificate infrastructure is fully configured.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {parsedData.problemSections.map((sec, idx) => {
              const kb = sec.knowledge;
              return (
                <div key={idx} style={{ background: '#0f172a', border: '1px solid #f59e0b', borderLeft: '4px solid #f59e0b', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#334155', color: '#f59e0b', padding: '2px 7px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace' }}>{sec.step}</span>
                      ⚠️ {sec.title}
                    </h4>
                    <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>WARNING</span>
                  </div>

                  {/* Live log lines */}
                  <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '6px', padding: '10px', marginBottom: '12px' }}>
                    {sec.content.split('\n').map((l, i) => renderLine(l, i)).filter(Boolean)}
                  </div>

                  {/* Plain English explanation */}
                  {kb && (
                    <>
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                        <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '6px' }}>🔍 What this means (simple terms):</div>
                        <div style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6' }}>{kb.problemMeans}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '8px', lineHeight: '1.6' }}>{kb.what}</div>
                      </div>

                      {kb.mitigation.length > 0 && (
                        <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', padding: '12px' }}>
                          <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px' }}>🛡️ Mitigation Plan:</div>
                          {kb.mitigation.map((step, i) => (
                            <div key={i} style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '5px', display: 'flex', gap: '8px' }}>
                              <span style={{ color: '#10b981', minWidth: '18px' }}>{i + 1}.</span>
                              <span style={{ fontFamily: step.startsWith('sudo') || step.startsWith('0 0') ? 'monospace' : 'inherit', color: step.startsWith('sudo') || step.startsWith('0 0') ? '#a78bfa' : '#cbd5e1' }}>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== SECTION 2: PASSED ITEMS ===== */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ color: '#f8fafc', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>✅</span> Passed Items
          <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'normal' }}>
            {parsedData.okSections.length} section(s) passed / informational
          </span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '15px' }}>
          {parsedData.okSections.map((sec, idx) => {
            const kb = sec.knowledge;
            return (
              <div key={idx} style={{ background: '#0f172a', border: '1px solid rgba(16,185,129,0.2)', borderLeft: '3px solid #10b981', borderRadius: '8px', padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ background: '#334155', color: '#10b981', padding: '2px 7px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace' }}>{sec.step}</span>
                  <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.9rem' }}>✅ {sec.title}</h4>
                </div>
                {kb && (
                  <div style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '10px' }}>
                    {kb.what}
                  </div>
                )}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                  {sec.content.split('\n').slice(0, 4).map((l, i) => renderLine(l, i)).filter(Boolean)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== SECTION 3: RAW LOGS ===== */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button onClick={() => setShowRawLogs(!showRawLogs)}
          style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '6px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.border = '1px solid #94a3b8'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.border = '1px solid #475569'; }}
        >
          {showRawLogs ? '🔼 Hide Raw Terminal Logs' : '🖥️ View Full Terminal Output (Raw Logs)'}
        </button>
      </div>

      {showRawLogs && (
        <div style={{ background: '#020617', border: '1px solid #334155', borderRadius: '8px', padding: '20px', height: '400px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease-out' }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{parsedData.cleanText}</pre>
        </div>
      )}

    </div>
  );
};

export default MachineIpCryptoDetails;
