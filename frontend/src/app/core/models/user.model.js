/** Application roles matching backend RBAC configuration. */
export var Role;
(function (Role) {
    Role["Customer"] = "ROLE_CUSTOMER";
    Role["Agent"] = "ROLE_AGENT";
    Role["Manager"] = "ROLE_MANAGER";
    Role["KnowledgeAdmin"] = "ROLE_KNOWLEDGE_ADMIN";
    Role["SystemAdmin"] = "ROLE_SYSTEM_ADMIN";
})(Role || (Role = {}));
