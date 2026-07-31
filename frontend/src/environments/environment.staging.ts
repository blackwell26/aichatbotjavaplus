import { Environment } from './environment.type';
import { getRuntimeConfig } from './runtime-config';

/**
 * Staging environment.
 * Matches the Spring Boot 'dev' profile deployed on the staging cluster.
 * Replace placeholder URLs with actual staging hostnames.
 */
export const environment: Environment = {
  name: 'staging',
  production: false,

  apiBaseUrl: getRuntimeConfig().apiBaseUrl ?? 'https://api.staging.aichatbot.example.com/api/v1',
  clientLogUrl: getRuntimeConfig().clientLogUrl ?? 'https://api.staging.aichatbot.example.com/api/v1/client-logs',
  wsBaseUrl: getRuntimeConfig().wsBaseUrl ?? 'wss://api.staging.aichatbot.example.com/ws',

  enableDebugLogging: true,
  useMockApi: false,

  auth: {
    issuer: getRuntimeConfig().authIssuer ?? 'https://auth.staging.aichatbot.example.com',
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
