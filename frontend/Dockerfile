# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install dependencies with clean install
RUN npm ci --ignore-scripts --prefer-offline --no-audit

# Copy source files
COPY . .

# Build application for production
# Uses optimization settings from angular.json
RUN npm run build -- --configuration=production

# Remove development dependencies to reduce size
RUN npm prune --production

# ─── Stage 2: Serve with NGINX ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Add labels for metadata
LABEL maintainer="AI Chatbot Team"
LABEL description="AI Customer Service Chatbot Frontend"
LABEL version="1.0.0"

# Install curl for healthcheck
RUN apk add --no-cache curl

# Remove default NGINX static assets and config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy built Angular app from builder stage
# Angular 19+ outputs directly to dist/aichatbot-frontend (no browser subdirectory)
COPY --from=builder --chown=101:101 /app/dist/aichatbot-frontend /usr/share/nginx/html

# Copy NGINX configuration
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx.conf that works with non-root user
RUN echo 'pid /tmp/nginx.pid;' > /etc/nginx/nginx.conf && \
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

# Service worker and manifest are included in the build output if configured
# No need to copy separately as they're part of the dist folder

# Set proper permissions
RUN chown -R 101:101 /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Create cache and pid directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/run && \
    chown -R 101:101 /var/cache/nginx /var/run

# Switch to non-root user
USER 101:101

# Expose port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
