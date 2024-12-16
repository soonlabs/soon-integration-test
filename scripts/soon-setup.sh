#!/bin/bash

if [[ -n "${SOON_PATH}" ]]; then
  rm -rf ${SOON_NODE_STORAGE_PATH}
fi

make genesis
./bin/soon-node &>/dev/null &
sleep 3
./bin/proposer &>/dev/null &
./bin/batcher &>/dev/null &
