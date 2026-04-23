/**
 * SOC Pulse — Dynamic Module Registry
 * =====================================
 * This is the single source of truth for all security modules.
 * To add a new module in the future, simply append a new entry here.
 * No changes to routing, runner, or frontend code are needed.
 */

export const MODULE_REGISTRY = {
    1: {
        id: 1,
        name: 'Supply Chain Defense',
        description: 'Scans NPM dependency trees against the SOC Pulse threat database.',
        icon: '🛡️',
        dir: 'module-supply-chain-defense',
        cmd: 'node',
        args: ['dist/index.js', '--working-directory=../dashboard'],
        cooldownSeconds: 30,
        threatLevel: 'Low',
    },
    2: {
        id: 2,
        name: 'Web App Scanner',
        description: 'Hunts CVE-2025-55182 (CVSS 10.0 RCE) in React Server Components — scans lockfiles, live URLs, Docker images, and SBOMs.',
        icon: '🌐',
        dir: 'module-webapp-scanner',
        cmd: 'node',
        // Scans the SOC Pulse dashboard itself for vulnerable RSC packages
        // Additional modes available: scan-url <url>, scan-image <image>, fix --install
        args: ['dist/cli/index.js', '../dashboard', '--json', '--no-exit-on-vuln'],
        cooldownSeconds: 30,
        threatLevel: 'Critical',
    },
    3: {
        id: 3,
        name: 'System Endpoint Hardening',
        description: 'Injects Kernel Sysctls, AIDE, Fail2Ban without severing AWS SSH.',
        icon: '🔐',
        dir: 'module-aws-hardening',
        cmd: 'bash',
        args: ['ubuntu-aws-hardening.sh'],
        cooldownSeconds: 60,
        threatLevel: 'Low',
    },
    4: {
        id: 4,
        name: 'Autonomous Remediation',
        description: 'Multi-CVE scanner: Log4Shell, XZ-Backdoor, regreSSHion, Dirty Pipe, PwnKit, Looney Tunables.',
        icon: '🩹',
        dir: 'module-ir-cve-patcher',
        cmd: 'bash',
        args: ['cve-aws-orchestrator.sh'],
        cooldownSeconds: 60,
        threatLevel: 'High',
    },
    5: {
        id: 5,
        name: 'Machine IP Cryptography',
        description: 'Audits Certbot ACME configurations for 6-day IP certificate rotations.',
        icon: '🔑',
        dir: 'module-aws-ssl-manager',
        cmd: 'bash',
        args: ['ubuntu-cert-manager.sh'],
        cooldownSeconds: 30,
        threatLevel: 'Low',
    },
};

/**
 * Helper: returns all module registry entries as an array
 */
export const getAllModules = () => Object.values(MODULE_REGISTRY);

/**
 * Helper: returns a single module config by ID
 */
export const getModuleById = (id) => MODULE_REGISTRY[id] || null;
