import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { execSync } from 'child_process';
import os from 'os';
import { createApiRouter } from './routes/api.js';
import { logger } from './services/logger.js';
import { getActiveCount } from './services/moduleRunner.js';
import { getTotalScans, getPlatformStats } from './services/scanHistory.js';

const app    = express();
const server = http.createServer(app);

// ── Socket.io — cloud-hardened ────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    // Keepalive beats AWS ALB (60s) / GCP LB (600s) idle timeouts
    pingInterval:    25000,   // ping every 25s
    pingTimeout:     60000,   // 60s wait for pong
    upgradeTimeout:  30000,   // 30s WebSocket upgrade window
    maxHttpBufferSize: 1e6,   // 1MB max log payload
});

// ── Express middleware stack ──────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Security headers (basic hardening — no helmet dep needed)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options',  'nosniff');
    res.setHeader('X-Frame-Options',          'SAMEORIGIN');
    res.setHeader('X-XSS-Protection',         '1; mode=block');
    res.setHeader('Referrer-Policy',           'no-referrer');
    next();
});

// HTTP access logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        const color = res.statusCode >= 500 ? '\x1b[31m'
                    : res.statusCode >= 400 ? '\x1b[33m'
                    : '\x1b[32m';
        logger.request(`${color}${req.method}\x1b[0m ${req.path} → ${res.statusCode} (${ms}ms)`);
    });
    next();
});

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status:             'operational',
        service:            'SOC Pulse Orchestration Backend',
        version:            '2.0.0',
        uptime:             `${process.uptime().toFixed(0)}s`,
        uptimeHuman:        formatUptime(process.uptime()),
        nodeVersion:        process.version,
        activeModules:      getActiveCount(),
        totalScansRecorded: getTotalScans(),
        memoryMB:           Math.round(process.memoryUsage().rss / 1024 / 1024),
        timestamp:          new Date().toISOString(),
    });
});

// ── PLATFORM STATS ────────────────────────────────────────────────────────────
// Aggregated threat counts across all module history — used by dashboard summary
app.get('/api/stats', (req, res) => {
    try {
        res.json({ success: true, ...getPlatformStats() });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── SYSTEM INFO ───────────────────────────────────────────────────────────────
app.get('/api/system/info', (req, res) => {
    try {
        let osName = 'Ubuntu', osVersion = 'Unknown', osCodename = '', osId = 'ubuntu';

        try {
            const osRelease = execSync('cat /etc/os-release 2>/dev/null', { encoding: 'utf8', timeout: 3000 });
            const parse = (key) => {
                const line = osRelease.split('\n').find(l => l.startsWith(key + '='));
                return line ? line.split('=')[1].replace(/"/g, '').trim() : '';
            };
            osName     = parse('NAME')             || 'Ubuntu';
            osVersion  = parse('VERSION_ID')       || 'Unknown';
            osCodename = parse('VERSION_CODENAME') || parse('UBUNTU_CODENAME') || '';
            osId       = parse('ID')               || 'ubuntu';
        } catch (_) {
            osName    = process.platform === 'win32' ? 'Windows' : 'Linux';
            osVersion = 'N/A';
        }

        let kernel = 'N/A';
        try { kernel = execSync('uname -r 2>/dev/null', { encoding: 'utf8', timeout: 2000 }).trim(); }
        catch (_) { kernel = os.release(); }

        const mem = os.totalmem();
        const freeMem = os.freemem();

        res.json({
            success: true,
            os: {
                name:         osName,
                version:      osVersion,
                codename:     osCodename,
                id:           osId,
                displayLabel: osCodename
                    ? `${osName} ${osVersion} (${osCodename})`
                    : `${osName} ${osVersion}`,
            },
            kernel,
            hostname:     os.hostname(),
            arch:         os.arch(),
            cpuCount:     os.cpus().length,
            memTotalMB:   Math.round(mem / 1024 / 1024),
            memFreeMB:    Math.round(freeMem / 1024 / 1024),
            memUsedPct:   `${(((mem - freeMem) / mem) * 100).toFixed(1)}%`,
            uptime:       formatUptime(os.uptime()),
            processMemMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
            timestamp:    new Date().toISOString(),
        });
    } catch (err) {
        logger.error(`/api/system/info failed: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── MODULE ROUTES ─────────────────────────────────────────────────────────────
app.use('/api/modules', createApiRouter(io));

// ── 404 HANDLER ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ── SOCKET CONNECTIONS ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    logger.info(`Client connected — ${socket.id} [${socket.handshake.address}]`);

    socket.on('subscribe_module', (moduleId) => {
        socket.join(`module_${moduleId}`);
    });

    socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected — ${socket.id} [reason: ${reason}]`);
    });

    // Let client know connection is alive (useful for debugging cloud drops)
    socket.emit('connected', { ts: new Date().toISOString(), server: 'SOC Pulse v2.0' });
});

// ── STARTUP ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    logger.system('═'.repeat(54));
    logger.system(`🛡️  SOC Pulse Backend v2.0 — live on 0.0.0.0:${PORT}`);
    logger.system(`📊  Health:   http://localhost:${PORT}/api/health`);
    logger.system(`📈  Stats:    http://localhost:${PORT}/api/stats`);
    logger.system(`🖥️   System:   http://localhost:${PORT}/api/system/info`);
    logger.system(`📋  History:  http://localhost:${PORT}/api/modules/history`);
    logger.system('═'.repeat(54));
});

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

// ── PROCESS GUARDS ────────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
    logger.error(`[UNCAUGHT EXCEPTION] ${err.message}`);
    logger.error(err.stack || '');
});

process.on('unhandledRejection', (reason) => {
    logger.error(`[UNHANDLED REJECTION] ${String(reason)}`);
});

process.on('SIGTERM', () => {
    logger.system('SIGTERM received — graceful shutdown...');
    server.close(() => { logger.system('HTTP server closed.'); process.exit(0); });
    setTimeout(() => process.exit(0), 10000).unref();
});
