# 🔑 SOC Pulse — Module 5: Machine IP Cryptography Engine

> **Powered by [gensecaihq/LetsEncrypt-IP-SSL-Manager](https://github.com/gensecaihq/LetsEncrypt-IP-SSL-Manager) v3.0.0**

Audits and manages Let's Encrypt IP address certificates on AWS EC2 instances — the first CA to support SSL for raw IP addresses (July 2025).

---

## 🌟 Key Features

| Feature | Detail |
|---|---|
| **Certbot Audit** | Validates v2.0.0+ with ACME profile support (required for IP certs) |
| **6-Day Cert Tracking** | Monitors shortlived profile certificates with expiry countdowns |
| **Renewal System Check** | Validates systemd timer + cron both configured for 4-hour renewal cadence |
| **IP Validation** | Auto-detects public IPv4/IPv6, rejects private/reserved ranges |
| **Port 80 Readiness** | Checks HTTP-01 ACME challenge capability |
| **Certificate Inventory** | Lists all certs with VALID / EXPIRING / EXPIRED / CRITICAL status |
| **AWS Safety Mode** | Read-only audit — no certificates issued or modified |
| **SOC Pulse Headless** | `SOC_PULSE_HEADLESS=true` for non-interactive orchestrator execution |

---

## 🚀 Usage

```bash
# Via SOC Pulse orchestrator (headless, AWS-safe)
sudo bash ubuntu-cert-manager.sh

# Issue a 6-day IP certificate (after certbot is installed)
sudo certbot certonly --standalone \
  --server https://acme-staging-v02.api.letsencrypt.org/directory \
  --agree-tos --no-eff-email \
  --preferred-profile shortlived \
  -d YOUR_PUBLIC_IP -m your@email.com

# Setup auto-renewal (every 4 hours — critical for 6-day certs)
echo "0 */4 * * * root certbot renew --quiet" | sudo tee /etc/cron.d/certbot-ip-renew
```

## ⚠️ Important Notes

- **Staging only**: IP certs are in Let's Encrypt staging (production rollout expected 2025)
- **6-day validity**: Aggressive renewal every 4 hours is mandatory
- **Public IPs only**: Private IPs (10.x, 192.168.x, 172.16-31.x) are not supported
- **Port 80 required**: HTTP-01 challenge needs inbound TCP:80 in AWS Security Group

## 📁 Log Locations

| Log | Path |
|---|---|
| Main | `/var/log/letsencrypt-ip-manager/ip-certificate.log` |
| Audit | `/var/log/letsencrypt-ip-manager/audit.log` |
| Renewal | `/var/log/letsencrypt-ip-manager/renewal.log` |
| Certbot | `/var/log/letsencrypt/letsencrypt.log` |

## 🔗 Resources

- [Let's Encrypt IP Address Certificates](https://letsencrypt.org/2025/07/01/issuing-our-first-ip-address-certificate/)
- [ACME Profiles (shortlived)](https://letsencrypt.org/2025/01/09/acme-profiles/)
- [Certbot Documentation](https://certbot.eff.org/)
