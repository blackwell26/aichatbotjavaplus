# Validation Toolkit

This directory contains runnable validation entrypoints for the implementation task list.

## Backend

- `scripts/run-backend-tests.ps1` runs the main Maven test suite.

## Frontend

- `scripts/run-frontend-tests.ps1` runs the Angular/Vitest test suite.

## Security

- `scripts/run-zap-baseline.ps1` runs an OWASP ZAP baseline scan against a running local deployment.

## Performance

- `scripts/run-k6-load-test.ps1` runs a k6 smoke load test against the backend chat endpoint.

## Suggested order

1. Start the local stack with `docker-compose.yml`.
2. Run backend and frontend tests.
3. Run the ZAP baseline scan.
4. Run the k6 load test.
