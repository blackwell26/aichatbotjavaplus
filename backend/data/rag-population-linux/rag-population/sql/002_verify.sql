SELECT d.source_title, d.source_type, d.version, d.status,
       count(DISTINCT c.chunk_id) AS chunks,
       count(DISTINCT e.embedding_id) AS embeddings
FROM knowledge_documents d
LEFT JOIN knowledge_chunks c ON c.document_id = d.document_id
LEFT JOIN document_embeddings e ON e.document_id = d.document_id
GROUP BY d.document_id
ORDER BY d.source_type, d.source_title;

SELECT
    (SELECT count(*) FROM knowledge_documents WHERE status = 'ACTIVE') AS active_documents,
    (SELECT count(*) FROM knowledge_chunks) AS chunks,
    (SELECT count(*) FROM document_embeddings) AS embeddings;
