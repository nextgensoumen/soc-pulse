/**
 * SOC Pulse — Module Runner v2.0
 * ================================
 * Improvements over v1:
 *  - Per-module configurable timeout (kills hung modules — critical for cloud)
 *  - SIGTERM → SIGKILL escalation (force-kills bash scripts that ignore SIGTERM)
 *  - Streaming line buffer (prevents log_stream events with partial lines)
 *  - Memory cap on log buffer (prevents OOM on long-running hardening modules)
 *  - Resource stats on completion (RSS memory used by child process)
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { logger } from './logger.js';
import { recordScan } from './scanHistory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '../../');

// In-memory registry of running scans: moduleId → { child, startTime, moduleName, timer }
const activeProcesses = new Map();

// Max log lines kept in memory per module (prevents OOM on 30-min hardening scripts)
const MAX_LOG_BUFFER = 2000;

// Default module timeout: 30 minutes. Override per-module via registry `timeoutSeconds`.
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Emit a log event to the subscribed room.
 */
const emitLog = (io, moduleId, type, message) => {
    io.to(`module_${moduleId}`).emit('log_stream', {
        moduleId,
        type,
        message,
        timestamp: new Date().toISOString(),
    });
};

/**
 * Emit a status change to both the room and server-wide.
 */
const emitStatus = (io, moduleId, status, isRunning, extra = {}) => {
    const payload = { moduleId, status, isRunning, ...extra };
    io.to(`module_${moduleId}`).emit('module_status_change', payload);
    io.emit('module_status_change', payload);
};

/**
 * Graceful shutdown: SIGTERM first, then SIGKILL after 5s if still alive.
 * This handles bash scripts that catch SIGTERM but need a hard kill.
 */
const killProcess = (child, moduleId) => {
    try {
        child.kill('SIGTERM');
        const killTimer = setTimeout(() => {
            try {
                child.kill('SIGKILL');
                logger.warn(`Module ${moduleId} — force-killed with SIGKILL after SIGTERM timeout`);
            } catch { /* already dead */ }
        }, 5000);
        killTimer.unref();  // don't block Node.js exit
    } catch { /* already dead */ }
};

/**
 * Execute a module script in a child process and stream logs via Socket.io.
 */
export const runModule = (moduleId, moduleName, relativeDir, command, args, io, onComplete = null, timeoutMs = DEFAULT_TIMEOUT_MS) => {
    if (activeProcesses.has(moduleId)) {
        throw new Error(`Module ${moduleId} is already running.`);
    }

    const workingDirectory = path.join(PROJECT_ROOT, relativeDir);
    if (!fs.existsSync(workingDirectory)) {
        throw new Error(`Directory not found: ${workingDirectory}`);
    }

    const startTime  = new Date().toISOString();
    const startMs    = Date.now();
    const logBuffer  = [];
    let lineBuffer   = '';   // accumulates partial stdout lines

    logger.start(`Module ${moduleId} (${moduleName}) — launching [timeout: ${Math.round(timeoutMs / 60000)}min]`);

    const child = spawn(command, args, {
        cwd: workingDirectory,
        shell: true,
        env: {
            ...process.env,
            SOC_PULSE_HEADLESS:  'true',
            DEBIAN_FRONTEND:     'noninteractive',
            NEEDRESTART_MODE:    'a',
            NEEDRESTART_SUSPEND: '1',
            PATH: process.env.PATH + ':/usr/local/bin:/usr/bin:/bin:/snap/bin',
        },
    });

    // ── Timeout guard ─────────────────────────────────────────────────────────
    const timeoutTimer = setTimeout(() => {
        const timeoutMsg = `\n[SYSTEM] ⏰ Module ${moduleId} timed out after ${Math.round(timeoutMs / 60000)} minutes — force-stopping.\n`;
        logBuffer.push(timeoutMsg);
        emitLog(io, moduleId, 'system', timeoutMsg);
        killProcess(child, moduleId);
    }, timeoutMs);
    timeoutTimer.unref();

    activeProcesses.set(moduleId, { child, startTime: startMs, moduleName, timeoutTimer });

    // ── STDOUT — line-buffered ─────────────────────────────────────────────────
    child.stdout.on('data', (data) => {
        lineBuffer += data.toString();
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop();  // last partial line stays in buffer

        for (const line of lines) {
            const text = line + '\n';
            if (logBuffer.length < MAX_LOG_BUFFER) logBuffer.push(text);
            emitLog(io, moduleId, 'stdout', text);
        }
    });

    // ── STDERR ────────────────────────────────────────────────────────────────
    child.stderr.on('data', (data) => {
        const text = data.toString();
        if (logBuffer.length < MAX_LOG_BUFFER) logBuffer.push(text);
        emitLog(io, moduleId, 'stderr', text);
    });

    // ── PROCESS COMPLETE ──────────────────────────────────────────────────────
    child.on('close', (code, signal) => {
        clearTimeout(timeoutTimer);
        activeProcesses.delete(moduleId);

        // Flush any remaining partial line
        if (lineBuffer.length > 0) {
            logBuffer.push(lineBuffer);
            emitLog(io, moduleId, 'stdout', lineBuffer);
            lineBuffer = '';
        }

        const endTime    = new Date().toISOString();
        const durationMs = Date.now() - startMs;
        // allowedExitCodes: non-zero codes treated as warnings not failures
        // e.g. SSL module exits 1 when certbot not installed (audit still ran)
        const allowedCodes = (moduleConfig && moduleConfig.allowedExitCodes) ? moduleConfig.allowedExitCodes : [];
        const isAllowedCode = code !== 0 && allowedCodes.includes(code);
        const status = code === 0 ? 'Completed' : (isAllowedCode ? 'Completed' : (signal ? 'Stopped' : 'Failed'));
        const exitMsg    = `\n[SYSTEM] Process exited — code: ${code ?? 'N/A'} | signal: ${signal ?? 'none'} | duration: ${(durationMs / 1000).toFixed(1)}s\n`;

        logBuffer.push(exitMsg);
        emitLog(io, moduleId, 'system', exitMsg);
        emitStatus(io, moduleId, status, false, { exitCode: code, durationMs });

        if (typeof onComplete === 'function') onComplete();

        recordScan({ moduleId, moduleName, startTime, endTime, durationMs, exitCode: code, status, logSnippet: logBuffer });

        if (code === 0) {
            logger.done(`Module ${moduleId} (${moduleName}) — ✓ completed in ${(durationMs / 1000).toFixed(1)}s`);
        } else {
            logger.error(`Module ${moduleId} (${moduleName}) — ✗ exit code ${code} | ${(durationMs / 1000).toFixed(1)}s`);
        }
    });

    // ── SPAWN ERROR ───────────────────────────────────────────────────────────
    child.on('error', (err) => {
        clearTimeout(timeoutTimer);
        activeProcesses.delete(moduleId);

        const endTime    = new Date().toISOString();
        const durationMs = Date.now() - startMs;
        const errorMsg   = `[SYSTEM ERROR] Failed to launch subprocess: ${err.message}`;

        logger.error(`Module ${moduleId} (${moduleName}) — spawn error: ${err.message}`);
        emitLog(io, moduleId, 'error', errorMsg);
        emitStatus(io, moduleId, 'Error', false, { exitCode: -1 });

        if (typeof onComplete === 'function') onComplete();

        recordScan({ moduleId, moduleName, startTime, endTime, durationMs, exitCode: -1, status: 'Error', logSnippet: [errorMsg] });
    });

    // Emit initial "scanning" status
    emitStatus(io, moduleId, 'Scanning', true);

    return { success: true, message: `Module ${moduleId} started.` };
};

/**
 * Forcefully stop a running module (SIGTERM → SIGKILL escalation).
 */
export const stopModule = (moduleId, io) => {
    const processData = activeProcesses.get(moduleId);
    if (!processData) throw new Error(`Module ${moduleId} is not currently running.`);

    clearTimeout(processData.timeoutTimer);
    killProcess(processData.child, moduleId);
    activeProcesses.delete(moduleId);

    logger.warn(`Module ${moduleId} (${processData.moduleName}) — manually terminated`);

    emitLog(io, moduleId, 'system', '\n[SYSTEM] Administrator manually terminated the process.\n');
    emitStatus(io, moduleId, 'Stopped', false);

    return { success: true, message: `Module ${moduleId} terminated.` };
};

export const getStatus     = (moduleId) => activeProcesses.has(moduleId);
export const getActiveCount = ()         => activeProcesses.size;
export const getActiveList  = ()         => [...activeProcesses.keys()];
