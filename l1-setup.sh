#!/bin/bash

yarn --cwd ./soon-bridge-tool/

make up

(cd ./soon/contracts &&
DEPLOY_CONFIG_PATH=deploy-config/hardhat.json forge script scripts/deploy/Deploy.s.sol:Deploy --broadcast --private-key $GS_ADMIN_PRIVATE_KEY --rpc-url $L1_RPC_URL --priority-gas-price 1000000000 --block-base-fee-per-gas 50000000000 --skip-simulation )

yarn --cwd ./soon-bridge-tool/ init_soon --l1CrossDomainMessenger=$L1_CROSS_DOMAIN_PROXY --l1StandardBridge=$L1_STANDARD_BRIDGE_PROXY

# spin down docker containers
make logs

# kill all child processes
#pkill -P $$
