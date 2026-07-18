const appDb = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || "aichatbot");

if (!appDb.getUser("aichatbot")) {
  appDb.createUser({
    user: "aichatbot",
    pwd: "aichatbot",
    roles: [{ role: "readWrite", db: appDb.getName() }]
  });
}

[
  "chat_sessions",
  "chat_messages",
  "conversation_summaries",
  "ai_response_metadata"
].forEach((collectionName) => {
  if (!appDb.getCollectionNames().includes(collectionName)) {
    appDb.createCollection(collectionName);
  }
});
