/**
 * Staging environment.
 * Matches the Spring Boot 'dev' profile deployed on the staging cluster.
 * Replace placeholder URLs with actual staging hostnames.
 */
export const environment = {
    name: 'staging',
    production: false,
    apiBaseUrl: 'https://api.staging.aichatbot.example.com/api/v1',
    wsBaseUrl: 'wss://api.staging.aichatbot.example.com/ws',
    enableDebugLogging: true,
    useMockApi: false,
    auth: {
        issuer: 'https://auth.staging.aichatbot.example.com',
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
