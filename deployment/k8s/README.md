# Kubernetes Deployment Assets

These manifests provide a minimal production-style deployment for the chatbot stack.

Included:

- `namespace.yaml`
- `configmap.yaml`
- `secret.example.yaml`
- `backend-deployment.yaml`
- `backend-service.yaml`
- `frontend-deployment.yaml`
- `frontend-service.yaml`
- `kustomization.yaml`
- `openshift-notes.md`

Notes:

- Copy `secret.example.yaml` to `secret.yaml` and replace the placeholder values before applying.
- Backend health probes target Spring Boot actuator endpoints.
- Frontend health probes target the NGINX `/health` endpoint.
