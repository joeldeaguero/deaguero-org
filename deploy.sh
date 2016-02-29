#!/bin/sh
npm install
mkdir tls
cp /etc/letsencrypt/live/www.deaguero.org/cert.pem tls/cert.pem
cp /etc/letsencrypt/live/www.deaguero.org/privkey.pem tls/key.pem
chown -R nobody:nobody .
systemctl start deaguero-org

