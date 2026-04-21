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
