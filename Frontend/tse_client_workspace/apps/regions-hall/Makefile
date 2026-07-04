b:
	docker-compose -f docker-compose.yml up -d --build

save:
	docker save -o ../../docker-image/regions-halls_front_03112024V1.0.5.withLogin.Pro.tar region-hall-image

kill:
	docker rm -f regions-halls-container

bomb:
	 docker rmi -f regions-halls-image && docker rm -f regions-halls-container

run:
	docker run -dt -e "NX_API_URL=google.com" -p 4321:80 regions-halls-image