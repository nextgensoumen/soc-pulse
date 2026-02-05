🚀 SOC Pulse – One-Click Wazuh SOC Deployment

SOC Pulse is a fully automated installer that deploys a complete Wazuh SIEM/SOC stack on Ubuntu cloud servers in a single command.

It installs and configures:

✅ Wazuh Manager
✅ Wazuh Indexer (OpenSearch)
✅ Wazuh Dashboard (Web UI)
✅ Service health checks
✅ Clean terminal output
✅ Automatic credential display

Perfect for SOC labs, cloud security training, and fast production testing.

📌 What This Tool Does

SOC Pulse automates the full SOC setup process:

Updates system packages

Installs required dependencies

Downloads latest Wazuh installer

Deploys full SIEM stack

Verifies all services are running

Displays dashboard URL + login credentials

Saves full installation logs

No manual configuration required.

🧱 System Requirements
Resource	Minimum	Recommended
OS	Ubuntu 22.04+	Ubuntu 22.04+
CPU	2 vCPU	4 vCPU
RAM	8 GB	16 GB
Disk	50 GB	100 GB SSD
🔐 Required Open Ports (Cloud Firewall)
22     SSH
443    Wazuh Dashboard
1514   Agent communication
1515   Agent enrollment
55000  Wazuh API


(Restrict to trusted IPs in production)

📥 Installation

Clone or download the repository:

git clone https://github.com/YOUR_USERNAME/soc-pulse.git
cd soc-pulse


Make script executable:

chmod +x wazuh_auto_install.sh


Run installer:

sudo ./wazuh_auto_install.sh

📊 During Installation You Will See
▶ Updating system packages
▶ Installing dependencies
▶ Deploying Wazuh SOC stack
▶ Checking services health


With success messages:

✔ wazuh-manager running
✔ wazuh-indexer running
✔ wazuh-dashboard running

🎉 After Installation

SOC Pulse automatically prints:

Dashboard URL: https://YOUR_SERVER_IP
Username: admin
Password: XXXXXXXX


You can immediately log in to the Wazuh Dashboard.

📄 Logs

Full installation output is saved to:

wazuh_install.log


Useful for troubleshooting or audits.

⚠️ Common Issues
Problem	Fix
Dashboard not loading	Check port 443 open
Services not running	Ensure enough RAM
Slow UI	Use SSD storage
Agent not connecting	Open ports 1514/1515
🛡 Security Notice

This tool is intended for:

✔ SOC labs
✔ training
✔ testing
✔ controlled environments

For production use:

Restrict firewall IPs

Use proper SSL certs

Harden system security

📈 Roadmap (Future Plans)

Agent auto-deployment

Firewall auto-hardening

Cloud detection (AWS/GCP)

Performance tuning

Multi-node SOC support

📜 License

MIT License — free to use, modify, and distribute.

🤝 Contributing

Pull requests are welcome!

If you improve SOC Pulse, feel free to submit enhancements.

⭐ If this helped you, give the repo a star!
