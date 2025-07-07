#!make
ENV ?= local
PROJECT_NAME := nowlisten
SERVER_NAME  := ${PROJECT_NAME}-server-${ENV}

up:
	@echo 'build container...'
	@docker-compose -f docker/docker-compose-${ENV}.yaml -p ${SERVER_NAME} down
	@docker-compose -f docker/docker-compose-${ENV}.yaml -p ${SERVER_NAME} up -d
	@docker-compose -f docker/docker-compose-${ENV}.yaml -p ${SERVER_NAME} logs -f

down:
	@echo 'kill container...'
	@docker-compose -f docker/docker-compose-${ENV}.yaml -p ${SERVER_NAME} down

network:
	@echo 'create docker server network...'
	@sh docker/create-network.sh

start:
	@echo start ${ENV}
	@yarn start:${ENV}