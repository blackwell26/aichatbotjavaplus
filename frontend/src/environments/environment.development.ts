import { Environment } from './environment.type';

/**
 * Local development environment.
 * Matches the Spring Boot 'local' / 'dev' profiles.
 * API runs on localhost:8080 via Docker Compose.
 */
export const environment: Environment = {
  name: 'development',
  production: false,

  apiBaseUrl: 'http://localhost:8080/api/v1',
  wsBaseUrl: 'ws://localhost:8080/ws',

  enableDebugLogging: true,
  useMockApi: false,

  auth: {
    issuer: 'http://localhost:9000', // Keycloak / local OIDC provider
    clientId: 'aichatbot-frontend',
    scope: 'openid profile email',
    tokenRefreshBufferSeconds: 60,
    sessionTimeoutSeconds: 1800,
    sessionTimeoutWarningSeconds: 300,
  },

  features: {
    chatEnabled: true,
    streamingEnabled: true,
    humanEscalationEnabled: true,
    conversationHistoryEnabled: true,
    suggestedPromptsEnabled: true,
    chatAttachmentsEnabled: false,
  },
};
