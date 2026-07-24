# syntax=docker/dockerfile:1
# Build Expo Router web PWA and serve with nginx under /mobile/
ARG APP_DIR=Frontend/healan-clinic-app

FROM node:22-bookworm-slim AS build
ARG APP_DIR
ARG EXPO_PUBLIC_IDENTITY_URL=https://auth.drshahrooei.ir
ARG EXPO_PUBLIC_HEALAN_API_URL=https://clinic.drshahrooei.ir/Healan/api/v1
ARG EXPO_PUBLIC_USER_MANAGER_API_URL=https://clinic.drshahrooei.ir/UserManager/api/v1
ARG EXPO_PUBLIC_CLIENT_ID=HealanClinicMobile
ARG EXPO_PUBLIC_FILE_API_URL=https://clinic.drshahrooei.ir/File
ARG PWA_APPLE_TITLE=Healan

WORKDIR /src
COPY ${APP_DIR}/package.json ${APP_DIR}/package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY ${APP_DIR}/ ./
COPY docker/scripts/inject-expo-pwa-html.js /tools/inject-expo-pwa-html.js
ENV EXPO_PUBLIC_IDENTITY_URL=${EXPO_PUBLIC_IDENTITY_URL} \
    EXPO_PUBLIC_HEALAN_API_URL=${EXPO_PUBLIC_HEALAN_API_URL} \
    EXPO_PUBLIC_USER_MANAGER_API_URL=${EXPO_PUBLIC_USER_MANAGER_API_URL} \
    EXPO_PUBLIC_CLIENT_ID=${EXPO_PUBLIC_CLIENT_ID} \
    EXPO_PUBLIC_FILE_API_URL=${EXPO_PUBLIC_FILE_API_URL} \
    CI=1
RUN npx expo export -p web \
  && node /tools/inject-expo-pwa-html.js /src/dist "${PWA_APPLE_TITLE}"

FROM nginx:1.27-alpine
COPY --from=build /src/dist /usr/share/nginx/html
COPY docker/expo-pwa-nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
