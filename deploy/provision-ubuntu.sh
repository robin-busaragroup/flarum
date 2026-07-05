#!/usr/bin/env bash
#
# AOFORUM one-shot provisioner for a fresh Ubuntu 24.04 DigitalOcean Droplet.
# Run as root in the DO Web Console (or over SSH):
#
#   cd /root
#   curl -O https://raw.githubusercontent.com/robin-busaragroup/flarum/2.x/deploy/provision-ubuntu.sh
#   nano provision-ubuntu.sh        # edit the THREE values below
#   bash provision-ubuntu.sh
#
# After it finishes, DELETE this file — it contains your admin password.

set -euo pipefail

### ── EDIT THESE THREE ──────────────────────────────────────────────────────
DOMAIN="68.183.76.38"                      # your domain (e.g. aoforum.example) OR the droplet IP for now
ADMIN_EMAIL="you@example.com"              # your admin email
ADMIN_PASSWORD="change-me-to-something-strong"
### ──────────────────────────────────────────────────────────────────────────

REPO="https://github.com/robin-busaragroup/flarum.git"
BRANCH="2.x"
APP_DIR="/var/www/aoforum"
DB_NAME="aoforum"
DB_USER="aoforum"
DB_PASS="$(openssl rand -hex 24)"

echo ">>> [1/9] Swap (safety net for composer on 2 GB RAM)"
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo ">>> [2/9] System packages (nginx, PHP 8.3, MySQL)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx mysql-server git unzip curl \
  php8.3-fpm php8.3-cli php8.3-mysql php8.3-curl php8.3-xml php8.3-gd \
  php8.3-mbstring php8.3-zip php8.3-bcmath php8.3-intl

echo ">>> [3/9] Composer"
if [ ! -x /usr/local/bin/composer ]; then
  curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

echo ">>> [4/9] Database"
mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost'; FLUSH PRIVILEGES;"

echo ">>> [5/9] Application code"
mkdir -p /var/www
if [ ! -d "${APP_DIR}/.git" ]; then
  git clone --branch "${BRANCH}" "${REPO}" "${APP_DIR}"
else
  git -C "${APP_DIR}" pull origin "${BRANCH}"
fi
cd "${APP_DIR}"
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

echo ">>> [6/9] Flarum install"
if [ ! -f "${APP_DIR}/config.php" ]; then
  cat > /tmp/flarum-install.json <<JSON
{
  "debug": false,
  "baseUrl": "http://${DOMAIN}",
  "databaseConfiguration": { "driver":"mysql","host":"127.0.0.1","port":3306,"database":"${DB_NAME}","username":"${DB_USER}","password":"${DB_PASS}" },
  "adminUser": { "username":"admin","password":"${ADMIN_PASSWORD}","email":"${ADMIN_EMAIL}" },
  "settings": {
    "forum_title":"AOFORUM",
    "forum_description":"A privacy-first anonymous forum for AO3 readers to discuss fanfics.",
    "welcome_title":"Welcome to AOFORUM",
    "welcome_message":"Discuss fanfics with fellow AO3 readers. Tag your fandoms and ships, label your spoilers, respect content warnings. No real names required.",
    "display_name_driver":"nickname",
    "flarum-nicknames.set_on_registration":"1",
    "flarum-nicknames.unique":"1",
    "flarum-nicknames.max":"50",
    "theme_primary_color":"#8B0000",
    "theme_secondary_color":"#8B0000"
  }
}
JSON
  php flarum install -f /tmp/flarum-install.json
  rm -f /tmp/flarum-install.json
fi

echo ">>> [7/9] Extensions"
php flarum extension:enable flarum-nicknames || true
php flarum extension:enable flarum-gdpr || true
php flarum extension:enable flarum-messages || true
php flarum extension:enable ao3-companion || true
php flarum cache:clear

echo ">>> [8/9] Permissions + nginx"
chown -R www-data:www-data "${APP_DIR}"
cat > /etc/nginx/sites-available/aoforum <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    root ${APP_DIR}/public;
    index index.php;

    location / { try_files \$uri \$uri/ /index.php?\$query_string; }

    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }

    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|svg)\$ {
        expires max; access_log off; add_header Cache-Control public;
    }

    location ~ /\. { deny all; }
    client_max_body_size 25M;
}
NGINX
ln -sf /etc/nginx/sites-available/aoforum /etc/nginx/sites-enabled/aoforum
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ">>> [9/9] Scheduler cron + firewall"
( crontab -l 2>/dev/null | grep -v 'flarum schedule:run' ; \
  echo "* * * * * php ${APP_DIR}/flarum schedule:run >/dev/null 2>&1" ) | crontab -
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable || true

cat <<DONE

==================================================================
 AOFORUM is live:   http://${DOMAIN}
 Admin login:       admin  /  (the password you set above)
 MySQL DB password: ${DB_PASS}   (also saved in ${APP_DIR}/config.php)
==================================================================
 NEXT:
 1) Delete this script — it holds your admin password:  rm ~/provision-ubuntu.sh
 2) Add a domain: point its DNS A record at this droplet, then:
       apt-get install -y certbot python3-certbot-nginx
       certbot --nginx -d yourdomain.example
       # then edit ${APP_DIR}/config.php  -> 'url' => 'https://yourdomain.example'
       sudo -u www-data php ${APP_DIR}/flarum cache:clear
 3) Email: Admin panel -> Email -> SMTP (Postmark free tier).
 4) Create fandom/ship tags in Admin -> Tags (the SQLite seed won't run on MySQL).
 5) Before opening registration: harden the AO3 lookup endpoint (caching + rate limit).

 Future deploys:  cd ${APP_DIR} && sudo -u www-data git pull origin ${BRANCH} \\
                  && sudo -u www-data composer install --no-dev --optimize-autoloader \\
                  && sudo -u www-data php flarum migrate \\
                  && sudo -u www-data php flarum assets:publish \\
                  && sudo -u www-data php flarum cache:clear
==================================================================
DONE
