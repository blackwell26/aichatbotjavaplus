#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$BACKEND_DIR/.." && pwd)"
ENV_FILE="$REPO_DIR/.env"
IMAGE_NAME="aichatbot_backend"
CONTAINER_NAME="aichatbot_backend"
NETWORK_NAME="${COMPOSE_PROJECT_NAME:-aichatbotjava}_network"
BACKEND_PORT="${BACKEND_PORT:-8080}"

load_env() {
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
  fi
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "docker is not installed or not on PATH" >&2
    exit 1
  fi
}

ensure_image() {
  if ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
    echo "Docker image '$IMAGE_NAME' not found. Build it first with:" >&2
    echo "  $0 build" >&2
    exit 1
  fi
}

ensure_network() {
  if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    docker network create "$NETWORK_NAME" >/dev/null
  fi
}

start_backend() {
  load_env
  require_docker
  ensure_image
  ensure_network

  if docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
    docker rm -f "$CONTAINER_NAME" >/dev/null
  fi

  docker run -d \
    --name "$CONTAINER_NAME" \
    --network "$NETWORK_NAME" \
    -p "${BACKEND_PORT}:8080" \
    -e SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-docker}" \
    -e SPRING_DATASOURCE_URL="${SPRING_DATASOURCE_URL:-jdbc:postgresql://postgres:5432/aichatbot}" \
    -e SPRING_DATASOURCE_USERNAME="${SPRING_DATASOURCE_USERNAME:-aichatbot}" \
    -e SPRING_DATASOURCE_PASSWORD="${SPRING_DATASOURCE_PASSWORD:-aichatbot}" \
    -e SPRING_DATA_MONGODB_URI="${SPRING_DATA_MONGODB_URI:-mongodb://admin:admin@mongo:27017/aichatbot?authSource=admin}" \
    -e SPRING_DATA_REDIS_HOST="${SPRING_DATA_REDIS_HOST:-redis}" \
    -e SPRING_DATA_REDIS_PORT="${SPRING_DATA_REDIS_PORT:-6379}" \
    -e SPRING_DATA_REDIS_PASSWORD="${SPRING_DATA_REDIS_PASSWORD:-redis}" \
    -e SPRING_KAFKA_BOOTSTRAP_SERVERS="${SPRING_KAFKA_BOOTSTRAP_SERVERS:-kafka:9092}" \
    -e SPRING_AI_OLLAMA_BASE_URL="${SPRING_AI_OLLAMA_BASE_URL:-http://ollama:11434}" \
    -e SPRING_AI_OLLAMA_CHAT_OPTIONS_MODEL="${SPRING_AI_OLLAMA_CHAT_OPTIONS_MODEL:-llama3.1}" \
    -e MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE="${MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE:-health,info,metrics,prometheus}" \
    -e MANAGEMENT_ENDPOINT_HEALTH_PROBES_ENABLED="${MANAGEMENT_ENDPOINT_HEALTH_PROBES_ENABLED:-true}" \
    -e MANAGEMENT_METRICS_EXPORT_PROMETHEUS_ENABLED="${MANAGEMENT_METRICS_EXPORT_PROMETHEUS_ENABLED:-true}" \
    -e OTEL_EXPORTER_OTLP_ENDPOINT="${OTEL_EXPORTER_OTLP_ENDPOINT:-http://jaeger:4318}" \
    "$IMAGE_NAME"

  echo "Started $CONTAINER_NAME on port $BACKEND_PORT"
}

build_backend() {
  require_docker
  docker build -t "$IMAGE_NAME" "$BACKEND_DIR"
}

stop_backend() {
  require_docker
  if docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
    docker rm -f "$CONTAINER_NAME" >/dev/null
    echo "Stopped $CONTAINER_NAME"
  else
    echo "Container $CONTAINER_NAME is not running"
  fi
}

logs_backend() {
  require_docker
  docker logs -f "$CONTAINER_NAME"
}

status_backend() {
  require_docker
  docker ps -a --filter "name=^/${CONTAINER_NAME}$"
}

start_dependencies() {
  require_docker
  if [[ ! -f "$REPO_DIR/docker-compose.yml" ]]; then
    echo "docker-compose.yml not found at $REPO_DIR/docker-compose.yml" >&2
    exit 1
  fi

  docker compose -f "$REPO_DIR/docker-compose.yml" up -d postgres mongo redis zookeeper kafka ollama
}

usage() {
  cat <<EOF
Usage: $0 {build|start|stop|restart|logs|status|deps|all}

Commands:
  build   Build the backend image
  start   Run the backend container
  stop    Stop and remove the backend container
  restart Stop then start the backend container
  logs    Follow backend logs
  status  Show container status
  deps    Start the Docker Compose dependency services
  all     Start deps, build the image, then start the backend
EOF
}

case "${1:-}" in
  build) build_backend ;;
  start) start_backend ;;
  stop) stop_backend ;;
  restart) stop_backend && start_backend ;;
  logs) logs_backend ;;
  status) status_backend ;;
  deps) start_dependencies ;;
  all) start_dependencies && build_backend && start_backend ;;
  *)
    usage
    exit 1
    ;;
esac
