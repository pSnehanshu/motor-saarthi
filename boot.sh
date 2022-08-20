#!/bin/sh

prisma migrate deploy

pm2 start backend/backend/server.js --name backend
pm2 start stranger-webapp/index.js --name stranger-webapp

pm2 logs
