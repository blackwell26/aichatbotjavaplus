#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: run-linux-runbook.sh [--dev] [--skip-frontend] [--skip-backend]

Starts the local Docker Compose stack and, by default, launches the backend and
frontend for local development.

Options:
  --dev            Use the Spring Boot dev profile and staging frontend config.
  --skip-backend    Do not start the backend process.
  --skip-frontend   Do not start the frontend process.
EOF
}

mode="local"
start_backend=1
start_frontend=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev)
      mode="dev"
      shift
      ;;
    --skip-backend)
      start_backend=0
      shift
      ;;
    --skip-frontend)
      start_frontend=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
backend_dir="$repo_root/backend"
frontend_dir="$repo_root/frontend"

echo "Repo root: $repo_root"
echo "Mode: $mode"

cd "$repo_root"

echo "Starting Docker Compose infrastructure..."
docker compose up -d

echo "Waiting for services to report healthy..."
docker compose ps

echo "Recent Postgres logs:"
docker compose logs --no-color --tail=20 postgres || true
echo "Recent Kafka logs:"
docker compose logs --no-color --tail=20 kafka || true
echo "Recent Ollama logs:"
docker compose logs --no-color --tail=20 ollama || true

if [[ "$start_backend" -eq 1 ]]; then
  echo "Starting backend with SPRING_PROFILES_ACTIVE=$mode..."
  (
    cd "$backend_dir"
    export SPRING_PROFILES_ACTIVE="$mode"
    nohup mvn spring-boot:run > "$repo_root/validation/backend-$mode.log" 2>&1 &
    echo $! > "$repo_root/validation/backend-$mode.pid"
  )
  echo "Backend log: $repo_root/validation/backend-$mode.log"
  echo "Backend pid: $repo_root/validation/backend-$mode.pid"
fi

if [[ "$start_frontend" -eq 1 ]]; then
  echo "Starting frontend..."
  (
    cd "$frontend_dir"
    if [[ ! -d node_modules ]]; then
      npm install
    fi
    if [[ "$mode" == "dev" ]]; then
      nohup npm run start:staging > "$repo_root/validation/frontend-$mode.log" 2>&1 &
    else
      nohup npm start > "$repo_root/validation/frontend-$mode.log" 2>&1 &
    fi
    echo $! > "$repo_root/validation/frontend-$mode.pid"
  )
  echo "Frontend log: $repo_root/validation/frontend-$mode.log"
  echo "Frontend pid: $repo_root/validation/frontend-$mode.pid"
fi

echo "Health checks:"
echo "  Backend:  curl http://localhost:8080/actuator/health"
echo "  API:      curl http://localhost:8080/api/v1/health"
echo "  Frontend: open http://localhost:4200"

if [[ "$mode" == "dev" ]]; then
  echo "Dev profile selected. Confirm the dev environment variables are exported before launching the backend."
fi
