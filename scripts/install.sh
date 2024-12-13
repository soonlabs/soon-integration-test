#!/bin/bash

curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

sudo apt remove cmdtest

sudo apt update && sudo apt -y install yarn

# install rust toochain
if command -v rustc >/dev/null 2>&1; then
    echo "Installed Rust detected."
else
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    echo "Rust installed."
fi

sudo apt-get install -y \
    build-essential \
    pkg-config \
    libudev-dev llvm libclang-dev \
    protobuf-compiler libssl-dev \
    clang make\

sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# install anvil
curl -L https://foundry.paradigm.xyz | bash
source $HOME/.bashrc
foundryup

# source env variable to build
source ./build/.envrc.example
export SOON_PATH=../soon
