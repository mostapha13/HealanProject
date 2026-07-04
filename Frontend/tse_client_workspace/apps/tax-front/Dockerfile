FROM nginx

# ARG NX_API_URL
# ENV NX_API_URL ${NX_API_URL}


COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./build /usr/share/nginx/html

# COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
# COPY --from=build ./build /usr/share/nginx/html

EXPOSE 80

WORKDIR /usr/share/nginx/html
COPY .env .


