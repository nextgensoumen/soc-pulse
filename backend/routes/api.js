import express from 'express';
import { runModule, stopModule, getStatus } from '../services/moduleRunner.js';
import { getAllModules, getModuleById } from '../config/modules.registry.js';
import { getAllHistory, getModuleHistory } from '../services/scanHistory.js';
import { logger } from '../services/logger.js';

// In-memory per-module cooldown tracker
// Stores last completion timestamp (ms) per moduleId
const cooldownTracker = new Map();

/**
 * Check if a module is within its cooldown window
 * @returns {number} Remaining cooldown seconds, or 0 if clear
 */
const getCooldownRemaining = (moduleId) => {
    const lastCompleted = cooldownTracker.get(moduleId);
    if (!lastCompleted) return 0;
    const module = getModuleById(moduleId);
    const cooldownMs = (module?.cooldownSeconds || 30) * 1000;
    const elapsed = Date.now() - lastCompleted;
    const remaining = cooldownMs - elapsed;
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

export const createApiRouter = (io) => {
    const router = express.Router();

    // ── GET /api/modules ──────────────────────────────────────────────────────
    // Returns current status of all registered modules
    router.get('/', (req, res) => {
        const statuses = getAllModules().map(mod => ({
            id: mod.id,
            name: mod.name,
            icon: mod.icon,
            threatLevel: mod.threatLevel,
            isRunning: getStatus(mod.id),
            cooldownRemaining: getCooldownRemaining(mod.id),
        }));
        res.json({ success: true, statuses });
    });

    // ── GET /api/modules/history ──────────────────────────────────────────────
    // Returns the last 20 scan records across all modules
    router.get('/history', (req, res) => {
        const history = getAllHistory().slice(0, 20);
        res.json({ success: true, count: history.length, history });
    });

    // ── GET /api/modules/:id/history ──────────────────────────────────────────
    // Returns the last 5 scan records for a specific module
    router.get('/:id/history', (req, res) => {
        const id = req.params.id;
        const module = getModuleById(id);
        if (!module) {
            return res.status(404).json({ success: false, message: 'Module not found.' });
        }
        const history = getModuleHistory(id, 5);
        res.json({ success: true, moduleId: id, moduleName: module.name, history });
    });

    // ── POST /api/modules/:id/start ───────────────────────────────────────────
    // Launch a module — enforces cooldown and duplicate-run protection
    router.post('/:id/start', (req, res) => {
        const id = req.params.id;
        const module = getModuleById(id);

        if (!module) {
            return res.status(404).json({ success: false, message: 'Module configuration not found.' });
        }

        // Rate limit: cooldown check
        const cooldownRemaining = getCooldownRemaining(id);
        if (cooldownRemaining > 0) {
            logger.warn(`Module ${id} (${module.name}) blocked — cooldown active (${cooldownRemaining}s remaining)`);
            return res.status(429).json({
                success: false,
                message: `Module is in cooldown. Please wait ${cooldownRemaining} seconds before re-running.`,
                cooldownRemaining,
            });
        }

        try {
            const result = runModule(id, module.name, module.dir, module.cmd, module.args, io);

            // Set cooldown when process finishes — listen for status_change
            const cooldownHandler = (data) => {
                if (String(data.moduleId) === String(id) && !data.isRunning) {
                    cooldownTracker.set(id, Date.now());
                    io.off('module_status_change', cooldownHandler);
                }
            };
            // We hook into the socket room completion signal
            io.on('module_status_change', cooldownHandler);

            res.json(result);
        } catch (error) {
            logger.error(`Failed to start Module ${id}: ${error.message}`);
            res.status(400).json({ success: false, message: error.message });
        }
    });

    // ── POST /api/modules/:id/stop ────────────────────────────────────────────
    // Forcefully terminate a running module
    router.post('/:id/stop', (req, res) => {
        const id = req.params.id;

        try {
            const result = stopModule(id, io);
            cooldownTracker.set(id, Date.now()); // Trigger cooldown on manual stop too
            res.json(result);
        } catch (error) {
            logger.error(`Failed to stop Module ${id}: ${error.message}`);
            res.status(400).json({ success: false, message: error.message });
        }
    });

    return router;
};
