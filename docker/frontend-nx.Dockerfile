FROM node:20-alpine AS build
ARG APP_NAME
WORKDIR /workspace
COPY Frontend/tse_client_workspace/package*.json ./
RUN npm ci --legacy-peer-deps
COPY Frontend/tse_client_workspace/ ./
RUN npx nx run ${APP_NAME}:build:production --skip-nx-cache

FROM nginx:1.27-alpine AS runtime
COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
ARG APP_NAME
COPY --from=build /workspace/dist/apps/${APP_NAME} /usr/share/nginx/html
EXPOSE 80
