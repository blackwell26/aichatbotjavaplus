const appDb = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || "aichatbot");

if (!appDb.getUser("aichatbot")) {
  appDb.createUser({
    user: "aichatbot",
    pwd: "aichatbot",
    roles: [{ role: "readWrite", db: appDb.getName() }]
  });
}

appDb.createCollection("chat_sessions");
appDb.createCollection("chat_messages");
appDb.createCollection("conversation_summaries");
appDb.createCollection("ai_response_metadata");
