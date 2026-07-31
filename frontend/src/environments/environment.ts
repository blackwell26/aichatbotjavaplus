import { Environment } from './environment.type';
import { getRuntimeConfig } from './runtime-config';

/**
 * Production environment.
 * Matches the Spring Boot 'prod' profile.
 * Replace placeholder URLs with actual production hostnames.
 */
export const environment: Environment = {
  name: 'production',
  production: true,

  apiBaseUrl: getRuntimeConfig().apiBaseUrl ?? 'https://api.aichatbot.example.com/api/v1',
  clientLogUrl: getRuntimeConfig().clientLogUrl ?? 'https://api.aichatbot.example.com/api/v1/client-logs',
  wsBaseUrl: getRuntimeConfig().wsBaseUrl ?? 'wss://api.aichatbot.example.com/ws',

  enableDebugLogging: false,
  useMockApi: false,

  auth: {
    issuer: getRuntimeConfig().authIssuer ?? 'https://auth.aichatbot.example.com',
    clientId: 'aichatbot-frontend',
    scope: 'openid profile email',
    tokenRefreshBufferSeconds: 120,
    sessionTimeoutSeconds: 900,
    sessionTimeoutWarningSeconds: 120,
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
