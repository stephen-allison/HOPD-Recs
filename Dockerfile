FROM orchardup/nginx
ADD hakyll-bootstrap/_site /var/www
ADD demo /var/www/demo

EXPOSE 80
CMD 'nginx'
