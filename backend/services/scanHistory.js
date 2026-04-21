/**
 * SOC Pulse — Persistent Scan History Engine
 * ============================================
 * Saves the last N scan results to a local JSON file so that
 * audit history survives server restarts and page refreshes.
 *
 * Storage: backend/data/scan-history.json (auto-created)
 * Max records: 100 total across all modules (circular buffer)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR  = path.join(__dirname, '../data');
const HISTORY_FILE = path.join(DATA_DIR, 'scan-history.json');
const MAX_RECORDS = 100;

// Ensure data directory exists on startup
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Load history from disk, returning empty array on failure
 */
const loadHistory = () => {
    try {
        if (!fs.existsSync(HISTORY_FILE)) return [];
        const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
        return JSON.parse(raw);
    } catch {
        return [];
    }
};

/**
 * Persist history array to disk
 */
const saveHistory = (records) => {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(records, null, 2), 'utf8');
    } catch (err) {
        logger.error(`Failed to write scan history: ${err.message}`);
    }
};

/**
 * Record a completed scan result
 * @param {object} entry - Scan result to record
 * @param {number} entry.moduleId
 * @param {string} entry.moduleName
 * @param {string} entry.startTime  - ISO string
 * @param {string} entry.endTime    - ISO string
 * @param {number} entry.durationMs
 * @param {number} entry.exitCode
 * @param {string} entry.status     - 'Completed' | 'Failed' | 'Stopped'
 * @param {string[]} entry.logSnippet - Last 50 lines of stdout captured
 */
export const recordScan = (entry) => {
    const history = loadHistory();

    const record = {
        id: `scan_${Date.now()}`,
        moduleId:    entry.moduleId,
        moduleName:  entry.moduleName,
        startTime:   entry.startTime,
        endTime:     entry.endTime,
        durationMs:  entry.durationMs,
        durationHuman: `${(entry.durationMs / 1000).toFixed(1)}s`,
        exitCode:    entry.exitCode,
        status:      entry.status,
        logSnippet:  (entry.logSnippet || []).slice(-50),
    };

    history.unshift(record); // Most recent first

    // Trim to max records (circular buffer)
    if (history.length > MAX_RECORDS) {
        history.splice(MAX_RECORDS);
    }

    saveHistory(history);
    logger.done(`Scan history saved — Module ${entry.moduleId} | Status: ${entry.status} | Duration: ${record.durationHuman}`);
};

/**
 * Get all scan history records (most recent first)
 */
export const getAllHistory = () => loadHistory();

/**
 * Get scan history for a specific module
 * @param {number|string} moduleId
 * @param {number} limit - Max records to return (default 10)
 */
export const getModuleHistory = (moduleId, limit = 10) => {
    const history = loadHistory();
    return history
        .filter(r => String(r.moduleId) === String(moduleId))
        .slice(0, limit);
};

/**
 * Get total scan count since history began
 */
export const getTotalScans = () => loadHistory().length;
