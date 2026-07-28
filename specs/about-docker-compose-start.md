That error means Compose is trying to attach a container to a bridge network whose Docker object no longer exists. The fix is to recreate the Compose network and the stack cleanly.

Use this from the repo root:

```bash
docker compose down --remove-orphans
docker network prune -f
docker compose up -d --force-recreate
```

If you want the most reliable reset for this repo, do:

```bash
docker compose down -v --remove-orphans
docker compose up -d
```

Why this happens:
- The project defines a named network:
  - `aichatbotjava_network` by default
- If Docker Compose was interrupted, or the network was manually deleted, containers can still reference the old network ID
- Starting again then fails with:
  - `failed to set up container networking: network <id> not found`

If it still fails, check these two things:

```bash
docker network ls
docker compose config
```

Also make sure Docker Desktop / Docker Engine is actually running. In this environment I could not reach the Docker daemon, so I couldn’t verify the reset live here. The repo wiring itself looks correct in [docker-compose.yml](/C:/_Dev/chatbot/aichatbotjava/docker-compose.yml).

If you want, I can give you:
1. a safe one-shot cleanup command for Windows PowerShell
2. a Linux equivalent
3. a check to confirm which containers are still holding the stale network reference