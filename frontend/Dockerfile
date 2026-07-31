# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --prefer-offline --no-audit

COPY . .
RUN npm run build -- --configuration=production

RUN if [ -d /app/dist/aichatbot-frontend/browser ]; then \
      cp -r /app/dist/aichatbot-frontend/browser /app/dist/site; \
    else \
      cp -r /app/dist/aichatbot-frontend /app/dist/site; \
    fi

RUN npm prune --production

# Stage 2: Runtime
FROM nginx:1.27-alpine AS runtime

LABEL maintainer="AI Chatbot Team"
LABEL description="AI Customer Service Chatbot Frontend"
LABEL version="1.0.0"

RUN apk add --no-cache curl

RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

COPY --from=builder --chown=101:101 /app/dist/site/. /usr/share/nginx/html/
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 public/runtime-config.template.js /usr/share/nginx/html/runtime-config.template.js
COPY --chown=101:101 docker-entrypoint.sh /usr/local/bin/frontend-entrypoint.sh

RUN chmod +x /usr/local/bin/frontend-entrypoint.sh && \
    echo 'pid /tmp/nginx.pid;' > /etc/nginx/nginx.conf && \
    echo 'worker_processes auto;' >> /etc/nginx/nginx.conf && \
    echo 'error_log /var/log/nginx/error.log warn;' >> /etc/nginx/nginx.conf && \
    echo 'events { worker_connections 1024; }' >> /etc/nginx/nginx.conf && \
    echo 'http {' >> /etc/nginx/nginx.conf && \
    echo '    include /etc/nginx/mime.types;' >> /etc/nginx/nginx.conf && \
    echo '    default_type application/octet-stream;' >> /etc/nginx/nginx.conf && \
    echo '    log_format main '"'"'$remote_addr - $remote_user [$time_local] "$request" '"'"' >> /etc/nginx/nginx.conf && \
    echo '                    '"'"'$status $body_bytes_sent "$http_referer" '"'"' >> /etc/nginx/nginx.conf && \
    echo '                    '"'"'"$http_user_agent" "$http_x_forwarded_for"'"'"';' >> /etc/nginx/nginx.conf && \
    echo '    access_log /var/log/nginx/access.log main;' >> /etc/nginx/nginx.conf && \
    echo '    include /etc/nginx/conf.d/*.conf;' >> /etc/nginx/nginx.conf && \
    echo '}' >> /etc/nginx/nginx.conf && \
    chown 101:101 /etc/nginx/nginx.conf

RUN chown -R 101:101 /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

RUN mkdir -p /var/cache/nginx /var/run && \
    chown -R 101:101 /var/cache/nginx /var/run

USER 101:101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["/usr/local/bin/frontend-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
