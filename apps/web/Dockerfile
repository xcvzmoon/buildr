# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && \
    corepack prepare pnpm@12.0.0 --activate && \
    pnpm config set store-dir /pnpm/store
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY tests/package.json tests/package.json
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "web..."

FROM deps AS build
ARG API_ORIGIN=http://api:3000
ENV API_ORIGIN=${API_ORIGIN}
COPY apps/web apps/web
RUN rm -rf apps/web/.nuxt && pnpm --filter web run build

FROM node:22-alpine AS runtime
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
ENV PORT=5173
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/web/.output ./
USER node
EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5173)+'/').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/index.mjs"]
