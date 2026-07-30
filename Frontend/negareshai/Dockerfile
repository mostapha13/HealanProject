FROM node:20-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:6129
ARG NEXT_PUBLIC_IDENTITY_BASE_URL=http://localhost:5005
ARG NEXT_PUBLIC_USER_MANAGER_BASE_URL=http://localhost:5074
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_IDENTITY_BASE_URL=$NEXT_PUBLIC_IDENTITY_BASE_URL
ENV NEXT_PUBLIC_USER_MANAGER_BASE_URL=$NEXT_PUBLIC_USER_MANAGER_BASE_URL
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=10 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["node", "server.js"]
