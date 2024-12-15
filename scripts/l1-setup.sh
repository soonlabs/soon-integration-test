#!/bin/bash

# init soon-bridge-tool package.
yarn --cwd ./soon-bridge-tool/

#start anvil
&> /dev/null anvil --block-time 3 --mixed-mining --slots-in-an-epoch 1 &

export L1_RPC_URL="http://127.0.0.1:8545"

if [[ -z "${SOON_PATH}" ]]; then
    export SOON_PATH=../soon
fi

# Wait for Anvil to be ready
echo "Waiting for Anvil to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=1
while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        $L1_RPC_URL >/dev/null 2>&1; then
        echo "Anvil is ready!"
        break
    fi

    echo "Attempt $ATTEMPT of $MAX_ATTEMPTS: Anvil not ready yet..."
    ATTEMPT=$((ATTEMPT + 1))
    sleep 2
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
    echo "Anvil failed to start after $MAX_ATTEMPTS attempts"
    exit 1
fi

# Get current working directory for absolute paths
WORKDIR=$(pwd)

# Create deployments directory if it doesn't exist
mkdir -p $WORKDIR/deployments

# export default env variables
export GS_ADMIN_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Deploy contracts using local config
# forge restrict only visit files in current directory
(
    cd $SOON_PATH/contracts &&
        cp $WORKDIR/l1_deploy_config.json deploy-config &&
        DEPLOYMENT_OUTFILE=deployments/it-deploy.json \
            DEPLOY_CONFIG_PATH=deploy-config/l1_deploy_config.json \
            forge script scripts/deploy/Deploy.s.sol:Deploy \
            --broadcast \
            --private-key $GS_ADMIN_PRIVATE_KEY \
            --rpc-url $L1_RPC_URL \
            --legacy \
            --skip-simulation \
            --lib-paths $WORKDIR &&
        cp deployments/it-deploy.json $WORKDIR/deployments/it-deploy.json &&
        rm deploy-config/l1_deploy_config.json &&
        rm deployments/it-deploy.json
)
