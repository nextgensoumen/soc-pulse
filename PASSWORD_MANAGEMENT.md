# 🔐 SOC Pulse Password Management

## 🔢 Password Management Overview
This guide explains how to manage user credentials for the **Wazuh Indexer** (internal users) and **Wazuh Server API**.

> **Note**: If you deployed Wazuh on Docker, refer to the [Docker-specific instructions](https://documentation.wazuh.com).

## 👥 User Types

### Wazuh Indexer Users
These users manage internal communication and data access:
*   **admin**: Default administrator. Used for Dashboard login and Filebeat-Indexer communication.
    *   *Impact*: Updating this requires updates in **Filebeat** config and **Wazuh Server**.
*   **kibanaserver**: Used for Dashboard-Indexer communication.
    *   *Impact*: Updating this requires updates in **Wazuh Dashboard** config.

### Wazuh Server API Users
*   **wazuh**: Default API administrator.
*   **wazuh-wui**: Admin user for Dashboard-to-API communication.
    *   *Impact*: Updating this requires updates in **Wazuh Dashboard**.

---

## 🛠 Using the Wazuh Passwords Tool
The **`wazuh-passwords-tool.sh`** script allows you to change passwords easily. It is located at:
`/usr/share/wazuh-indexer/plugins/opensearch-security/tools/`

If missing, download it:
```bash
curl -so wazuh-passwords-tool.sh https://packages.wazuh.com/4.14/wazuh-passwords-tool.sh
```

### 1. Change Password for a Single User
To change a specific user's password (e.g., `admin`).

**Syntax:**
```bash
bash wazuh-passwords-tool.sh -u <USER> -p <NEW_PASSWORD>
```

**Example:**
```bash
bash wazuh-passwords-tool.sh -u admin -p Secr3tP4ssw*rd
```

> **Password Policy**: Must be 8-64 chars, include uppercase, lowercase, number, and symbol (`.*+?-`).

**Output:**
> WARNING: Password changed. Remember to update the password in the Wazuh dashboard and Filebeat nodes if necessary, and restart the services.

### 2. Change Passwords for ALL Users
To generate and rotate passwords for **all** Wazuh Indexer users at once.

**Command:**
```bash
bash wazuh-passwords-tool.sh -a
```

**Example Output:**
```text
INFO: The password for user admin is kwd139yG?YoIK?lRnqcXQ4R4gJDlAqKn
INFO: The password for user kibanaserver is Bu1WIELh9RdRlf*oGjinN1?yhF6XzA7V
...
WARNING: Wazuh indexer passwords changed. Remember to update configuration files and restart services.
```

---

## 📜 Tool Options Reference

| Option | Purpose |
| :--- | :--- |
| `-u <USER>` | Specify user to update. |
| `-p <PASSWORD>` | Specify new password (requires `-u`). |
| `-a` | **Change ALL** indexer/API passwords and print them. |
| `-A` | Change Wazuh Server API password. |
| `-au <ADMIN>` | API Admin User (required for `-A` or `-a` API changes). |
| `-ap <PASS>` | API Admin Password (required for `-A` or `-a` API changes). |
| `-v` | Verbose mode to show full output. |

---

## ⚠️ Important Configuration Updates
After changing passwords, you **MUST** update the new credentials in the configuration files of related components (Dashboard, Filebeat, Manager) and **restart** the services.

If using **SOC Pulse** (All-in-one), the tool updates most configs automatically, but always verify connectivity after rotation.
