FROM nginx


COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./build /usr/share/nginx/html

EXPOSE 80

ARG NX_API_URL
ENV NX_API_URL $NX_API_URL

WORKDIR /usr/share/nginx/html
COPY .env .