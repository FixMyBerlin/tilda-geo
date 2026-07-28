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

# osm2pgsql >= 2.3.0 from trixie-backports (accepted 2026-06-17, 2.3.0+ds-2~bpo13+1).
# Needed for :as_point(n) and n_points() in flex Lua (downstream error-table work).
# curl is pinned to backports alongside osm2pgsql to avoid libcurl4 version collision.
RUN echo "deb http://deb.debian.org/debian trixie-backports main" > /etc/apt/sources.list.d/backports.list
RUN apt update && \
  apt install -y -t trixie-backports osm2pgsql osmium-tool curl && \
  apt install -y wget python3 python3-requests && \
  apt upgrade -y

# 'data' folder is root
RUN mkdir /data

RUN curl -fsSL https://bun.sh/install | bash
ENV PATH=/root/.bun/bin:$PATH

# copy the source code
COPY processing /processing/

# Used by dev `generateTypes` (oxfmt); path must match processing/steps/generateTypes.ts
COPY app/oxfmt.config.mjs /processing/oxfmt.config.mjs

# Download and setup Geofabrik OAuth client to /usr/local/bin (outside the mounted volume).
# Note: This is where (the only place) `python3-requests` is used.
RUN curl -o /usr/local/bin/oauth_cookie_client.py https://raw.githubusercontent.com/geofabrik/sendfile_osm_oauth_protector/master/oauth_cookie_client.py && \
    chmod +x /usr/local/bin/oauth_cookie_client.py

# install bun packages
RUN bun install

# Commit SHA for "Processing: Startup" logs (no .git in image; set via CI build-arg).
ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA

CMD ["bun", "run", "/processing/index.ts"]
