FROM oven/bun:1.2.19 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM nginx:1.27-alpine AS runtime
LABEL org.opencontainers.image.title="myaitech/studio" \
      org.opencontainers.image.version="0.1.0-rc.3"
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/runtime-config.template.js /usr/share/nginx/html/runtime-config.template.js
COPY docker/30-runtime-config.sh /docker-entrypoint.d/30-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/30-runtime-config.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
