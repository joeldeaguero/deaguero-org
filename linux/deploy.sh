#!/bin/sh
npm install
mkdir tls
cp /etc/letsencrypt/live/www.deaguero.org/fullchain.pem tls/fullchain.pem
cp /etc/letsencrypt/live/www.deaguero.org/privkey.pem tls/key.pem
mkdir oauth
cp /etc/googledevelopers/live/www.deaguero.org/clientId.txt oauth/clientId.txt
cp /etc/googledevelopers/live/www.deaguero.org/clientSecret.txt oauth/clientSecret.txt
mkdir session
cp /etc/cookies/live/www.deaguero.org/secret.txt session/secret.txt
mkdir mongodb
cp /etc/mongodb/live/www.deaguero.org/password.txt mongodb/password.txt
chown -R nobody:nobody .
systemctl start deaguero-org
