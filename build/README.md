## About

This is build directory for all the docker images needed to run docker compose of the node. There are 3 docker images that are built in this directory:
- `node`: This is the main docker image that runs the soon node.
- `proposer`: This is the proposer docker image that runs the proposer.

And also there is a `node-base` directory that contains the base node docker image that the node image is built on top of. If you want to re-build the base node image, you can go to the `node-base` directory and run the build script there.

## Building

Before building make sure you have installed the following packages:
- docker
- docker-compose
- make
- git
- rust
- cargo
- go

To build the docker images, run the following command:

```bash
./build.sh
```

Note that we suppose that you place this repo directory in the same directory as the `soon` directory. If you place this repo directory in a different location, you need to modify the ".envrc" file in this directory to point to the correct location of the `soon`. 