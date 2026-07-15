package com.company.chatbot.knowledge;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Component
public class DeterministicKnowledgeEmbeddingGenerator implements KnowledgeEmbeddingGenerator {

    public static final int DIMENSION = 1536;

    @Override
    public float[] embed(String text) {
        byte[] digest = digest(text == null ? "" : text);
        float[] vector = new float[DIMENSION];
        for (int i = 0; i < vector.length; i++) {
            int value = digest[i % digest.length] & 0xff;
            vector[i] = (value - 128) / 128.0f;
        }
        return vector;
    }

    private byte[] digest(String text) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
