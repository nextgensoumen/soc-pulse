import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { logger } from './logger.js';
import { recordScan } from './scanHistory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to the SOC Pulse project root
const PROJECT_ROOT = path.resolve(__dirname, '../../');

// In-memory registry of running scans
const activeProcesses = new Map();

/**
 * Executes a module script in a child process and streams logs via Socket.io
 * Logs are captured in memory for scan history and broadcast live via WebSocket.
 *
 * @param {string} moduleId     - Numeric ID for this module (e.g., '1')
 * @param {string} moduleName   - Human-readable name (e.g., 'Supply Chain Defense')
 * @param {string} relativeDir  - Directory relative to PROJECT_ROOT
 * @param {string} command      - Command to execute (e.g., 'bash' or 'node')
 * @param {Array}  args         - Arguments array
 * @param {Object} io           - Socket.io server instance
 */
export const runModule = (moduleId, moduleName, relativeDir, command, args, io, onComplete = null) => {
    if (activeProcesses.has(moduleId)) {
        throw new Error(`Module ${moduleId} is already running.`);
    }

    const workingDirectory = path.join(PROJECT_ROOT, relativeDir);

    // Verify directory exists before attempting spawn
    if (!fs.existsSync(workingDirectory)) {
        throw new Error(`Directory not found: ${workingDirectory}`);
    }

    const startTime = new Date().toISOString();
    const startMs = Date.now();
    const logBuffer = []; // Capture logs for history

    logger.start(`Module ${moduleId} (${moduleName}) — launching in ${relativeDir}`);

    // Spawn the child process.
    // Always pass SOC_PULSE_HEADLESS + DEBIAN_FRONTEND so scripts run non-interactively
    // regardless of which module or user invokes them.
    const child = spawn(command, args, {
        cwd: workingDirectory,
        shell: true,
        env: {
            ...process.env,
            SOC_PULSE_HEADLESS: 'true',
            DEBIAN_FRONTEND: 'noninteractive',
        },
    });

    activeProcesses.set(moduleId, { child, startTime: startMs, moduleName });

    // ── STDOUT ────────────────────────────────────────────────────────────────
    child.stdout.on('data', (data) => {
        const text = data.toString();
        logBuffer.push(text);
        io.to(`module_${moduleId}`).emit('log_stream', {
            moduleId,
            type: 'stdout',
            message: text,
            timestamp: new Date().toISOString(),
        });
    });

    // ── STDERR ────────────────────────────────────────────────────────────────
    child.stderr.on('data', (data) => {
        const text = data.toString();
        logBuffer.push(text);
        io.to(`module_${moduleId}`).emit('log_stream', {
            moduleId,
            type: 'stderr',
            message: text,
            timestamp: new Date().toISOString(),
        });
    });

    // ── PROCESS COMPLETED ─────────────────────────────────────────────────────
    child.on('close', (code) => {
        activeProcesses.delete(moduleId);
        const endTime = new Date().toISOString();
        const durationMs = Date.now() - startMs;
        const status = code === 0 ? 'Completed' : 'Failed';

        const exitMsg = `\n[SYSTEM] Process exited with code ${code}\n`;
        logBuffer.push(exitMsg);

        // Emit to the watching room (frontend)
        io.to(`module_${moduleId}`).emit('log_stream', {
            moduleId,
            type: 'system',
            message: exitMsg,
            timestamp: endTime,
        });

        // Emit BOTH to room and server-level so any server listeners also fire
        const statusPayload = { moduleId, status, isRunning: false };
        io.to(`module_${moduleId}`).emit('module_status_change', statusPayload);
        io.emit('module_status_change', statusPayload);  // ← server-level broadcast

        // Invoke onComplete callback (sets cooldown in api.js without relying on socket events)
        if (typeof onComplete === 'function') onComplete();

        // Persist scan result to history
        recordScan({
            moduleId,
            moduleName,
            startTime,
            endTime,
            durationMs,
            exitCode: code,
            status,
            logSnippet: logBuffer,
        });

        if (code === 0) {
            logger.done(`Module ${moduleId} (${moduleName}) completed in ${(durationMs / 1000).toFixed(1)}s`);
        } else {
            logger.error(`Module ${moduleId} (${moduleName}) FAILED — exit code ${code} — ${(durationMs / 1000).toFixed(1)}s`);
        }
    });

    // ── PROCESS CRASH ─────────────────────────────────────────────────────────
    child.on('error', (err) => {
        activeProcesses.delete(moduleId);
        const endTime = new Date().toISOString();
        const durationMs = Date.now() - startMs;
        const errorMsg = `[SYSTEM ERROR] Failed to start subprocess: ${err.message}`;

        logger.error(`Module ${moduleId} (${moduleName}) spawn error — ${err.message}`);

        io.to(`module_${moduleId}`).emit('log_stream', {
            moduleId,
            type: 'error',
            message: errorMsg,
            timestamp: endTime,
        });

        const errPayload = { moduleId, status: 'Error', isRunning: false };
        io.to(`module_${moduleId}`).emit('module_status_change', errPayload);
        io.emit('module_status_change', errPayload);

        // Set cooldown even on crash so the button re-enables
        if (typeof onComplete === 'function') onComplete();

        recordScan({
            moduleId,
            moduleName,
            startTime,
            endTime,
            durationMs,
            exitCode: -1,
            status: 'Error',
            logSnippet: [errorMsg],
        });
    });

    // ── STARTED ───────────────────────────────────────────────────────────────
    io.to(`module_${moduleId}`).emit('module_status_change', {
        moduleId,
        status: 'Scanning',
        isRunning: true,
    });

    return { success: true, message: `Module ${moduleId} started.` };
};

/**
 * Forcefully stop a running module via SIGTERM
 */
export const stopModule = (moduleId, io) => {
    const processData = activeProcesses.get(moduleId);
    if (!processData) {
        throw new Error(`Module ${moduleId} is not currently running.`);
    }

    processData.child.kill('SIGTERM');
    activeProcesses.delete(moduleId);

    logger.warn(`Module ${moduleId} (${processData.moduleName}) — manually terminated by administrator`);

    io.to(`module_${moduleId}`).emit('log_stream', {
        moduleId,
        type: 'system',
        message: '\n[SYSTEM] Administrator manually terminated the process.\n',
        timestamp: new Date().toISOString(),
    });

    const stopPayload = { moduleId, status: 'Stopped', isRunning: false };
    io.to(`module_${moduleId}`).emit('module_status_change', stopPayload);
    io.emit('module_status_change', stopPayload); // server-level broadcast

    return { success: true, message: `Module ${moduleId} terminated.` };
};

/**
 * Check if a module is currently running
 */
export const getStatus = (moduleId) => activeProcesses.has(moduleId);

/**
 * Get count of currently active processes
 */
export const getActiveCount = () => activeProcesses.size;
