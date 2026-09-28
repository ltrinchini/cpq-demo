# syntax=docker/dockerfile:1

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time-only placeholder: satisfies the eager `DATABASE_URL` check in
# `lib/db/client.ts` while Next.js collects page data (no query runs during
# the build, every page is dynamic — see `lib/visitor.ts`). The real value
# comes from `docker-compose.yml` at container startup.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
# `NEXT_PUBLIC_*` variables are inlined into the build, unlike `DATABASE_URL`
# (`app/layout.tsx`, "Sharing metadata"): it must be an `ARG` here, set at
# runtime it would have no effect.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app .
USER app
EXPOSE 3000
CMD ["sh", "-c", "npm run db:migrate && npm run start -- -H 0.0.0.0"]
