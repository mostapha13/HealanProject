# FROM nginx:1.24.0
FROM docker.arvancloud.ir/nginx:1.24.0

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./build /usr/share/nginx/html

EXPOSE 80
