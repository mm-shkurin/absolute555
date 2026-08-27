# Frontend image: build the Create React App bundle, serve it with nginx.
# Build context is the repo root (see docker-compose.yml `frontend.build.context: ..`).
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
# `npm ci`, not `npm ci --only=production`: react-scripts is what performs the
# build, so a production-only install leaves nothing to run `npm run build` with.
RUN npm ci

COPY frontend/ ./

# The API origin is baked in at build time (CRA inlines REACT_APP_* into the
# bundle). Default is same-origin, so nginx's /api proxy below handles it and no
# absolute host is compiled into the image.
ARG REACT_APP_API_URL=""
ARG REACT_APP_API_BASE_URL=""
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV CI=false
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY infra/docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
