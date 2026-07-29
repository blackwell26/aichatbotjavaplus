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