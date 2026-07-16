package com.company.chatbot.ai;

import com.company.chatbot.knowledge.KnowledgeEmbeddingGenerator;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
@ConditionalOnBean(EmbeddingModel.class)
public class SpringAiKnowledgeEmbeddingGenerator implements KnowledgeEmbeddingGenerator {

    private final EmbeddingModel embeddingModel;

    public SpringAiKnowledgeEmbeddingGenerator(EmbeddingModel embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    @Override
    public float[] embed(String text) {
        return embeddingModel.embed(text);
    }
}
