// pm2 ecosystem file — start all SOC Pulse services with: pm2 start ecosystem.config.cjs
// Usage: pm2 start ecosystem.config.cjs
//        pm2 restart all
//        pm2 logs

module.exports = {
    apps: [
        {
            name: 'soc-pulse-backend',
            script: 'server.js',
            cwd: './backend',
            max_restarts: 10,
            restart_delay: 2000,
            watch: false,
            output: './logs/backend-out.log',
            error: './logs/backend-err.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'production',
                PORT: 5000,
            },
        },
        {
            name: 'soc-pulse-dashboard',
            script: 'npm',
            args: 'run dev -- --host 0.0.0.0 --port 5173',
            cwd: './dashboard',
            max_restarts: 10,
            restart_delay: 3000,
            watch: false,
            output: './logs/dashboard-out.log',
            error: './logs/dashboard-err.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
            },
        },
    ],
};
