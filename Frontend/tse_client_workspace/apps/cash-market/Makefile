b:
	docker-compose -f docker-compose.yml up -d --build

save:
	docker save -o ./docker-image/cash-market_03092025_v1.3.3_9035.tar cash-market

kill:
	docker rm -f docker-image

bomb:
	docker rm -f docker-image && docker rmi cash-market
