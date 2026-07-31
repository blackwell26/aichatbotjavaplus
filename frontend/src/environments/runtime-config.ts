export interface RuntimeConfig {
  apiBaseUrl?: string;
  clientLogUrl?: string;
  wsBaseUrl?: string;
  authIssuer?: string;
}

declare global {
  interface Window {
    __AI_CHATBOT_RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

export function getRuntimeConfig(): RuntimeConfig {
  return window.__AI_CHATBOT_RUNTIME_CONFIG__ ?? {};
}
