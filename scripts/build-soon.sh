#!/bin/bash

set -e

function build_soon() {
	cd $SOON_PATH
	if [[ "$OS" == "Linux" && "$ARCH" == "x86_64" ]]; then
		make all
	else
		CROSS_CONTAINER_OPTS="--platform linux/amd64" cross build --release --target x86_64-unknown-linux-gnu
	fi
	cd $CURRENT_PATH
}

function install() {
    if command -v rustc >/dev/null 2>&1; then
        echo "Installed Rust detected."
    else
        echo "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
        echo "Rust installed."
    fi
}

echo "== Building phase..."
install
build_soon
echo "== Build done!"