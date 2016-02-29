#!/bin/sh
npm install
chown -R nobody:nobody .
mkdir tls
ln -s /etc/letsencrypt/live/www.deaguero.org/cert.pem tls/cert.pem
ln -s /etc/letsencrypt/live/www.deaguero.org/privkey.pem tls/key.pem
systemctl start deaguero-org

