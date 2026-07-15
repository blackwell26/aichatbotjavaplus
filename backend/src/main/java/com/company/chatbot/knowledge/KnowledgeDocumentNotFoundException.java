package com.company.chatbot.knowledge;

public class KnowledgeDocumentNotFoundException extends RuntimeException {
    public KnowledgeDocumentNotFoundException(Long documentId) {
        super("Knowledge document not found: " + documentId);
    }
}
