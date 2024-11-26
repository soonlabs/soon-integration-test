#!/usr/bin/env make

SHELL := /bin/bash

ENV ?=

COMPOSE_FILES_ARGS := $(shell [[ -f "docker-compose.$(ENV).yaml" ]] && echo "-f docker-compose.$(ENV).yaml")
ENV_FILES_ARGS := $(shell [[ -f ".envrc.$(ENV)" ]] && echo "--env-file .envrc.$(ENV)")
UP_CMD := docker compose up -d

up:
	$(UP_CMD)
.PHONY: up

logs:
	docker compose logs -f
.PHONY: logs

down:
	docker compose down
.PHONY: down

build:
	source build/.envrc && build/build.sh
.PHONY: build