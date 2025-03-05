#!/bin/bash

if [[ -n "${SOON_PATH}" ]]; then
  rm -rf ${SOON_NODE_STORAGE_PATH}
fi

make genesis

./bin/soon-node \
-t ./.soon \
-r $(SOON_PATH)/node/deployments/test.rollup.json \
--l1-rpc-url "http://127.0.0.1:8545" \
--enable-faucet \
--rpc-bind-address "127.0.0.1" \
--bind-address "127.0.0.1" \
--full-rpc-api \
--enable-sequencer &>/dev/null &

sleep 3
./bin/proposer &>/dev/null &
./bin/batcher &>/dev/null &
