# Builds the site and serves it with nginx (same idea as pharmbio-web).
#   docker build -t chemsafe-workshop --build-arg BASE_URL=https://your.domain/ .
#   docker run -p 8080:80 chemsafe-workshop
FROM debian:bookworm-slim AS build
ARG HUGO_VERSION=0.140.2
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates wget \
 && wget -q -O /tmp/hugo.deb https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
 && dpkg -i /tmp/hugo.deb && rm /tmp/hugo.deb && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY . .
ARG BASE_URL=http://localhost:8080/
RUN hugo --gc --minify --baseURL "$BASE_URL"

FROM nginx:alpine
COPY --from=build /src/public /usr/share/nginx/html
