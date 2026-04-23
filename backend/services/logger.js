/**
 * SOC Pulse — Structured Logger v2.0
 * =====================================
 * Improvements:
 *  - File-based logging: writes to logs/backend.log (survives pm2 restarts)
 *  - Log rotation: caps file at 10MB then renames to backend.log.1
 *  - Millisecond timestamps for precise timing
 *  - request() level for HTTP access logs
 *  - Colorized console + plain-text file (no ANSI codes in file)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const LOG_DIR  = path.resolve(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'backend.log');
const MAX_SIZE = 10 * 1024 * 1024;  // 10MB rotation threshold

// Ensure logs dir exists
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const COLORS = {
    INFO:    '\x1b[36m',   // Cyan
    START:   '\x1b[33m',   // Yellow
    DONE:    '\x1b[32m',   // Green
    WARN:    '\x1b[33m',   // Yellow
    ERROR:   '\x1b[31m',   // Red
    SYSTEM:  '\x1b[35m',   // Magenta
    REQUEST: '\x1b[34m',   // Blue
    RESET:   '\x1b[0m',
    DIM:     '\x1b[2m',
    BOLD:    '\x1b[1m',
};

let _logStream = null;

const getLogStream = () => {
    if (_logStream) return _logStream;
    _logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
    return _logStream;
};

const rotateLogs = () => {
    try {
        if (!fs.existsSync(LOG_FILE)) return;
        const stat = fs.statSync(LOG_FILE);
        if (stat.size >= MAX_SIZE) {
            if (_logStream) { _logStream.end(); _logStream = null; }
            fs.renameSync(LOG_FILE, LOG_FILE + '.1');
        }
    } catch { /* ignore rotation errors */ }
};

const log = (level, message) => {
    const ts    = new Date().toISOString();
    const color = COLORS[level] || COLORS.INFO;
    const pad   = level.padEnd(7);

    // Colorized console output
    console.log(
        `${COLORS.DIM}[${ts}]${COLORS.RESET} ${color}${COLORS.BOLD}[${pad}]${COLORS.RESET} ${message}`
    );

    // Plain-text file output (no ANSI escape codes)
    try {
        rotateLogs();
        getLogStream().write(`[${ts}] [${pad}] ${message}\n`);
    } catch { /* never crash the server for a log write failure */ }
};

export const logger = {
    info:    (msg) => log('INFO',    msg),
    start:   (msg) => log('START',   msg),
    done:    (msg) => log('DONE',    msg),
    warn:    (msg) => log('WARN',    msg),
    error:   (msg) => log('ERROR',   msg),
    system:  (msg) => log('SYSTEM',  msg),
    request: (msg) => log('REQUEST', msg),
};
