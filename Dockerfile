FROM ubuntu:12.04

RUN apt-get update
RUN apt-get install -y nginx

RUN echo "daemon off;" >> /etc/nginx/nginx.conf

EXPOSE 80

ADD demo /usr/share/nginx/www
CMD ["/usr/sbin/nginx", "-c", "/etc/nginx/nginx.conf"]
