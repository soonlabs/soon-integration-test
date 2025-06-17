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

# Handle Cargo.lock version incompatibility
echo "Checking and fixing Cargo.lock files..."
find . -name "Cargo.lock" -type f -exec rm {} \;
find . -name "Cargo.toml" -type f -exec dirname {} \; | xargs -I{} sh -c 'cd {} && cargo update --quiet || true'

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


# Install anchor if not present or update to specific version
if ! command -v anchor >/dev/null 2>&1; then
    echo "Installing anchor..."
    # Save current Rust version
    CURRENT_RUST_VERSION=$(rustc --version | cut -d' ' -f2)
    echo "Current Rust version: $CURRENT_RUST_VERSION"
    
    # Temporarily upgrade to latest Rust for avm compilation
    echo "Temporarily upgrading to latest Rust for avm installation..."
    rustup update
    rustup default stable
    
    # Install avm with latest Rust
    cargo install --git https://github.com/coral-xyz/anchor avm --force
    source "$HOME/.cargo/env"
    
    # Switch back to original version
    echo "Switching back to Rust $CURRENT_RUST_VERSION..."
    rustup default $CURRENT_RUST_VERSION
    
    # Install and use anchor 0.30.1
    avm install 0.30.1
    avm use 0.30.1
else
    echo "Checking anchor version..."
    CURRENT_VERSION=$(anchor --version | cut -d' ' -f2)
    if [ "$CURRENT_VERSION" != "0.30.1" ]; then
        echo "Updating anchor to version 0.30.1..."
        avm install 0.30.1
        avm use 0.30.1
    else
        echo "Anchor 0.30.1 already installed."
    fi
fi