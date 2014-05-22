FROM orchardup/nginx
ADD hakyll-bootstrap/_site /var/www
ADD demo /var/www/demo

CMD 'nginx'
