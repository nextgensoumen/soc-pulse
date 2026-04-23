# Setup Scripts — Current State (v2.0)

## Single Entry Point
```bash
./soc-pulse-start.sh   # run as root, does EVERYTHING
```
Sub-scripts (02/03/04) still exist but are NOT called by the master script anymore.
Everything is inlined in `soc-pulse-start.sh` for reliability.

## What soc-pulse-start.sh Does (in order)
1. `apt-get update -y -qq` — non-interactive, never hangs (DEBIAN_FRONTEND=noninteractive)
2. Install system tools: curl wget git python3 python3-pip gcc make jq unzip
3. Install Ansible (apt first, pip3 fallback for Ubuntu 20.04)
4. Install Node.js v20 LTS (NodeSource → snap fallback)
5. Install pm2 globally (`npm install -g pm2`)
6. Build Web App Scanner TypeScript (`npm run build` in module-webapp-scanner/)
7. `npm install` backend dependencies
8. `npm install` dashboard dependencies
9. Stop old pm2 instances, start `soc-pulse-backend` + `soc-pulse-dashboard`
10. `pm2 save` + `pm2 startup` (survives VM reboot)
11. Health check loop on localhost:5000/api/health (waits up to 10s)
12. Print public IP + access URL

## Key Fixes Applied
- `apt-get upgrade` REMOVED (was hanging 30+ min on kernel/grub prompts on cloud VMs)
- NEEDRESTART_MODE=a + NEEDRESTART_SUSPEND=1 (suppresses service restart prompts)
- pm2 replaces bare `npm start` — survives SSH disconnect
- Node version check: only installs if current version < 18
- ansible pip3 fallback for Ubuntu 20.04

## pm2 Alternative (if already installed)
```bash
pm2 start ecosystem.config.cjs   # starts both services
pm2 list                          # view status
pm2 logs                          # live log stream
pm2 restart all                   # restart both
pm2 stop all                      # stop both
```

## Access After Deploy
- Dashboard: http://<PUBLIC_IP>:5173
- Backend:   http://<PUBLIC_IP>:5000/api/health
- Ports 5173 + 5000 must be open in Security Group / Firewall
