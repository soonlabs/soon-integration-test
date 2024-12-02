#!/bin/bash

set -e

CLEAN_BUILD="${1:-true}"

CURRENT_PATH=$(pwd)
OS=$(uname -s)
ARCH=$(uname -m)

function docker_build() {
	local DOCKER_PATH="$1"
	local IMAGE_NAME="$2"
	local DOCKER_EXTRA_ARGS=()

	if [[ " $@ " =~ " --push " ]]; then
		DOCKER_EXTRA_ARGS+=("--push")
	fi

	echo "DOCKER_EXTRA_ARGS: ${DOCKER_EXTRA_ARGS[@]}"
	cd $DOCKER_PATH
	if [[ "$OS" == "Linux" && "$ARCH" == "x86_64" ]]; then
		if [[ "$CLEAN_BUILD" == "true" ]]; then
			docker build --no-cache -t $IMAGE_NAME .
		else
			docker build -t $IMAGE_NAME .
		fi
	else
		docker build --platform linux/amd64 -t $IMAGE_NAME .
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

function build_soon() {
	cd $SOON_PATH
	if [[ "$OS" == "Linux" && "$ARCH" == "x86_64" ]]; then
		make all
	else
		CROSS_CONTAINER_OPTS="--platform linux/amd64" cross build --release --target x86_64-unknown-linux-gnu
	fi
	cd $CURRENT_PATH
}

echo "== Building phase..."
install
build_soon
echo "== Build done!"

echo "== Building docker image phase..."

echo "Building node docker image..."
cp $SOON_PATH/target/release/soon-node $CURRENT_PATH/build/node/
docker_build "$CURRENT_PATH/build/node" "$NODE_IMAGE_NAME"

echo "Building proposer docker image..."
cp $SOON_PATH/target/release/proposer $CURRENT_PATH/build/proposer
docker_build "$CURRENT_PATH/build/proposer" "$PROPOSER_IMAGE_NAME"

echo "== Building docker image done!"


