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
	rm -rf ./.soon && RUST_LOG=info ./bin/soon-genesis \
		-t ./.soon \
		-p $(SOON_PATH)/node/programs/target/deploy \
		-r $(SOON_PATH)/node/deployments/test.rollup.json \
		--l1-chain-id 31337 \
		--l1-system-config-address ${SYSTEM_CONFIG_PROXY} \
	    --enable-mpl-programs \
		--faucet-lamports 100000000000000000 \
		--l1-rpc-url $(L1_RPC_URL) \
		--identity-keypair 4pzaqV4eaVJWbdhzGeX7TFcLBJhMk1LcLY97bMdJuoj3Noeyw3jbSudk4UC7anu7Z7LQA4HsrYxDGm28WDiEkF3L \
		$(ARGS)
