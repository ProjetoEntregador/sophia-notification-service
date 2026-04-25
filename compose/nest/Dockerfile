# ---------- Build stage ----------
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# toolchain para compilar módulos nativos (pg, baileys) + git para deps git+https (libsignal)
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 \
      make \
      g++ \
      pkg-config \
      git \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock ./

# usa o yarn 1.x já incluso na imagem node (sem corepack/download extra)
ENV npm_config_python=python3
RUN yarn install --network-timeout 600000

COPY . .

RUN yarn build

# ---------- Runtime stage ----------
FROM node:20-bullseye-slim AS runner

WORKDIR /app

# pg_isready é usado pelo entrypoint para aguardar o Postgres
RUN apt-get update && apt-get install -y --no-install-recommends \
      postgresql-client \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
# binários do node_modules ficam disponíveis sem precisar de yarn/npx
ENV PATH=/app/node_modules/.bin:$PATH

# artefatos de build e dependências resolvidas no estágio anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# arquivos necessários em runtime para criar o banco e aplicar migrações
COPY package.json yarn.lock tsconfig.json drizzle.config.ts ./
COPY drizzle ./drizzle
COPY scripts ./scripts

# entrypoint: aguarda Postgres → cria DB se não existir (scripts/create-db.ts) → migra → inicia app
COPY ./compose/nest/entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

CMD ["/usr/local/bin/docker-entrypoint.sh"]
