## Submodules

When first cloning repo, run below command to recursively clone into all the submodules(both this repo and soon repo):

```sh
git submodule update --init --recursive
```

## Setup Local Network with Binaries and Run Tests

Script to install dependencies, setup and run tests on a debian based linux machine. Note you will prompted for sudo password for installs. However script will not work if you run it as root user. (SOON_PATH defaults to ../soon).

You may want to comment out some steps in the ubuntu-test.sh, such as ./install.sh if you already have dependencies installed or ./build-soon.sh if you already built soon binaries. For now the install script doesn't work for MacOS or other linux disros, you must manually install.

```sh
SOON_PATH=../soon ./scripts/ubuntu-test.sh
```

## Setup Local Docker network

If you would rather run network in docker, follow bellow steps

Copy environmental variables and change according to your environment

```sh
cp .env.example .env
```

Build soon genesis block

```sh
make genesis
```

Build local docker files from soon monorepo binaries

```sh
make build
```

After setup you can run script to setup local docker network of L1, soon node, soon proposer

```sh
./scripts/docker-l1-setup.sh
```

## Run Tests

With local network up and running, run tests with command below

```sh
yarn && yarn tests
```

## Important config

### l1_deploy_config.json

l1BlockTime: adjust l1 block interval, you can speed up or down finalizing of l1.

l2OutputOracleSubmissionInterval: adjust proposer l2 root submit interval, you can speed up your withdrawal proposing.
