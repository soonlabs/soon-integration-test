
## Submodules

When first cloning repo, run below command to recursively clone into all the submodules:

```sh
git submodule update --init --recursive
```

## Setup

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

## Running setup script

After setup you can run script to setup local docker network of L1, soon node, soon proposer

```sh
./l1-setup.sh`
```

## Run Tests

With docker network up and running in another terminal run tests with command below

```sh
yarn && yarn tests
```
