FROM node:16.17-alpine as base
RUN npm install --global pm2 prisma

# Install and setup Nginx
RUN apk update && apk add --update nginx openrc
COPY nginx/nginx.conf /etc/nginx/http.d/default.conf

RUN node -v; npm -v; prisma -v; pm2 -v; nginx -v

WORKDIR /home/app/
COPY shared shared

#############################

FROM base as build_stranger_webapp
WORKDIR /home/app/stranger-webapp

COPY stranger-webapp/package*.json ./
COPY stranger-webapp/svelte.config.js .
RUN npm install

COPY stranger-webapp .
RUN npm run build

COPY stranger-webapp/package*.json build/

#############################

FROM base as build_backend
WORKDIR /home/app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend .
RUN npm run build

#############################

FROM base

WORKDIR /home/app

# Remove unnecessary shared folder
RUN rm -rf shared
# Bring over prisma directory
COPY backend/prisma prisma

# Bring over the stranger webapp from previous stages
WORKDIR /home/app/stranger-webapp
COPY --from=build_stranger_webapp /home/app/stranger-webapp/build .
RUN npm install

# Bring over the backend from previous stages
WORKDIR /home/app/backend
COPY --from=build_backend /home/app/backend/build .
COPY backend/package*.json ./
RUN npm install --omit=dev
RUN prisma generate --schema=../prisma/schema.prisma

# All DONE!
WORKDIR /home/app

# Copy the boot.sh file and make it executable
COPY boot.sh boot.sh
RUN chmod +x boot.sh

ENV NODE_ENV=production

EXPOSE 80

CMD ["./boot.sh"]
