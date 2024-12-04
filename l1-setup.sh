#!/bin/bash

# init soon-bridge-tool package.
yarn --cwd ./soon-bridge-tool/

# Check if anvil container is running
ANVIL_CONTAINER_ID=$(docker ps -q -f name=anvil)
if [ ! -z "$ANVIL_CONTAINER_ID" ]; then
    echo "Anvil container is already running"
    exit 0
fi

echo "Anvil container not found, starting it..."
docker compose up anvil -d

# Get current working directory for absolute paths
WORKDIR=$(pwd)

# Create deployments directory if it doesn't exist
mkdir -p $WORKDIR/deployments

# Deploy contracts using local config
(cd $SOON_PATH/contracts &&
    DEPLOYMENT_OUTFILE=$WORKDIR/deployments/it-deploy.json \
    DEPLOY_CONFIG_PATH=$WORKDIR/l1_deploy_config.json \
    forge script scripts/deploy/Deploy.s.sol:Deploy \
    --broadcast \
    --private-key $GS_ADMIN_PRIVATE_KEY \
    --rpc-url $L1_RPC_URL \
    --legacy \
    --skip-simulation)

# spin down docker containers
# make logs

# kill all child processes
# pkill -P $$
