# OpenShift Notes

This deployment can run on OpenShift with a few adjustments:

- Replace `type: ClusterIP` services with routes if external access is required.
- Use image streams or a registry approved by the cluster instead of `:latest` tags.
- Ensure the application can run with a randomized UID by avoiding root-only filesystem assumptions.
- If the cluster enforces restricted SCCs, mount writable volumes only where needed and prefer ephemeral storage for caches.
- Prefer external secret management or Sealed Secrets rather than storing plaintext `Secret` manifests in source control.
- If the cluster requires it, set explicit `securityContext` values compatible with the platform policy.
