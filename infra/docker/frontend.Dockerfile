# Frontend image: build the Vite bundle, serve it with nginx.
# Build context is the repo root (see docker-compose.yml `frontend.build.context: ..`).
FROM node:22-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
# `npm ci`, not `--omit=dev`: vite and typescript live in devDependencies and are what
# performs the build, so a production-only install leaves nothing to build with.
RUN npm ci

COPY frontend/ ./

# The API origin is baked in at build time — Vite inlines `import.meta.env.VITE_*` into
# the bundle. Default is empty, meaning same-origin: nginx below proxies /api to the
# backend container, so no absolute host is compiled into the image.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine

# Vite writes to dist/, not build/ — the path the CRA-era version of this file used.
COPY --from=build /app/dist /usr/share/nginx/html
COPY infra/docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
