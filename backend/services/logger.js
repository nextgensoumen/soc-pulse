/**
 * SOC Pulse — Structured Logger
 * ================================
 * Zero-dependency structured logger with timestamps and log levels.
 * Replaces all raw console.log calls across the backend.
 *
 * Log Levels: INFO | START | DONE | WARN | ERROR | SYSTEM
 */

const COLORS = {
    INFO:   '\x1b[36m',   // Cyan
    START:  '\x1b[33m',   // Yellow
    DONE:   '\x1b[32m',   // Green
    WARN:   '\x1b[33m',   // Yellow
    ERROR:  '\x1b[31m',   // Red
    SYSTEM: '\x1b[35m',   // Magenta
    RESET:  '\x1b[0m',
    DIM:    '\x1b[2m',
    BOLD:   '\x1b[1m',
};

const formatTimestamp = () => new Date().toISOString();

const log = (level, message) => {
    const timestamp = formatTimestamp();
    const color = COLORS[level] || COLORS.INFO;
    const paddedLevel = level.padEnd(6);
    console.log(
        `${COLORS.DIM}[${timestamp}]${COLORS.RESET} ${color}${COLORS.BOLD}[${paddedLevel}]${COLORS.RESET} ${message}`
    );
};

export const logger = {
    info:   (msg) => log('INFO',   msg),
    start:  (msg) => log('START',  msg),
    done:   (msg) => log('DONE',   msg),
    warn:   (msg) => log('WARN',   msg),
    error:  (msg) => log('ERROR',  msg),
    system: (msg) => log('SYSTEM', msg),
};
