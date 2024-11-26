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

genesis:
	$(SOON_PATH)/target/release/soon-genesis \
		-t ./.soon \
		-p $(SOON_PATH)/node/programs/target/deploy \
		--faucet-lamports 100000000000000000 \
		--l1-cross-domain-messenger $(L1_STANDARD_BRIDGE_PROXY) \
		--l1-standard-bridge $(L1_STANDARD_BRIDGE_PROXY) \
		$(ARGS)
