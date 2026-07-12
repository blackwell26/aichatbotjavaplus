package com.company.chatbot.security.validation;

import java.util.Set;

public final class FileUploadValidator {

    public static final long MAX_BYTES = 10L * 1024L * 1024L;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "text/plain",
            "text/markdown",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private FileUploadValidator() {}

    public static void validate(String filename, String contentType, long sizeBytes) {
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("filename must not be blank");
        }
        if (filename.length() > 255) {
            throw new IllegalArgumentException("filename exceeds maximum length");
        }
        if (sizeBytes <= 0) {
            throw new IllegalArgumentException("upload must not be empty");
        }
        if (sizeBytes > MAX_BYTES) {
            throw new IllegalArgumentException("upload exceeds maximum size of " + MAX_BYTES + " bytes");
        }
        if (contentType == null || contentType.isBlank()) {
            throw new IllegalArgumentException("content type must not be blank");
        }
        String normalizedContentType = contentType.trim().toLowerCase();
        if (!ALLOWED_CONTENT_TYPES.contains(normalizedContentType)) {
            throw new IllegalArgumentException("unsupported content type: " + contentType);
        }
    }
}
