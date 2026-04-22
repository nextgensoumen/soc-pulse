import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createApiRouter } from './routes/api.js';
import { logger } from './services/logger.js';
import { getActiveCount } from './services/moduleRunner.js';
import { getTotalScans } from './services/scanHistory.js';

const app = express();
const server = http.createServer(app);

// Allow WebSockets and API requests from the Vite Dashboard on port 5173
// Bind correctly to all interfaces for AWS multi-subnet deployments
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.json());

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
// GET /api/health — Real-time system status for monitoring tools
app.get('/api/health', (req, res) => {
    res.json({
        status: 'operational',
        service: 'SOC Pulse Orchestration Backend',
        version: '2.0.0',
        uptime: `${(process.uptime()).toFixed(0)}s`,
        uptimeHuman: formatUptime(process.uptime()),
        nodeVersion: process.version,
        activeModules: getActiveCount(),
        totalScansRecorded: getTotalScans(),
        timestamp: new Date().toISOString(),
    });
});

// ── SYSTEM INFO ───────────────────────────────────────────────────────────────
// GET /api/system/info — Reads real OS info from the Ubuntu host
import { execSync } from 'child_process';
import os from 'os';

app.get('/api/system/info', (req, res) => {
    try {
        // Read /etc/os-release for distro info (works on all Ubuntu versions)
        let osName = 'Ubuntu';
        let osVersion = 'Unknown';
        let osCodename = '';
        let osId = 'ubuntu';

        try {
            const osRelease = execSync('cat /etc/os-release 2>/dev/null', { encoding: 'utf8', timeout: 3000 });
            const lines = osRelease.split('\n');
            const parse = (key) => {
                const line = lines.find(l => l.startsWith(key + '='));
                return line ? line.split('=')[1].replace(/"/g, '').trim() : '';
            };
            osName     = parse('NAME')           || 'Ubuntu';
            osVersion  = parse('VERSION_ID')     || 'Unknown';
            osCodename = parse('VERSION_CODENAME') || parse('UBUNTU_CODENAME') || '';
            osId       = parse('ID')             || 'ubuntu';
        } catch (_) {
            // Fallback if not on Linux (e.g., Windows dev machine)
            osName    = process.platform === 'win32' ? 'Windows' : 'Linux';
            osVersion = 'N/A';
        }

        // Kernel version
        let kernel = 'N/A';
        try {
            kernel = execSync('uname -r 2>/dev/null', { encoding: 'utf8', timeout: 2000 }).trim();
        } catch (_) {
            kernel = os.release();
        }

        // Hostname
        const hostname = os.hostname();

        // Uptime
        const uptimeSec = os.uptime();
        const uptimeHuman = formatUptime(uptimeSec);

        // CPU arch
        const arch = os.arch();

        res.json({
            success: true,
            os: {
                name: osName,
                version: osVersion,
                codename: osCodename,
                id: osId,
                displayLabel: osCodename
                    ? `${osName} ${osVersion} (${osCodename})`
                    : `${osName} ${osVersion}`,
            },
            kernel,
            hostname,
            arch,
            uptime: uptimeHuman,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        logger.error(`/api/system/info failed: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── MODULE ROUTES ─────────────────────────────────────────────────────────────
app.use('/api/modules', createApiRouter(io));

// ── SOCKET CONNECTIONS ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    logger.info(`Dashboard client connected — ${socket.id}`);

    // Allow the dashboard to subscribe to specific module log streams
    socket.on('subscribe_module', (moduleId) => {
        socket.join(`module_${moduleId}`);
        logger.info(`Client ${socket.id} subscribed to module_${moduleId}`);
    });

    socket.on('disconnect', () => {
        logger.info(`Dashboard client disconnected — ${socket.id}`);
    });
});

// ── STARTUP ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    logger.system('==================================================');
    logger.system(`🛡️  SOC Pulse Backend — live on 0.0.0.0:${PORT}`);
    logger.system(`📊  Health: http://localhost:${PORT}/api/health`);
    logger.system(`📋  History: http://localhost:${PORT}/api/modules/history`);
    logger.system('==================================================');
});

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}
