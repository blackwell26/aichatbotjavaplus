# Multi-stage build for Angular frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM node:18-alpine
WORKDIR /app
RUN npm install -g http-server
COPY --from=builder /app/dist ./dist
EXPOSE 4200

ENV API_URL=http://localhost:8080
CMD ["http-server", "dist", "-p", "4200", "--proxy", "${API_URL}"]
