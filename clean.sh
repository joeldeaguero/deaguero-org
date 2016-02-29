#!/bin/sh
systemctl stop deaguero-org
git clean -f -d
git pull origin master


