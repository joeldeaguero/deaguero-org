#!/bin/sh
npm install
mkdir tls
cp /etc/letsencrypt/live/www.deaguero.org/cert.pem tls/cert.pem
cp /etc/letsencrypt/live/www.deaguero.org/privkey.pem tls/key.pem
mkdir oauth
cp /etc/googledevelopers/live/www.deaguero.org/clientId.txt oauth/clientId.txt
cp /etc/googledevelopers/live/www.deaguero.org/clientSecret.txt oauth/clientSecret.txt
chown -R nobody:nobody .
systemctl start deaguero-org

