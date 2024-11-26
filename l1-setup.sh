#!/bin/bash

yarn --cwd ./soon-bridge-tool/

anvil &

(cd ./soon/contracts &&
DEPLOY_CONFIG_PATH=deploy-config/hardhat.json forge script scripts/deploy/Deploy.s.sol:Deploy --broadcast --private-key $GS_ADMIN_PRIVATE_KEY --rpc-url $L1_RPC_URL --priority-gas-price 1000000000 --block-base-fee-per-gas 50000000000 --skip-simulation )

yarn --cwd ./soon-bridge-tool/ init_soon --l1CrossDomainMessenger='0xeAf0D514E0339dafd6Cf4f6e0d30a1068883204a' --l1StandardBridge='0x43D6C6D64D7a7D30E155C7C2F1bd2d385A592AD2'

# kill all child processes (anvil node)
pkill -P $$

# Build docker image command
#SOON_PATH="../soon" BUILD_PROGRAMS="true" NODE_IMAGE_NAME="soon-node-local" PROPOSER_IMAGE_NAME="soon-proposer-local" ./build/build.sh
