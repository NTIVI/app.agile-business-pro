#!/usr/bin/env python3
import paramiko
import sys

VPS_HOST = "194.67.92.88"
VPS_USER = "root"
VPS_PASSWORD = "Is8FpOxNoqFxWheW"
DOMAINS = ["app.agile-business-pro.com", "agile-business-pro.com", "www.agile-business-pro.com"]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print(">> Connecting to VPS...")
client.connect(VPS_HOST, username=VPS_USER, password=VPS_PASSWORD)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    code = stdout.channel.recv_exit_status()
    return out, err, code

# 1. Update Nginx configuration on host
nginx_conf = """server {
    listen 80;
    listen [::]:80;
    server_name app.agile-business-pro.com agile-business-pro.com www.agile-business-pro.com;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
    }
}
"""

print(">> Updating Nginx config file...")
update_cmd = f"""cat > /etc/nginx/sites-available/app.agile-business-pro.com << 'NGINXEOF'
{nginx_conf}
NGINXEOF
nginx -t && systemctl reload nginx
"""
out, err, code = run(update_cmd)
print(out)
if code != 0:
    print("Nginx config error:", err)
    sys.exit(1)
else:
    print("Nginx config updated and reloaded successfully.")

# 2. Run Certbot for all domains
print(">> Running Certbot for domains...")
domains_str = " ".join([f"-d {d}" for d in DOMAINS])
certbot_cmd = f"certbot --nginx {domains_str} --non-interactive --agree-tos -m admin@agile.com --redirect || true"
out, err, code = run(certbot_cmd)
print(out)
print(err)

client.close()
print(">> Complete!")
