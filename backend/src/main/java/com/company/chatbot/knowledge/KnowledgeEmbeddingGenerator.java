package com.company.chatbot.knowledge;

public interface KnowledgeEmbeddingGenerator {
    float[] embed(String text);
}
