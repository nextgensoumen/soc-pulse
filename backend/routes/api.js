import express from 'express';
import { runModule, stopModule, getStatus } from '../services/moduleRunner.js';

export const createApiRouter = (io) => {
    const router = express.Router();

    // Hardcoded mapping of dashboard module IDs to their respective bash/npm execution commands
    const MODULE_CONFIG = {
        1: { dir: 'module-malware-scanner', cmd: 'npm', args: ['test'] }, // Placeholder safely
        2: { dir: 'module-webapp-scanner', cmd: 'npx', args: ['react2shell-guard', '.', '--json'] },
        3: { dir: 'module-server-hardening', cmd: 'bash', args: ['ubuntu-hardening-24-04.sh', '--audit-only'] }, // Run safely
        4: { dir: 'module-ir-cve-patcher', cmd: 'bash', args: ['ubuntu-remediate.sh'] },
        5: { dir: 'module-ssl-manager', cmd: 'bash', args: ['letsencrypt-ip-ssl-manager.sh', '--status'] }, // Status check
    };

    // Get current status of all modules
    router.get('/', (req, res) => {
        const statuses = Object.keys(MODULE_CONFIG).map(id => ({
            id: parseInt(id),
            isRunning: getStatus(id)
        }));
        res.json({ success: true, statuses });
    });

    // Start a module
    router.post('/:id/start', (req, res) => {
        const id = req.params.id;
        const config = MODULE_CONFIG[id];

        if (!config) {
            return res.status(404).json({ success: false, message: 'Module configuration not found.' });
        }

        try {
            const result = runModule(id, config.dir, config.cmd, config.args, io);
            res.json(result);
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    });

    // Stop a module
    router.post('/:id/stop', (req, res) => {
        const id = req.params.id;

        try {
            const result = stopModule(id, io);
            res.json(result);
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    });

    return router;
};
