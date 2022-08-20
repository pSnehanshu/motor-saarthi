#!/bin/sh

# Start Nginx
nginx

# Run migrations
prisma migrate deploy

# Start apps
pm2 start backend/backend/server.js --name backend
pm2 start stranger-webapp/index.js --name stranger-webapp

# Display logs
pm2 logs
