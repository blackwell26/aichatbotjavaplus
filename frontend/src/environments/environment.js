/**
 * Production environment.
 * Matches the Spring Boot 'prod' profile.
 * Replace placeholder URLs with actual production hostnames.
 */
export const environment = {
    name: 'production',
    production: true,
    apiBaseUrl: 'https://api.aichatbot.example.com/api/v1',
    wsBaseUrl: 'wss://api.aichatbot.example.com/ws',
    enableDebugLogging: false,
    useMockApi: false,
    auth: {
        issuer: 'https://auth.aichatbot.example.com',
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
