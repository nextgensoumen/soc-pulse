/**
 * SOC Pulse — Dynamic Module Registry v2.0
 * =========================================
 * timeoutSeconds: hard kill after this many seconds (prevents hung modules)
 *   - Node scanners: 5 min (fast)
 *   - Bash/system modules: 45 min (hardening can take time)
 *   - SSL manager: 10 min
 */

export const MODULE_REGISTRY = {
    1: {
        id: 1,
        name: 'Supply Chain Defense',
        description: 'Shai-Hulud 2.0 detector: 790+ compromised npm packages, SHA256 hash matching, TruffleHog activity, malicious runner detection.',
        icon: '🛡️',
        dir: 'module-supply-chain-defense',
        cmd: 'node',
        args: [
            'dist/index.js',
            '--working-directory=../dashboard',
            '--output-format=json',
            '--fail-on-critical=false',
            '--fail-on-high=false',
            '--fail-on-any=false',
            '--scan-lockfiles=true',
            '--scan-node-modules=false',
        ],
        cooldownSeconds: 30,
        timeoutSeconds:  5 * 60,   // 5 min max (Node.js scanner is fast)
        threatLevel: 'Critical',
    },
    2: {
        id: 2,
        name: 'Web App Scanner',
        description: 'Hunts CVE-2025-55182 (CVSS 10.0 RCE) in React Server Components — scans lockfiles, live URLs, Docker images, and SBOMs.',
        icon: '🌐',
        dir: 'module-webapp-scanner',
        cmd: 'node',
        args: ['dist/cli/index.js', '../dashboard', '--json', '--no-exit-on-vuln'],
        cooldownSeconds: 30,
        timeoutSeconds:  5 * 60,   // 5 min max
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
        timeoutSeconds:  45 * 60,  // 45 min (hardening runs many heavy tools)
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
        timeoutSeconds:  30 * 60,  // 30 min (Ansible playbooks can be slow)
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
        timeoutSeconds:  10 * 60,  // 10 min (cert operations + ACME challenge)
        threatLevel: 'Low',
        // exit code 1 = dependency warning (certbot not yet installed)
        // audit still ran successfully — treat as Completed not Failed
        allowedExitCodes: [1],
    },
};

export const getAllModules  = () => Object.values(MODULE_REGISTRY);
export const getModuleById  = (id) => MODULE_REGISTRY[id] || null;
