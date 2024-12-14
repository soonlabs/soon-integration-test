#!/bin/bash

export SOON_PATH=../soon
#set some env variables
export SOON_NODE_STORAGE_PATH=./.soon
export SOON_NODE_L1_RPC_URL=http://localhost:8545
export SOON_NODE_ENABLE_DA=false
export SOON_NODE_DEV_MODE=false
export SOON_NODE_ENABLE_FAUCET=true
export L1_ETH_RPC: http://localhost:8545
export SOON_RPC: http://localhost:8899
export PRIVATE_KEY="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
export POLL_INTERVAL=6000
export WAIT_HOSTS=http://localhost:8899
export WAIT_TIMEOUT=300
export L1_RPC_URL=http://localhost:8545
export L2_RPC_URL=http://localhost:8899
export ADMIN_SECRET_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
export DA_SERVER_RPC=""

make genesis
&> /dev/null ./bin/soon-node &
&> /dev/null ./bin/proposer &
&> /dev/null ./bin/batcher &
