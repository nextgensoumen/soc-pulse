/**
 * SOC Pulse — Persistent Scan History Engine v2.0
 * ============================================
 * Improvements over v1:
 *  - Atomic writes (write to .tmp then rename) — no corruption on crash
 *  - In-memory cache — no disk read on every API call
 *  - Per-module stats (total runs, last run, success rate)
 *  - Threat summary extraction from log output (CRITICAL/VULNERABLE/PATCHED counts)
 *  - Disk cap at 500 records, in-memory cap at 200 (fast queries)
 *  - getTotalScans() no longer reads disk on every call
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const DATA_DIR     = path.join(__dirname, '../data');
const HISTORY_FILE = path.join(DATA_DIR, 'scan-history.json');
const HISTORY_TMP  = path.join(DATA_DIR, 'scan-history.tmp.json');
const MAX_DISK     = 500;   // total records persisted to disk
const MAX_MEMORY   = 200;   // records kept in-memory cache

// ── In-memory cache (avoids disk read on every API call) ──────────────────────
let _cache = null;

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Load history from disk into cache (only once per process lifetime unless
 * cache is explicitly invalidated).
 */
const loadHistory = () => {
    if (_cache !== null) return _cache;
    try {
        if (!fs.existsSync(HISTORY_FILE)) { _cache = []; return _cache; }
        const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
        _cache = JSON.parse(raw);
    } catch {
        _cache = [];
    }
    return _cache;
};

/**
 * Atomic write: write to .tmp file then rename — prevents corrupt JSON on crash.
 */
const saveHistory = (records) => {
    try {
        const data = JSON.stringify(records, null, 2);
        fs.writeFileSync(HISTORY_TMP, data, 'utf8');
        fs.renameSync(HISTORY_TMP, HISTORY_FILE);   // atomic on Linux/ext4
    } catch (err) {
        logger.error(`Failed to write scan history: ${err.message}`);
    }
};

/**
 * Extract a brief threat summary from raw log output lines.
 * Scans stdout/stderr for key security indicators.
 */
const extractThreatSummary = (logLines) => {
    const text = Array.isArray(logLines) ? logLines.join('\n') : String(logLines || '');
    const summary = {
        vulnerable:  (text.match(/VULNERABLE/gi)  || []).length,
        patched:     (text.match(/PATCHED|REMEDIATED|FIXED/gi) || []).length,
        critical:    (text.match(/CRITICAL/gi)    || []).length,
        safe:        (text.match(/\bSAFE\b|NOT VULNERABLE/gi) || []).length,
        errors:      (text.match(/\[ERROR\]|\[✗\]|error:/gi)  || []).length,
    };
    // Overall threat verdict
    if (summary.vulnerable > 0)  summary.verdict = 'VULNERABLE';
    else if (summary.patched > 0) summary.verdict = 'PATCHED';
    else if (summary.critical > 0) summary.verdict = 'CRITICAL';
    else if (summary.errors > 0)   summary.verdict = 'ERROR';
    else                           summary.verdict = 'CLEAN';
    return summary;
};

/**
 * Record a completed scan result.
 */
export const recordScan = (entry) => {
    const history = loadHistory();

    const logLines  = entry.logSnippet || [];
    const lastLines = logLines.slice(-100);  // keep last 100 lines max

    const record = {
        id:           `scan_${Date.now()}_mod${entry.moduleId}`,
        moduleId:     entry.moduleId,
        moduleName:   entry.moduleName,
        startTime:    entry.startTime,
        endTime:      entry.endTime,
        durationMs:   entry.durationMs,
        durationHuman:`${(entry.durationMs / 1000).toFixed(1)}s`,
        exitCode:     entry.exitCode,
        status:       entry.status,
        threatSummary: extractThreatSummary(logLines),
        logSnippet:   lastLines,
    };

    history.unshift(record);  // most recent first

    // Trim in-memory cache
    if (history.length > MAX_MEMORY) history.splice(MAX_MEMORY);
    _cache = history;

    // Persist trimmed copy (max MAX_DISK records)
    const toSave = history.slice(0, MAX_DISK);
    saveHistory(toSave);

    logger.done(
        `Scan recorded — Module ${entry.moduleId} | ${entry.status} | ` +
        `${record.durationHuman} | verdict: ${record.threatSummary.verdict}`
    );
};

/** All history records, most recent first. O(1) — served from cache. */
export const getAllHistory = () => loadHistory();

/** History for a single module. */
export const getModuleHistory = (moduleId, limit = 10) => {
    return loadHistory()
        .filter(r => String(r.moduleId) === String(moduleId))
        .slice(0, limit);
};

/** Total scan count. O(1) — no disk read. */
export const getTotalScans = () => loadHistory().length;

/**
 * Per-module statistics summary:
 * totalRuns, successRate, avgDurationMs, lastRun, lastStatus, lastVerdict
 */
export const getModuleStats = (moduleId) => {
    const records = getModuleHistory(moduleId, 100);
    if (records.length === 0) return null;

    const completed = records.filter(r => r.status === 'Completed');
    const avgDuration = records.reduce((sum, r) => sum + (r.durationMs || 0), 0) / records.length;

    return {
        moduleId,
        totalRuns:     records.length,
        successCount:  completed.length,
        failCount:     records.length - completed.length,
        successRate:   `${((completed.length / records.length) * 100).toFixed(0)}%`,
        avgDurationMs: Math.round(avgDuration),
        avgDurationHuman: `${(avgDuration / 1000).toFixed(1)}s`,
        lastRun:       records[0]?.endTime || null,
        lastStatus:    records[0]?.status || null,
        lastVerdict:   records[0]?.threatSummary?.verdict || null,
    };
};

/**
 * Platform-wide threat statistics across all modules.
 */
export const getPlatformStats = () => {
    const history = loadHistory();
    const totals = { vulnerable: 0, patched: 0, critical: 0, safe: 0, errors: 0 };

    for (const r of history) {
        const ts = r.threatSummary || {};
        totals.vulnerable += ts.vulnerable || 0;
        totals.patched    += ts.patched    || 0;
        totals.critical   += ts.critical   || 0;
        totals.safe       += ts.safe       || 0;
        totals.errors     += ts.errors     || 0;
    }

    return {
        totalScans: history.length,
        ...totals,
        lastScan: history[0]?.endTime || null,
    };
};
