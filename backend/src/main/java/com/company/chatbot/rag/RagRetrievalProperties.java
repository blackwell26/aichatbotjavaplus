package com.company.chatbot.rag;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "rag.retrieval")
public class RagRetrievalProperties {

    private boolean enabled = true;
    private int topK = 5;
    private double similarityThreshold = 0.5;
    private int maxPromptCharacters = 8000;
    private int maxChunkCharacters = 1200;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getTopK() {
        return topK;
    }

    public void setTopK(int topK) {
        this.topK = topK;
    }

    public double getSimilarityThreshold() {
        return similarityThreshold;
    }

    public void setSimilarityThreshold(double similarityThreshold) {
        this.similarityThreshold = similarityThreshold;
    }

    public int getMaxPromptCharacters() {
        return maxPromptCharacters;
    }

    public void setMaxPromptCharacters(int maxPromptCharacters) {
        this.maxPromptCharacters = maxPromptCharacters;
    }

    public int getMaxChunkCharacters() {
        return maxChunkCharacters;
    }

    public void setMaxChunkCharacters(int maxChunkCharacters) {
        this.maxChunkCharacters = maxChunkCharacters;
    }
}
