FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ARG BETTER_AUTH_URL=http://localhost:3000
ARG BETTER_AUTH_SECRET=build-only-secret-at-least-32-characters
ARG AUTOMATION_SECRET=build-only-automation-secret-32-chars
RUN pnpm db:generate && pnpm build

FROM deps AS migrate
WORKDIR /app
COPY prisma ./prisma
COPY prisma.config.ts ./
CMD ["pnpm", "prisma", "migrate", "deploy"]

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
