The frontend Docker image is already set up to run as a production Angular build served by NGINX on port `8080`.

Use these steps from the repo root:

```powershell
cd frontend
docker build -t aichatbot-frontend .
docker run --rm -p 8080:8080 --name aichatbot-frontend aichatbot-frontend
```

Then open:

```text
http://localhost:8080
```

A few project-specific notes:
- The image uses `npm run build:prod` during the build stage.
- It serves the compiled app from NGINX, not `ng serve`.
- The frontend is configured to call the backend at `http://localhost:8080/api/v1` in development, so if your backend is also using `8080`, you will need to change one of the ports or run them behind a proxy.

If you want a local dev container instead of the production NGINX image, that would need a different Dockerfile or compose override, because the current one is optimized for serving a built app.

The Dockerfile is now resilient to the Angular build output layout.

What changed in [frontend/Dockerfile](/C:/_Dev/chatbot/aichatbotjava/frontend/Dockerfile):
- After `npm run build:prod`, it now normalizes the output into `/app/dist/site`.
- The runtime stage copies `/app/dist/site/.` instead of assuming `/browser` exists.
- That handles both Angular output shapes:
- `dist/aichatbot-frontend/browser`
- `dist/aichatbot-frontend`

Rebuild with:

```powershell
cd frontend
docker build -t aichatbot-frontend .
docker run --rm -p 8080:8080 --name aichatbot-frontend aichatbot-frontend
```

If you want, I can also check the `nginx.conf` next, because the next likely failure after this is SPA routing or the `/health` endpoint.


Use port binding on that specific host IP when you run the container:

```powershell
cd frontend
docker build -t aichatbot-frontend .
#docker run --rm --name aichatbot-frontend -p 192.168.1.87:8080:8080 aichatbot-frontend
docker run --rm --name aichatbot-frontend -p 192.168.1.87:4200:8080 aichatbot-frontend

npm run start:dev -- --host 0.0.0.0 --port 4200

```

Then open:

```text
http://192.168.1.87:8080
```

If you want the Angular dev server instead of the NGINX container, run it bound to all interfaces:

```powershell
cd frontend
npm run start:dev -- --host 0.0.0.0 --port 4200
```

and open:

```text
http://192.168.1.87:4200
```

The Dockerized production build is already fine; the key change is the `-p 192.168.1.87:8080:8080` mapping.