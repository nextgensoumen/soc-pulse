import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to the SOC Pulse project root
const PROJECT_ROOT = path.resolve(__dirname, '../../');

// In-memory registry of running scans
const activeProcesses = new Map();

/**
 * Executes a module script in a child process and streams logs via Socket.io
 * @param {string} moduleId - Unique ID for this module (e.g., 'malware-scanner')
 * @param {string} relativeDir - Directory relative to PROJECT_ROOT (e.g., 'module-malware-scanner')
 * @param {string} command - Command to execute (e.g., 'npm')
 * @param {Array<string>} args - Arguments (e.g., ['run', 'scan'])
 * @param {Object} io - Socket.io instance
 */
export const runModule = (moduleId, relativeDir, command, args, io) => {
    if (activeProcesses.has(moduleId)) {
        throw new Error(`Module ${moduleId} is already running.`);
    }

    const workingDirectory = path.join(PROJECT_ROOT, relativeDir);

    // Verify directory exists
    if (!fs.existsSync(workingDirectory)) {
        throw new Error(`Directory not found: ${workingDirectory}`);
    }

    // Spawn the child process
    const child = spawn(command, args, {
        cwd: workingDirectory,
        shell: true, // Use shell to support complex commands and scripts
    });

    activeProcesses.set(moduleId, { child, startTime: Date.now() });

    // Broadcast standard output to the designated room
    child.stdout.on('data', (data) => {
        const text = data.toString();
        io.to(`module_${moduleId}`).emit('log_stream', {
            moduleId,
            type: 'stdout',
            message: text,
            timestamp: new Date().toISOString()
        });
    });

    // Broadcast standard error
    child.stderr.on('data', (data) => {
        const text = data.toString();
        io.to(`module_${moduleId}`).emit('log_stream', {
            moduleId,
            type: 'stderr',
            message: text,
            timestamp: new Date().toISOString()
        });
    });

    // Handle process completion
    child.on('close', (code) => {
        activeProcesses.delete(moduleId);
        
        const statusMsg = `Process exited with code ${code}`;
        io.to(`module_${moduleId}`).emit('log_stream', {
            moduleId,
            type: 'system',
            message: `\n[SYSTEM] ${statusMsg}\n`,
            timestamp: new Date().toISOString()
        });

        io.to(`module_${moduleId}`).emit('module_status_change', {
            moduleId,
            status: code === 0 ? 'Completed' : 'Failed',
            isRunning: false
        });
    });

    // Handle process crash/error
    child.on('error', (err) => {
        activeProcesses.delete(moduleId);
        io.to(`module_${moduleId}`).emit('log_stream', {
            moduleId,
            type: 'error',
            message: `[SYSTEM ERROR] Failed to start subprocess: ${err.message}`,
            timestamp: new Date().toISOString()
        });
        
        io.to(`module_${moduleId}`).emit('module_status_change', {
            moduleId,
            status: 'Error',
            isRunning: false
        });
    });

    // Broadcast that it has started
    io.to(`module_${moduleId}`).emit('module_status_change', {
        moduleId,
        status: 'Scanning',
        isRunning: true
    });

    return { success: true, message: `Module ${moduleId} started.` };
};

/**
 * Attempts to forcefully stop a running module
 */
export const stopModule = (moduleId, io) => {
    const processData = activeProcesses.get(moduleId);
    if (!processData) {
        throw new Error(`Module ${moduleId} is not currently running.`);
    }

    // Force kill the child process
    processData.child.kill('SIGTERM');
    activeProcesses.delete(moduleId);

    io.to(`module_${moduleId}`).emit('log_stream', {
        moduleId,
        type: 'system',
        message: '\n[SYSTEM] Administrator manually terminated the process.\n',
        timestamp: new Date().toISOString()
    });

    io.to(`module_${moduleId}`).emit('module_status_change', {
        moduleId,
        status: 'Stopped',
        isRunning: false
    });

    return { success: true, message: `Module ${moduleId} terminated.` };
};

export const getStatus = (moduleId) => {
    return activeProcesses.has(moduleId);
};
