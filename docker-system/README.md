# That Planning Suite containerization system

Welcome to our docker configuration folder

docker-compose up SERVICE
That should start a single service and any linked containers.

Useful commands:
docker-compose ps
docker ps

docker build -t service_name ./path
docker images | grep ...
docker run -p "8080:8080" service_name
