import { Environment } from './environment.type';
import { getRuntimeConfig } from './runtime-config';

/**
 * Local development environment.
 * Matches the Spring Boot 'local' / 'dev' profiles.
 * API runs on the remote host at 192.168.1.87:8080 during LAN development.
 */
export const environment: Environment = {
  name: 'development',
  production: false,

  apiBaseUrl: getRuntimeConfig().apiBaseUrl ?? 'http://192.168.1.87:8080/api/v1',
  clientLogUrl: getRuntimeConfig().clientLogUrl ?? 'http://192.168.1.87:8080/api/v1/client-logs',
  wsBaseUrl: getRuntimeConfig().wsBaseUrl ?? 'ws://192.168.1.87:8080/ws',

  enableDebugLogging: true,
  useMockApi: false,

  auth: {
    issuer: getRuntimeConfig().authIssuer ?? 'http://192.168.1.87:9000', // Keycloak / LAN OIDC provider
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
