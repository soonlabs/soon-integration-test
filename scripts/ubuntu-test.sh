#/bin/bash

CURRENT_PATH=$(pwd)

${CURRENT_PATH}/scripts/install.sh
${CURRENT_PATH}/scripts/build-soon.sh
${CURRENT_PATH}/scripts/l1-setup.sh
${CURRENT_PATH}/scripts/soon-setup.sh

sleep 3

yarn test

# kill processes
pgrep -io "anvil" | xargs kill
pgrep -io "soon-node" | xargs kill
pgrep -io "proposer" | xargs kill
pgrep -io "batcher" | xargs kill -KILL

