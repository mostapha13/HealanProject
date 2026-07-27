FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . ./
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/.next/standalone /usr/share/nginx/html
COPY --from=build /app/.next/static /usr/share/nginx/html/.next/static
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
