package com.company.chatbot.recommendation;

/**
 * Explainable product recommendation surfaced during chat interactions.
 */
public class Recommendation {

    private String productId;
    private double score;
    private String reason;
    private String source;

    public Recommendation() {}

    public Recommendation(String productId, double score, String reason, String source) {
        this.productId = productId;
        this.score = score;
        this.reason = reason;
        this.source = source;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
