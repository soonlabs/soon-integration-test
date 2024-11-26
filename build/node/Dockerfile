FROM ubuntu:24.04

RUN apt update \
	&& apt install -y ca-certificates curl \
	&& rm -rf /var/lib/apt/lists/*

ENV PATH="/app:${PATH}"

# RPC JSON
EXPOSE 8899/tcp
# RPC pubsub
EXPOSE 8900/tcp

EXPOSE 8000

## Add the wait script to the image
COPY --from=ghcr.io/ufoscout/docker-compose-wait:latest /wait /wait
COPY soon-node /app/

CMD /wait && soon-node
