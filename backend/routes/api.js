import express from 'express';
import { runModule, stopModule, getStatus, getActiveList } from '../services/moduleRunner.js';
import { getAllModules, getModuleById } from '../config/modules.registry.js';
import { getAllHistory, getModuleHistory, getModuleStats, getPlatformStats } from '../services/scanHistory.js';
import { logger } from '../services/logger.js';

// ── Rate limiting: per-module cooldown tracker ─────────────────────────────────
const cooldownTracker = new Map();

const getCooldownRemaining = (moduleId) => {
    const lastCompleted = cooldownTracker.get(moduleId);
    if (!lastCompleted) return 0;
    const module = getModuleById(moduleId);
    const cooldownMs = (module?.cooldownSeconds || 30) * 1000;
    const remaining  = cooldownMs - (Date.now() - lastCompleted);
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

export const createApiRouter = (io) => {
    const router = express.Router();

    // ── GET /api/modules ───────────────────────────────────────────────────────
    // Full module status list including cooldown and last scan verdict
    router.get('/', (req, res) => {
        const statuses = getAllModules().map(mod => {
            const stats = getModuleStats(mod.id);
            return {
                id:               mod.id,
                name:             mod.name,
                description:      mod.description,
                icon:             mod.icon,
                threatLevel:      mod.threatLevel,
                isRunning:        getStatus(mod.id),
                cooldownRemaining: getCooldownRemaining(mod.id),
                lastStatus:       stats?.lastStatus    || 'Never Run',
                lastVerdict:      stats?.lastVerdict   || null,
                lastRun:          stats?.lastRun       || null,
                totalRuns:        stats?.totalRuns     || 0,
                successRate:      stats?.successRate   || 'N/A',
                avgDuration:      stats?.avgDurationHuman || 'N/A',
            };
        });
        res.json({ success: true, statuses });
    });

    // ── GET /api/modules/active ────────────────────────────────────────────────
    // Returns list of currently running module IDs
    router.get('/active', (req, res) => {
        res.json({ success: true, activeModules: getActiveList() });
    });

    // ── GET /api/modules/stats ─────────────────────────────────────────────────
    // Platform-wide threat statistics (total scans, vulnerable counts, etc.)
    router.get('/stats', (req, res) => {
        res.json({ success: true, stats: getPlatformStats() });
    });

    // ── GET /api/modules/history ───────────────────────────────────────────────
    // Last N scan records. Supports ?limit=N and ?moduleId=N query params.
    router.get('/history', (req, res) => {
        const limit    = Math.min(parseInt(req.query.limit) || 20, 200);
        const moduleId = req.query.moduleId;

        const history = moduleId
            ? getModuleHistory(moduleId, limit)
            : getAllHistory().slice(0, limit);

        res.json({ success: true, count: history.length, history });
    });

    // ── GET /api/modules/:id ───────────────────────────────────────────────────
    // Single module detail: config + live status + stats
    router.get('/:id', (req, res) => {
        const id = parseInt(req.params.id, 10);
        const module = getModuleById(id);
        if (!module) return res.status(404).json({ success: false, message: 'Module not found.' });

        const stats = getModuleStats(id);
        res.json({
            success: true,
            module: {
                ...module,
                isRunning:         getStatus(id),
                cooldownRemaining: getCooldownRemaining(id),
                stats,
            },
        });
    });

    // ── GET /api/modules/:id/history ──────────────────────────────────────────
    router.get('/:id/history', (req, res) => {
        const id     = parseInt(req.params.id, 10);
        const limit  = Math.min(parseInt(req.query.limit) || 10, 50);
        const module = getModuleById(id);
        if (!module) return res.status(404).json({ success: false, message: 'Module not found.' });

        res.json({
            success:    true,
            moduleId:   id,
            moduleName: module.name,
            history:    getModuleHistory(id, limit),
        });
    });

    // ── GET /api/modules/:id/stats ────────────────────────────────────────────
    router.get('/:id/stats', (req, res) => {
        const id = parseInt(req.params.id, 10);
        const module = getModuleById(id);
        if (!module) return res.status(404).json({ success: false, message: 'Module not found.' });

        const stats = getModuleStats(id);
        res.json({ success: true, moduleId: id, moduleName: module.name, stats });
    });

    // ── POST /api/modules/:id/start ───────────────────────────────────────────
    router.post('/:id/start', (req, res) => {
        const id     = parseInt(req.params.id, 10);
        const module = getModuleById(id);

        if (!module) {
            return res.status(404).json({ success: false, message: 'Module configuration not found.' });
        }

        const cooldownRemaining = getCooldownRemaining(id);
        if (cooldownRemaining > 0) {
            logger.warn(`Module ${id} blocked — cooldown ${cooldownRemaining}s remaining`);
            return res.status(429).json({
                success: false,
                message: `Module in cooldown. Wait ${cooldownRemaining}s.`,
                cooldownRemaining,
            });
        }

        // Optional per-module timeout override from registry (seconds → ms)
        const timeoutMs = (module.timeoutSeconds || 30 * 60) * 1000;

        try {
            const onComplete = () => {
                cooldownTracker.set(id, Date.now());
                logger.info(`Module ${id} (${module.name}) — cooldown started (${module.cooldownSeconds || 60}s)`);
            };

            const result = runModule(
                id, module.name, module.dir,
                module.cmd, module.args,
                io, onComplete, timeoutMs, module
            );
            res.json(result);
        } catch (error) {
            logger.error(`Failed to start Module ${id}: ${error.message}`);
            res.status(400).json({ success: false, message: error.message });
        }
    });

    // ── POST /api/modules/:id/stop ────────────────────────────────────────────
    router.post('/:id/stop', (req, res) => {
        const id = parseInt(req.params.id, 10);
        try {
            const result = stopModule(id, io);
            cooldownTracker.set(id, Date.now());
            res.json(result);
        } catch (error) {
            logger.error(`Failed to stop Module ${id}: ${error.message}`);
            res.status(400).json({ success: false, message: error.message });
        }
    });

    return router;
};
