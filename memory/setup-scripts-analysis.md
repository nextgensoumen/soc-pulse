# Setup Scripts — Current State (v2.1)

## Single Entry Point
```bash
./soc-pulse-start.sh   # run as root, does EVERYTHING
```
Sub-scripts (02/03/04) still exist but are NOT called by the master script.
Everything is inlined in `soc-pulse-start.sh` for reliability.

## What soc-pulse-start.sh Does (in order)
1. `apt-get update -y -qq` — non-interactive, never hangs (DEBIAN_FRONTEND=noninteractive)
2. Install system tools: curl wget git python3 python3-pip gcc make jq unzip
3. Install Ansible (apt first, pip3 fallback for Ubuntu 20.04)
4. Install Node.js v20 LTS (NodeSource → snap fallback)
5. Resolve `NODE_BIN=$(which node)` + create `/usr/local/bin/node` symlink (snap fix)
6. Install pm2 globally (`npm install -g pm2`)
7. Build Web App Scanner TypeScript (`npm run build` in module-webapp-scanner/)
8. `npm install` backend dependencies
9. `npm install` dashboard dependencies
10. Stop old pm2 instances, start both with `--interpreter $NODE_BIN`
11. `pm2 save` + `pm2 startup` (survives VM reboot)
12. Health check loop on localhost:5000/api/health (waits up to 30s)
13. Print public IP + access URL

## Confirmed Working On (Live Test)
- Ubuntu 22.04 LTS (AWS EC2 t2/t3 instances)
- Node.js v20.20.2 (installed via snap fallback)
- pm2 v6.0.14

## Known Bugs Fixed

### Bug 1: apt-get upgrade hangs forever
- **Cause:** kernel/grub interactive prompt on cloud VMs
- **Fix:** Removed `apt-get upgrade`. Use `apt-get update` only.

### Bug 2: Backend silent crash under pm2 (MOST CRITICAL)
- **Symptom:** pm2 shows backend as blank status + 0b memory, log files empty
- **Root Cause:** Ubuntu installs Node.js via snap to `/snap/bin/node`. pm2's background
  daemon does NOT have `/snap/bin` in its PATH. pm2 can't find `node` binary to spawn
  server.js → process never starts → completely empty logs.
- **Proof:** `node server.js` worked perfectly, client connected, API responded.
  Only pm2 spawn was broken.
- **Fix:**
  1. `NODE_BIN=$(which node)` — resolve real binary path after install
  2. `ln -sf $NODE_BIN /usr/local/bin/node` — symlink to system PATH
  3. `pm2 start server.js --interpreter $NODE_BIN` — pass explicit path to pm2
- **Manual hotfix (for already-deployed instances):**
  ```bash
  ln -sf /snap/bin/node /usr/local/bin/node
  pm2 delete soc-pulse-backend
  pm2 start /home/ubuntu/soc-pulse/backend/server.js \
      --name soc-pulse-backend \
      --cwd /home/ubuntu/soc-pulse/backend \
      --interpreter /snap/bin/node \
      --max-restarts 10
  pm2 save
  ```

### Bug 3: Backend ESM crash (--cwd missing)
- **Cause:** pm2 ran server.js from project root, not backend/. Node.js couldn't
  find `backend/package.json` with `"type":"module"` → treated as CJS → import crash
- **Fix:** Added `--cwd $SOC_ROOT/backend` to pm2 start command

### Bug 4: Health check too short
- **Cause:** 20s wait wasn't enough on cold Ubuntu instances
- **Fix:** Extended to 30s wait with 1s sleep intervals

## pm2 Management Commands
```bash
pm2 list                  # view status of all processes
pm2 logs                  # live log stream (both services)
pm2 logs soc-pulse-backend --lines 30   # backend logs only
pm2 restart all           # restart both services
pm2 stop all              # stop both services
pm2 save                  # persist current state for reboot
```

## Access After Deploy
- Dashboard: http://<PUBLIC_IP>:5173
- Backend:   http://<PUBLIC_IP>:5000/api/health
- **Ports 5173 + 5000 must be open in AWS Security Group inbound rules**
