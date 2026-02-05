<div align="center">

# 🚀 SOC Pulse
### One-Click Wazuh SOC Deployment

[![Wazuh](https://img.shields.io/badge/Wazuh-4.14-blue?style=for-the-badge&logo=wazuh)](https://wazuh.com/)
[![Ubuntu](https://img.shields.io/badge/Ubuntu-22.04%2B-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)](https://ubuntu.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/nextgensoumen/soc-pulse/graphs/commit-activity)

**Deploy a production-ready Wazuh SIEM/SOC stack on Ubuntu cloud servers with a single command.**

[Features](#-features) • [Requirements](#-system-requirements) • [Installation](#-installation) • [Troubleshooting](#-troubleshooting-common-issues) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**SOC Pulse** is a fully automated installer designed to simplify the deployment of a complete Wazuh SIEM/SOC stack. Whether you are setting up a SOC lab, conducting cloud security training, or deploying a fast production test environment, SOC Pulse acts as your "Easy Button."

It handles everything from system updates to service configuration, delivering a fully functional Wazuh instance in minutes without manual intervention.

## ✨ Features

- **Full Stack Deployment**: Installs Wazuh Manager, Wazuh Indexer (OpenSearch), and Wazuh Dashboard.
- **Automated Configuration**: Handles all inter-service communication and setup.
- **Health Checks**: validaties that all services are active and running post-installation.
- **Credential Management**: Automatically retrieves and displays login credentials upon completion.
- **Clean Output**: Provides a structured and readable terminal output during the installation process.
- **Log Archival**: Saves a detailed installation log (`wazuh_install.log`) for auditing and troubleshooting.

## 🧱 System Requirements

For optimal performance, we recommend the following specifications for a single-node deployment (Manager + Indexer + Dashboard on one server):

| Resource | Minimum | Recommended |
| :--- | :--- | :--- |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 / 24.04 LTS |
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | 4 GB | 8 GB+ |
| **Disk** | 50 GB | 100 GB SSD |

### 🔐 Network Requirements (Ports)

Ensure the following ports are open on your cloud firewall (Security Group):

| Port | Protocol | Service | Description |
| :--- | :--- | :--- | :--- |
| **22** | TCP | SSH | Remote access |
| **443** | TCP | HTTPS | Wazuh Dashboard (Web UI) |
| **1514** | TCP | Wazuh | Agent communication |
| **1515** | TCP | Wazuh | Agent enrollment |
| **55000** | TCP | Wazuh API | Management API |

> [!WARNING]
> **Production Security**: In a production environment, restrict access to port **443** (Dashboard) and **22** (SSH) to your trusted IP addresses only.

## 📥 Installation

Follow these steps to deploy your SOC.

### 1. Clone the Repository
Connect to your Ubuntu server via SSH and clone the repository:
```bash
git clone https://github.com/nextgensoumen/soc-pulse.git
cd soc-pulse
```

### 2. Make Script Executable
Ensure the installer has execution permissions:
```bash
chmod +x wazuh_auto_install.sh
```

### 3. Run the Installer
Execute the script with root privileges:
```bash
sudo ./wazuh_auto_install.sh
```

---

## 📊 Installation Process

Once started, **SOC Pulse** will automatically perform the following actions:
1.  **▶ Updating system packages** - Ensures the OS is up to date.
2.  **▶ Installing dependencies** - Sets up necessary tools (curl, unzips, etc.).
3.  **▶ Deploying Wazuh SOC stack** - Downloads and installs the latest Wazuh components.
4.  **▶ Checking services health** - Verifies Manager, Indexer, and Dashboard status.
5.  **▶ Fetching credentials** - Retrieves the generated admin password.

### 🎉 Success Output
Upon successful completion, you will see a summary like this:

```text
===========================================
       🎉 WAZUH SOC READY TO USE 🎉
===========================================

🌐 Dashboard:
https://<YOUR_SERVER_IP>

👤 Username: admin
🔐 Password: <GENERATED_PASSWORD>

📄 Install log: wazuh_install.log
===========================================
```

You can now navigate to the **Dashboard URL** in your browser and log in with the provided credentials.

## ⚠️ Troubleshooting / Common Issues

| Problem | Possible Fix |
| :--- | :--- |
| **Dashboard not loading** | Check if port **443** is allowed in your cloud firewall rules. |
| **Services failed to start** | Verify you have at least **4GB RAM**. Check system logs using `journalctl -xe`. |
| **Slow UI Performance** | Ensure you are using **SSD** storage and meeting CPU requirements. |
| **Agents not connecting** | Ensure ports **1514** and **1515** are open and accessible from the agent's network. |

**Logs**: If the installation fails, check the full log file for details:
```bash
cat wazuh_install.log
```

## 🛡 Security Notice

This tool is optimized for **Labs**, **Training**, and **POC (Proof of Concept)** environments.

For **Production** deployments, we strongly recommend:
-  Restricting Firewall access (Allowlisting IPs).
-  Replacing self-signed certificates with valid SSL certificates (e.g., Let's Encrypt).
-  Hardening the OS and Wazuh configuration.

## 📈 Roadmap

- [ ] Agent auto-deployment script
- [ ] Automated firewall hardening (UFW/IPTables)
- [ ] Cloud-specific detection rules (AWS/GCP)
- [ ] Support for Multi-node clusters

## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements or bug fixes:
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ for the Security Community</sub>
</div>












