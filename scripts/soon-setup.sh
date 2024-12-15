#!/bin/bash

if [[ -z "${SOON_PATH}" ]]; then
    export SOON_PATH=../soon
fi

# set some env variables
export SOON_NODE_STORAGE_PATH=./.soon
export SOON_NODE_L1_RPC_URL=http://localhost:8545
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

# get env variables from deployment file
export L2OO_ADDRESS="0xc6e7DF5E7b4f2A278906862b61205850344D4e7d"
export L1_STANDARD_BRIDGE_PROXY="0x0B306BF915C4d645ff596e518fAf3F9669b97016"
export SYSTEM_CONFIG_PROXY="0x9A676e781A523b5d0C0e43731313A708CB607508"
export L1_CROSS_DOMAIN_PROXY="0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1"
export OPTIMISM_PORTAL_PROXY="0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82"

export SOON_NODE_DEPOSIT_CONTRACT=${OPTIMISM_PORTAL_PROXY}
export SOON_NODE_SYSTEM_CONFIG_CONTRACT=${SYSTEM_CONFIG_PROXY}

make genesis
&> /dev/null ./bin/soon-node &
&> /dev/null ./bin/proposer &
&> /dev/null ./bin/batcher &
