b:
	docker-compose -f docker-compose.yml up -d --build

save:
	docker save -o ../../docker-image/modern-instrumentations_front_$(shell date +%F_%H-%M-%S).tar modern-instrumentations-image

kill:
	docker rm -f modern-instrumentations-container

bomb:
	docker rm -f modern-instrumentations-container && docker rmi modern-instrumentations-image
