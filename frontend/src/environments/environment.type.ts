/**
 * Shape of the Angular environment configuration object.
 * All environment files must satisfy this interface.
 */
export interface Environment {
  /** Human-readable environment name. */
  name: string;

  /** Set to true only for the production build configuration. */
  production: boolean;

  /** Base URL of the API gateway / backend-for-frontend. */
  apiBaseUrl: string;

  /** Base WebSocket URL for real-time chat and agent features. */
  wsBaseUrl: string;

  /** Enable/disable verbose client-side logging. */
  enableDebugLogging: boolean;

  /** Enable mock API responses (useful for local UI-only development). */
  useMockApi: boolean;

  /** OAuth 2.0 / OIDC configuration. */
  auth: {
    issuer: string;
    clientId: string;
    scope: string;
    /** Time in seconds before access-token expiry to trigger silent refresh. */
    tokenRefreshBufferSeconds: number;
    /** Session inactivity timeout in seconds before the user is warned. */
    sessionTimeoutSeconds: number;
    sessionTimeoutWarningSeconds: number;
  };

  /** Feature flags — mirror WEB-ADM-004 toggles. */
  features: {
    chatEnabled: boolean;
    streamingEnabled: boolean;
    humanEscalationEnabled: boolean;
    conversationHistoryEnabled: boolean;
    suggestedPromptsEnabled: boolean;
    chatAttachmentsEnabled: boolean;
  };
}
