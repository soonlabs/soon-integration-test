#!/bin/bash

make genesis
&> /dev/null ./bin/soon-node &
sleep 3
&> /dev/null ./bin/proposer &
&> /dev/null ./bin/batcher &
