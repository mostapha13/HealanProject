b:
	docker-compose -f docker-compose.yml up -d --build

save:
	docker save -o ./docker-image/tax-front_v1.0.2_pro.tar tax-front-image

kill:
	docker rm -f tax-front-container

bomb:
	 docker rmi -f tax-front-image && docker rm -f tax-front-container

run:
	docker run -dt -e "NX_API_URL=google.com" -p 4321:80 tax-front-image