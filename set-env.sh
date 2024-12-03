#!/bin/bash

# Script to set env variables according to files generated during setup

# map the .env variables to 31337-deploy.json file generated from foundry
declare -A env_var=( ["L2OO_ADDRESS"]="L2OutputOracleProxy" ["L1_STANDARD_BRIDGE_PROXY"]="L1StandardBridgeProxy" ["SYSTEM_CONFIG_PROXY"]="SystemConfigProxy" ["L1_CROSS_DOMAIN_PROXY"]="L1CrossDomainMessengerProxy" )

# random var
declare -A other_var=( ["SVM_USER_KEY"]="a" ["SVM_DEPOSITOR_KEY"]="a")

for key in "${!env_var[@]}";

do
    VAR="${env_var[$key]}";
    ADDRESS=$(jq -r ".${VAR}" $SOON_PATH/contracts/deployments/31337-deploy.json);
    env_var[$key]=${ADDRESS}
done

for key in "${!env_var[@]}";

do
    VAR="${env_var[$key]}";
    sed -i "/^${key}=/{h;s/=.*/=${VAR}/};\${x;/^$/{s//${key}=${VAR}/;H};x}" .env
done

SVM_VAL=$(cat ./.soon/keypair/faucet.json);
other_var["SVM_USER_KEY"]=${SVM_VAL};
other_var["SVM_DEPOSITOR_KEY"]=${SVM_VAL};

for key in "${!other_var[@]}";

do
    VAR="${other_var[$key]}";
    sed -i "/^${key}=/{h;s/=.*/=${VAR}/};\${x;/^$/{s//${key}=${VAR}/;H};x}" .env
done

