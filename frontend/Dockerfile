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
RUN npm run build:prod

# Normalize Angular output so the runtime stage can copy a stable path.
RUN if [ -d /app/dist/aichatbot-frontend/browser ]; then \
      cp -r /app/dist/aichatbot-frontend/browser /app/dist/site; \
    else \
      cp -r /app/dist/aichatbot-frontend /app/dist/site; \
    fi

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
COPY --from=builder --chown=101:101 /app/dist/site/. /usr/share/nginx/html/

# Copy NGINX configuration
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf

# Copy service worker and manifest
COPY --from=builder --chown=101:101 /app/src/service-worker.js /usr/share/nginx/html/
COPY --from=builder --chown=101:101 /app/src/manifest.json /usr/share/nginx/html/

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
