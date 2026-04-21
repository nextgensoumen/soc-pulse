# deep-analysis: Master Orchestrator & Setup Flow

## Overview
The root execution of the SOC Pulse platform is entirely orchestrated by the `./soc-pulse-start.sh` script, which sequentially triggers three separate setup scripts located in the `setup/` directories.

## The Execution Pipeline
Running `./soc-pulse-start.sh` triggers this exact flow:

### 1. `setup/01-check-prerequisites.sh`
- **Purpose:** Verifies if the AWS Ubuntu machine actually has the absolute bare minimum software needed to compile/build everything else.
- **Checks:** `curl`, `wget`, `git`, `python3`, `python3-pip`, `gcc`, `make`, `ansible`, `node`, `npm`.
- **Logic:** It loops through this array. If any command is missing, it flags it as `MISSING` and throws a warning instructing you to run step 02. If all exist, it says you can jump straight to step 03.

### 2. `setup/02-install-dependencies.sh`
- **Purpose:** Environment bootstrapping and forced installation of missing packages.
- **Logic:** 
  - Runs a massive `sudo apt-get update -y` and `sudo apt-get upgrade -y` across the server.
  - Re-loops through the same dependency array (`curl`, `wget`, `gcc`, `make`, `ansible`, etc.) and forcibly installs them quietly via `sudo apt-get install -y <pkg>`.
  - **Special Case:** Node.js. If Node or NPM is missing, it explicitly curls the NodeSource setup script for `Node v20.x` and installs it, bypassing standard outdated Ubuntu repos.

### 3. `setup/03-run-dashboard.sh`
- **Purpose:** Bootstraps the React dashboard frontend.
- **Logic:** 
  - `cd dashboard`
  - Runs `npm install --silent` to grab Vite and React dependencies.
  - Launches the Vite development server globally via `npm run dev -- --host 0.0.0.0`
  - *Note:* The `--host 0.0.0.0` flag is critical because it forces the web server to bind to every network interface, allowing the dashboard to be reachable over the internet via the AWS Public IP on port `5173`.

## The Developer Loop Checkpoint
This orchestrator setup is the bridge between the React frontend code we fixed earlier and the heavy security bash scripts we analyzed in the modules. Running this `./soc-pulse-start.sh` on the AWS instance will be our very first test to see if the environment initializes properly without errors.
