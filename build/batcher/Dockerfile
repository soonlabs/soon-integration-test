FROM ubuntu:24.04

## Add the wait script to the image
COPY --from=ghcr.io/ufoscout/docker-compose-wait:latest /wait /wait

RUN apt update \
	&& apt install -y ca-certificates curl \
	&& rm -rf /var/lib/apt/lists/*

COPY batcher /app/batcher
ENV PATH="/app:${PATH}"

CMD /wait && batcher