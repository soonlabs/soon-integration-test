#!/bin/bash

CURRENT_PATH=$(pwd)

if [[ -z "${SOON_PATH}" ]]; then
    export SOON_PATH=../soon
fi

# Check if SOON_PATH submodule is properly initialized
if [[ ! -f "${SOON_PATH}/.git/config" ]] || ! grep -q "\[submodule\]" "${SOON_PATH}/.git/config"; then
    echo "SOON_PATH submodule not properly initialized. Initializing now..."
    (cd "${SOON_PATH}" && git submodule update --init --recursive)
fi

# Check submodules
if [[ ! -f "${CURRENT_PATH}/.git/config" ]] || ! grep -q "\[submodule\]" "${CURRENT_PATH}/.git/config"; then
    echo "Submodules not initialized. Initializing now..."
    git submodule update --init --recursive
fi

# Handle branch switching
if [[ -n "${SOON_BRANCH}" ]]; then
    echo "Switching to specified branch ${SOON_BRANCH}..."
    (cd "${SOON_PATH}" && git checkout "${SOON_BRANCH}")
else
    echo "No branch specified, switching to origin/main..."
    (cd "${SOON_PATH}" && git checkout origin/main)
fi

if [[ -z "${DEPLOYMENT_PATH}" ]]; then
    export DEPLOYMENT_PATH=${CURRENT_PATH}/deployments/it-deploy.json
fi

# set some env variables
export SOON_NODE_STORAGE_PATH=./.soon
export SOON_NODE_L1_RPC_URL=http://localhost:8545
export L1ChainID=31337
export SOON_NODE_ENABLE_DA=false
export SOON_NODE_DEV_MODE=false
export SOON_NODE_ENABLE_FAUCET=true
export L1_ETH_RPC=http://localhost:8545
export SOON_RPC=http://localhost:8899
export PRIVATE_KEY="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
export POLL_INTERVAL=6000
export WAIT_HOSTS=http://localhost:8899
export WAIT_TIMEOUT=300
export L1_RPC_URL=http://localhost:8545
export L2_RPC_URL=http://localhost:8899
export ADMIN_SECRET_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
export DA_SERVER_RPC=""

# run scripts
${CURRENT_PATH}/scripts/install.sh
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
${CURRENT_PATH}/scripts/build-soon.sh
${CURRENT_PATH}/scripts/l1-setup.sh

# set env variables post l1 setup

# get env variables from deployment file
# map the .env variables to it-deploy.json file generated from foundry
declare -A env_var=(["L2OO_ADDRESS"]="L2OutputOracleProxy" ["L1_STANDARD_BRIDGE_PROXY"]="L1StandardBridgeProxy" ["SYSTEM_CONFIG_PROXY"]="SystemConfigProxy" ["L1_CROSS_DOMAIN_PROXY"]="L1CrossDomainMessengerProxy" ["OPTIMISM_PORTAL_PROXY"]="OptimismPortalProxy")

for key in "${!env_var[@]}"; do
    VAR="${env_var[$key]}"
    ADDRESS=$(jq -r ".${VAR}" $DEPLOYMENT_PATH)
    export $key=${ADDRESS}
done

export SOON_NODE_DEPOSIT_CONTRACT=${OPTIMISM_PORTAL_PROXY}
export SOON_NODE_SYSTEM_CONFIG_CONTRACT=${SYSTEM_CONFIG_PROXY}

export EVM_PROPOSER_KEY="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
export EVM_USER_KEY="0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6"
export EVM_PROVIDER_URL="http://127.0.0.1:8545"
export EVM_STANDARD_BRIDGE=$L1_STANDARD_BRIDGE_PROXY
export SVM_CONNECTION_URL="http://127.0.0.1:8899"
export SVM_SOON_RPC_URL="http://127.0.0.1:8899"
export SOON_NODE_RPC_BIND_ADDRESS="127.0.0.1"
export SOON_NODE_BIND_ADDRESS="127.0.0.1"
export SOON_NODE_FULL_RPC_API="true"

sleep 3

${CURRENT_PATH}/scripts/soon-setup.sh

sleep 3

SVM_FAUCET_ACCOUNT=$(cat ./.soon/keypair/faucet.json)
export SVM_DEPOSITOR_KEY=${SVM_FAUCET_ACCOUNT}
export SVM_USER_KEY=${SVM_FAUCET_ACCOUNT}

yarn
npm install
yarn test

# kill processes
pgrep -io "anvil" | xargs kill
pgrep -io "soon-node" | xargs kill -KILL
pgrep -io "proposer" | xargs kill
pgrep -io "batcher" | xargs kill -KILL
