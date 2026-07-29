SELECT d.source_title, d.source_type, d.version, d.status,
       count(DISTINCT c.id) AS chunks,
       count(DISTINCT e.id) AS embeddings
FROM knowledge_documents d
LEFT JOIN knowledge_chunks c ON c.document_id = d.id
LEFT JOIN document_embeddings e ON e.document_id = d.id
GROUP BY d.id
ORDER BY d.source_type, d.source_title;

SELECT
    (SELECT count(*) FROM knowledge_documents WHERE status = 'ACTIVE') AS active_documents,
    (SELECT count(*) FROM knowledge_chunks) AS chunks,
    (SELECT count(*) FROM document_embeddings) AS embeddings;
