#!/bin/bash

sudo apt-get install -y \
    build-essential \
    pkg-config \
    libudev-dev llvm libclang-dev \
    protobuf-compiler libssl-dev \
    clang make curl git \

# Check and install Node.js if not present
if ! command -v node >/dev/null 2>&1; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed."
fi

# Check Node.js version meets minimum requirement
NODE_VERSION=$(node -v | cut -d'v' -f2)
if [ $(echo "$NODE_VERSION 4.0" | awk '{print ($1 < $2)}') -eq 1 ]; then
    echo "Upgrading Node.js as version is below 4.0..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi


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

# Install anza tool if not present
if ! command -v solana >/dev/null 2>&1; then
    echo "Installing anza tool..."
    sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
else
    echo "Anza tool already installed."
fi

# Install foundry/anvil if not present
if ! command -v anvil >/dev/null 2>&1; then
    echo "Installing foundry..."
    curl -L https://foundry.paradigm.xyz | bash
    # hack for ubuntu and other distros (source causes short-circuit)
    eval "$(cat $HOME/.bashrc | tail -n +10)"
    source $HOME/.bashrc
    foundryup
else
    echo "Foundry already installed."
fi
