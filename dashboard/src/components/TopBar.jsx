import React, { useState, useEffect } from 'react';

const BACKEND = `http://${window.location.hostname}:5000`;

// Map Ubuntu version to a colour theme
const getVersionStyle = (version) => {
    if (!version || version === 'Unknown' || version === 'N/A') {
        return { bg: 'rgba(100,100,120,0.35)', color: '#aaa', icon: '🖥️' };
    }
    const v = parseFloat(version);
    if (v >= 25)   return { bg: 'rgba(139,92,246,0.25)', color: '#c4b5fd', icon: '🚀' }; // purple — cutting edge
    if (v >= 24)   return { bg: 'rgba(34,197,94,0.20)',  color: '#86efac', icon: '✅' }; // green  — latest LTS
    if (v >= 22)   return { bg: 'rgba(59,130,246,0.22)', color: '#93c5fd', icon: '🛡️' }; // blue   — stable LTS
    if (v >= 20)   return { bg: 'rgba(234,179,8,0.20)',  color: '#fde68a', icon: '⚡' }; // yellow — older LTS
    return           { bg: 'rgba(239,68,68,0.20)',  color: '#fca5a5', icon: '⚠️' }; // red    — legacy
};

const TopBar = () => {
    const [sysInfo, setSysInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const res = await fetch(`${BACKEND}/api/system/info`);
                const data = await res.json();
                if (data.success) setSysInfo(data);
            } catch (_) {
                // Backend unreachable — show fallback
            } finally {
                setLoading(false);
            }
        };

        fetchInfo();
        // Refresh every 60 seconds
        const interval = setInterval(fetchInfo, 60000);
        return () => clearInterval(interval);
    }, []);

    const versionStyle = getVersionStyle(sysInfo?.os?.version);

    return (
        <header className="topbar glass-panel">
            <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input type="text" placeholder="Search logs, IPs, or threats..." className="search-input" />
            </div>

            {/* ── OS Version Badge ───────────────────────────────────────── */}
            <div className="os-badge-wrapper" title={sysInfo ? `Kernel: ${sysInfo.kernel} | Host: ${sysInfo.hostname} | Arch: ${sysInfo.arch} | Uptime: ${sysInfo.uptime}` : 'Loading system info...'}>
                {loading ? (
                    <div className="os-badge os-badge--loading">
                        <span className="os-badge-dot"></span>
                        Detecting OS...
                    </div>
                ) : sysInfo ? (
                    <div className="os-badge" style={{ background: versionStyle.bg, borderColor: versionStyle.color }}>
                        <span>{versionStyle.icon}</span>
                        <div className="os-badge-text">
                            <span className="os-badge-name" style={{ color: versionStyle.color }}>
                                {sysInfo.os.name} {sysInfo.os.version}
                            </span>
                            {sysInfo.os.codename && (
                                <span className="os-badge-codename">
                                    {sysInfo.os.codename}
                                </span>
                            )}
                        </div>
                        <span className="os-badge-live">LIVE</span>
                    </div>
                ) : (
                    <div className="os-badge os-badge--offline">
                        <span>⚠️</span>
                        <span>OS Unknown</span>
                    </div>
                )}
            </div>

            <div className="topbar-actions">
                <button className="action-btn badge-container">
                    🔔
                    <span className="badge">3</span>
                </button>
                <div className="user-profile">
                    <div className="avatar">A</div>
                    <span>Admin</span>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
