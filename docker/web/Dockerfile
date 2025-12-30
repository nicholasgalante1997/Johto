FROM oven/bun:latest AS base

FROM base AS workspace

RUN mkdir -p /home/bun/workspace
WORKDIR /home/bun/workspace

RUN bun i -g turbo

FROM workspace AS copy_package_manifests

COPY ./package.json ./package.json
COPY ./bun.lockb ./bun.lockb

COPY ./turbo.json ./turbo.json

COPY ./apps/web ./apps/web

COPY ./packages ./packages

FROM copy_package_manifests AS install

RUN bun install

# Add a testing phase
FROM install AS test

RUN bun run test

FROM install AS check_types

RUN bun run check-types

FROM check_types AS build

RUN bun run build

FROM base AS runtime

RUN mkdir -p /home/bun/runtime-workspace
WORKDIR /home/bun/runtime-workspace

RUN bun i -g turbo

COPY --from=build /home/bun/workspace/package.json ./package.json
COPY --from=build /home/bun/workspace/bun.lockb ./bun.lockb

COPY --from=build /home/bun/workspace/turbo.json ./turbo.json

COPY --from=build /home/bun/workspace/apps/web ./apps/web

COPY --from=build /home/bun/workspace/packages ./packages

RUN rm -rf ./apps/web/node_modules

RUN rm -rf ./packages/**/node_modules

RUN bun install --production

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "docker:web:start"]
