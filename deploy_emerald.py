#!/usr/bin/env python3
"""
Custom deployment script for Agile Business on Emerald Tellurium VPS (IP: 194.67.92.88).
This script:
1. Connects to the server using root credentials.
2. Automatically installs Docker, Docker Compose, Nginx, and Certbot on the host.
3. Sets up Nginx reverse proxy.
4. Uploads code and creates .env.
5. Builds and starts Docker containers.
6. Runs database seeds.
"""
import os
import sys
import secrets

sys.stdout.reconfigure(encoding="utf-8")

VPS_HOST = "194.67.92.88"
VPS_USER = "root"
VPS_PASSWORD = "Is8FpOxNoqFxWheW"
DOMAIN = "app.agile-business-pro.com"
REMOTE_PATH = "/opt/agile"

def main():
    print(f"\n=== Agile Business — Деплой на VPS Emerald Tellurium ===")
    print(f"  {VPS_USER}@{VPS_HOST} | {DOMAIN}\n")

    try:
        import paramiko
    except ImportError:
        print("Установите paramiko: pip install paramiko")
        sys.exit(1)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(">> Подключение по SSH...")
    try:
        client.connect(VPS_HOST, port=22, username=VPS_USER, password=VPS_PASSWORD, timeout=30)
        print("   Успешно подключено!")
    except Exception as e:
        print(f"Ошибка подключения: {e}")
        sys.exit(1)

    def run(cmd, timeout=300):
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        code = stdout.channel.recv_exit_status()
        return out, err, code

    # === Шаг 1. Установка Docker и Docker Compose ===
    print(">> 1. Проверка и установка Docker & Docker Compose...")
    docker_check_cmd = "command -v docker && docker compose version"
    out, err, code = run(docker_check_cmd)
    if code != 0:
        print("   Docker не найден. Установка через get.docker.com...")
        install_docker_cmd = """
        set -e
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable --now docker
        rm -f get-docker.sh
        echo 'Docker установлен!'
        """
        out_inst, err_inst, code_inst = run(install_docker_cmd)
        print(out_inst)
        if code_inst != 0:
            print("Ошибка установки Docker:", err_inst)
            sys.exit(1)
    else:
        print("   Docker и Docker Compose уже установлены.")

    # === Шаг 2. Установка Nginx и Certbot ===
    print(">> 2. Проверка и установка Nginx & Certbot...")
    nginx_check_cmd = "command -v nginx"
    out, err, code = run(nginx_check_cmd)
    if code != 0:
        print("   Установка Nginx, Certbot и плагина для Nginx...")
        install_nginx_cmd = """
        set -e
        apt-get update -qq
        apt-get install -y -qq nginx certbot python3-certbot-nginx
        systemctl enable --now nginx
        echo 'Nginx и Certbot установлены!'
        """
        out_inst, err_inst, code_inst = run(install_nginx_cmd)
        print(out_inst)
        if code_inst != 0:
            print("Ошибка установки Nginx:", err_inst)
            sys.exit(1)
    else:
        print("   Nginx уже установлен.")

    # === Шаг 3. Создание директории и загрузка файлов ===
    print(">> 3. Создание директории на сервере...")
    run(f"mkdir -p {REMOTE_PATH}")

    print(">> 4. Загрузка файлов по SFTP...")
    base = os.path.dirname(os.path.abspath(__file__))
    sftp = client.open_sftp()

    def upload_path(local_path, remote_path):
        if os.path.isfile(local_path):
            run(f"mkdir -p {os.path.dirname(remote_path)}")
            sftp.put(local_path, remote_path)
        else:
            run(f"mkdir -p {remote_path}")
            for root, dirs, files in os.walk(local_path):
                for skip in ("__pycache__", "node_modules", ".git", ".venv", "dist"):
                    if skip in dirs:
                        dirs.remove(skip)
                for f in files:
                    if f.endswith(".pyc") or f.endswith(".log"):
                        continue
                    lp = os.path.join(root, f)
                    rp = remote_path + "/" + lp[len(local_path) + 1:].replace("\\", "/")
                    run(f"mkdir -p {os.path.dirname(rp)}")
                    sftp.put(lp, rp)

    items = ["server", "client-new", "docker-compose.prod.yml", "db-backup.sh", ".env.example", "deploy"]
    for item in items:
        local = os.path.join(base, item)
        if os.path.exists(local):
            upload_path(local, f"{REMOTE_PATH}/{item}")
            print(f"   OK: {item}")
    sftp.close()

    # === Шаг 4. Настройка .env на сервере ===
    print(">> 5. Создание файла конфигурации .env на сервере...")
    db_pass = secrets.token_urlsafe(24)
    redis_pass = secrets.token_urlsafe(24)
    minio_pass = secrets.token_urlsafe(24)
    secret_key = secrets.token_urlsafe(48)
    admin_pass = "Admin123!Secure"  # Заданный пользователем надежный пароль
    elastic_pass = secrets.token_urlsafe(24)

    env_setup = f"""
cat > {REMOTE_PATH}/.env << 'ENVEOF'
# ===== Agile Business — Production =====
DEBUG=false
SECRET_KEY={secret_key}
DOMAIN={DOMAIN}

# --- PostgreSQL ---
DB_USER=agile_user
DB_PASSWORD={db_pass}
DB_NAME=agile_workspace
DATABASE_URL=postgresql+asyncpg://agile_user:{db_pass}@db:5432/agile_workspace

# --- Redis ---
REDIS_PASSWORD={redis_pass}
REDIS_URL=redis://:{redis_pass}@redis:6379/0

# --- Elasticsearch ---
ELASTIC_PASSWORD={elastic_pass}

# --- MinIO (S3) ---
MINIO_USER=agile-minio
MINIO_PASSWORD={minio_pass}
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=agile-minio
S3_SECRET_KEY={minio_pass}
S3_BUCKET=agile-files

# --- Порты ---
FRONTEND_PORT=8080
BACKEND_PORT=8000

# --- Uvicorn ---
WORKERS=2

# --- Admin seed ---
ADMIN_SEED_EMAIL=admin@agile.com
ADMIN_SEED_PASSWORD={admin_pass}

# --- CORS (JSON массив) ---
CORS_ORIGINS=["https://{DOMAIN}","http://{DOMAIN}","https://{VPS_HOST}","http://{VPS_HOST}"]

# --- Telegram (опционально) ---
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
ENVEOF
chmod 600 {REMOTE_PATH}/.env
echo '   .env успешно создан.'
"""
    run(env_setup)

    # === Шаг 5. Настройка Nginx на хосте ===
    print(">> 6. Настройка Nginx на хосте VPS...")
    nginx_config_payload = """
server {
    listen 80;
    listen [::]:80;
    server_name app.agile-business-pro.com;

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
    # Записываем конфиг Nginx напрямую
    nginx_setup = f"""
cat > /etc/nginx/sites-available/app.agile-business-pro.com << 'NGINXEOF'
{nginx_config_payload}
NGINXEOF
ln -sf /etc/nginx/sites-available/app.agile-business-pro.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo '   Nginx успешно настроен.'
"""
    out, err, code = run(nginx_setup)
    if code != 0:
        print("Ошибка настройки Nginx:", err)
        sys.exit(1)
    else:
        print(out)

    # === Шаг 6. Запуск Docker контейнеров ===
    print(">> 7. Запуск Docker-контейнеров на сервере (это займет несколько минут)...")
    docker_up = f"""
    set -e
    cd {REMOTE_PATH}
    cp docker-compose.prod.yml docker-compose.yml
    mkdir -p backups
    chmod +x db-backup.sh || true
    
    # Сборка и запуск
    docker compose build --quiet
    docker compose up -d
    """
    out, err, code = run(docker_up, timeout=900)
    print(out)
    if code != 0:
        print("Ошибка запуска Docker:", err)
        sys.exit(1)

    print(">> 8. Ожидание запуска сервисов...")
    import time
    time.sleep(30)

    # === Шаг 7. Запуск сидов ===
    print(">> 9. Наполнение базы данных (сиды курса и магазина)...")
    seed_cmd = f"""
    cd {REMOTE_PATH}
    docker compose exec -T backend python seed_fullstack.py || true
    docker compose exec -T backend python seed_shop_items.py || true
    """
    out, err, code = run(seed_cmd)
    print(out)

    # === Шаг 8. Настройка Cron ===
    print(">> 10. Настройка автобэкапа БД (cron в 03:00)...")
    cron_setup = f"""
    (crontab -l 2>/dev/null | grep -v db-backup; echo "0 3 * * * {REMOTE_PATH}/db-backup.sh >> {REMOTE_PATH}/backups/cron.log 2>&1") | crontab -
    """
    run(cron_setup)

    # === Шаг 9. Попытка выпуска SSL-сертификата ===
    print(">> 11. Настройка SSL через Certbot...")
    certbot_cmd = f"certbot --nginx -d {DOMAIN} --non-interactive --agree-tos -m admin@agile.com --redirect || true"
    out, err, code = run(certbot_cmd)
    print(out)
    if "Congratulations" in out or "success" in out.lower():
        print("   [OK] SSL успешно настроен и активирован!")
    else:
        print("   [WARNING] Не удалось автоматически выпустить SSL (возможно, DNS еще не обновился).")
        print(f"   После того как DNS-запись обновится, выполните вручную на сервере:")
        print(f"   sudo certbot --nginx -d {DOMAIN}")

    client.close()
    print("\n" + "=" * 50)
    print("ДЕПЛОЙ НА VPS EMERALD TELLURIUM УСПЕШНО ЗАВЕРШЕН!")
    print("=" * 50)
    print(f"Сайт: http://{DOMAIN} (после обновления DNS также по https://)")
    print(f"IP-адрес сервера: {VPS_HOST}")
    print(f"Логин администратора: admin@agile.com")
    print(f"Пароль администратора: {admin_pass}")
    print("=" * 50 + "\n")

if __name__ == "__main__":
    main()
