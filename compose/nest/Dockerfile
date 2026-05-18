# ---------- Build stage ----------
FROM node:20-bullseye-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 \
      make \
      g++ \
      pkg-config \
      git \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock ./

RUN sed -i \
      -e 's#git+ssh://git@github.com/#https://github.com/#g' \
      -e 's#ssh://git@github.com/#https://github.com/#g' \
      -e 's#git@github.com:#https://github.com/#g' \
      yarn.lock

ENV npm_config_python=python3
RUN yarn install --network-timeout 600000

COPY . .

RUN yarn build

# ---------- Runtime stage ----------
FROM node:20-bullseye-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 \
      make \
      g++ \
      pkg-config \
      git \
      ca-certificates \
      postgresql-client \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PATH=/app/node_modules/.bin:$PATH

COPY package.json yarn.lock ./

RUN sed -i \
      -e 's#git+ssh://git@github.com/#https://github.com/#g' \
      -e 's#ssh://git@github.com/#https://github.com/#g' \
      -e 's#git@github.com:#https://github.com/#g' \
      yarn.lock

ENV npm_config_python=python3
RUN yarn install --production --frozen-lockfile --network-timeout 600000 \
    && yarn cache clean

COPY --from=builder /app/dist ./dist

COPY tsconfig.json drizzle.config.ts ./
COPY drizzle ./drizzle
COPY scripts ./scripts

COPY ./compose/nest/entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

CMD ["/usr/local/bin/docker-entrypoint.sh"]
