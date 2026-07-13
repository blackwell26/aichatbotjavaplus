/** Application roles matching backend RBAC configuration. */
export enum Role {
  Customer = 'ROLE_CUSTOMER',
  Agent = 'ROLE_AGENT',
  Manager = 'ROLE_MANAGER',
  KnowledgeAdmin = 'ROLE_KNOWLEDGE_ADMIN',
  SystemAdmin = 'ROLE_SYSTEM_ADMIN',
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}
