FROM nginx:1.23.1-alpine as BASE

# Set up nginx routing logic
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Install Node.js and necessary packages
RUN apk add --update nodejs npm openrc
RUN node -v && npm -v
RUN npm install --global pm2 prisma
RUN pm2 -v; prisma -v

WORKDIR /home/app/
COPY shared shared

#############################

FROM BASE as BUILD_STRANGER_WEBAPP
WORKDIR /home/app/stranger-webapp

COPY stranger-webapp/package*.json ./
COPY stranger-webapp/svelte.config.js .
RUN npm install

COPY stranger-webapp .
RUN npm run build

COPY stranger-webapp/package*.json build/

#############################

FROM BASE as BUILD_BACKEND
WORKDIR /home/app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend .
RUN npm run build
COPY backend/google-service-account.json ./build/backend/

#############################

FROM BASE

WORKDIR /home/app

# Remove unnecessary shared folder
RUN rm -rf shared
# Bring over prisma directory
COPY backend/prisma prisma

# Copy the boot.sh file and make it executable
COPY boot.sh boot.sh
RUN chmod +x boot.sh

# Bring over the stranger webapp from previous stages
WORKDIR /home/app/stranger-webapp
COPY --from=BUILD_STRANGER_WEBAPP /home/app/stranger-webapp/build .
RUN npm install

# Bring over the backend from previous stages
WORKDIR /home/app/backend
COPY --from=BUILD_BACKEND /home/app/backend/build .
COPY backend/package*.json ./
RUN npm install --omit=dev
RUN prisma generate --schema=../prisma/schema.prisma

# All DONE!
WORKDIR /home/app
ENV NODE_ENV=production

CMD ["./boot.sh"]
