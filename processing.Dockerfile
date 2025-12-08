FROM debian:trixie AS testing
WORKDIR /processing

# Install Lua and "luarocks" (Lua package manager) – https://luarocks.org/
RUN apt update && apt install -y lua5.3 liblua5.3-dev luarocks

# `busted` is our testing framework https://lunarmodules.github.io/busted/
# `inspect` is to print / inspect tables https://github.com/kikito/inspect.lua
# `penlight` is to add python like helpers to lua https://lunarmodules.github.io/Penlight/, https://github.com/lunarmodules/Penlight, https://luarocks.org/modules/tieske/penlight
# `ftcsv` is to read CSV files https://github.com/FourierTransformer/ftcsv, https://luarocks.org/modules/fouriertransformer/ftcsv
#
# REMINDER: `docker compose build processing` is required to install new packages
RUN luarocks install busted && \
    luarocks install inspect && \
    luarocks install penlight && \
    luarocks install ftcsv

ENTRYPOINT [ "busted" ]
CMD ["--pattern=%.test%.lua$", "/processing/topics/"]
# Testing: Hacky way to only run a specific file
# CMD ["--pattern=%BikelaneTodos.test%.lua$", "/processing/topics/"]

FROM testing AS processing

# reset the entrypoint
ENTRYPOINT []

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Berlin
LABEL maintainer="FixMyCity - https://fixmycity.de"

# Install the docker-cli inside the processing container to be able to restart the martin container
# The setting below in docker-compose.yml is required for this to work
# volumes:
#   - /var/run/docker.sock:/var/run/docker.sock
COPY --from=docker:dind /usr/local/bin/docker /usr/local/bin/

# Debian 13 Trixie (stable) includes newer versions of osm2pgsql and osmium-tool
# If backports are needed in the future, uncomment the following:
# RUN echo "deb http://deb.debian.org/debian trixie-backports main" > /etc/apt/sources.list.d/backports.list
# … and below:
# apt install -y -t trixie-backports osm2pgsql osmium-tool curl && \
RUN apt update && \
  apt install -y osm2pgsql osmium-tool curl && \
  apt install -y wget python3 python3-requests && \
  apt upgrade -y

# 'data' folder is root
RUN mkdir /data

RUN curl -fsSL https://bun.sh/install | bash
ENV PATH=/root/.bun/bin:$PATH

# copy the source code
COPY processing /processing/

# Download and setup Geofabrik OAuth client to /usr/local/bin (outside the mounted volume).
# Note: This is where (the only place) `python3-requests` is used.
RUN curl -o /usr/local/bin/oauth_cookie_client.py https://raw.githubusercontent.com/geofabrik/sendfile_osm_oauth_protector/master/oauth_cookie_client.py && \
    chmod +x /usr/local/bin/oauth_cookie_client.py

# install bun packages
RUN bun install

CMD ["bun", "run", "/processing/index.ts"]
