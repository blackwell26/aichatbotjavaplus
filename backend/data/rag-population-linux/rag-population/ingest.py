#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

import psycopg


TYPE_BY_NAME = {
    "faq": "FAQ",
    "policy": "POLICY",
    "manual": "MANUAL",
    "support": "SUPPORT_ARTICLE",
}


def ollama_embedding(base_url: str, model: str, text: str) -> list[float]:
    body = json.dumps({"model": model, "input": text}).encode()
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}/api/embed",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            payload = json.load(response)
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Cannot call Ollama at {base_url}: {exc}") from exc
    embeddings = payload.get("embeddings")
    if not embeddings:
        raise RuntimeError(f"Ollama returned no embedding: {payload}")
    return embeddings[0]


def title_from_text(path: Path, text: str) -> str:
    match = re.search(r"(?m)^#\s+(.+?)\s*$", text)
    return match.group(1) if match else path.stem.replace("_", " ").title()


def source_type(path: Path) -> str:
    lowered = path.stem.lower()
    return next((value for key, value in TYPE_BY_NAME.items() if key in lowered),
                "SUPPORT_ARTICLE")


def markdown_sections(text: str) -> list[tuple[str, str]]:
    lines = text.splitlines()
    sections: list[tuple[str, str]] = []
    current_heading = ""
    current_body: list[str] = []

    def flush() -> None:
        nonlocal current_body
        body = "\n".join(current_body).strip()
        if current_heading or body:
            sections.append((current_heading, body))
        current_body = []

    for line in lines:
        heading_match = re.match(r"^(#{1,6})\s+(.+?)\s*$", line)
        if heading_match:
            flush()
            current_heading = heading_match.group(2).strip()
            continue
        current_body.append(line)

    flush()
    if not sections:
        return [("", text.strip())] if text.strip() else []
    return sections


def split_section(heading: str, body: str, size: int, overlap: int) -> list[str]:
    normalized = re.sub(r"\s+", " ", body).strip()
    if not normalized:
        return []

    prefix = f"{heading}. " if heading else ""
    max_body = max(100, size - len(prefix))
    chunks: list[str] = []
    start = 0
    while start < len(normalized):
        end = min(start + max_body, len(normalized))
        if end < len(normalized):
            boundary = normalized.rfind(" ", start + max_body // 2, end)
            if boundary > start:
                end = boundary
        chunk_body = normalized[start:end].strip()
        if chunk_body:
            chunks.append(prefix + chunk_body)
        if end == len(normalized):
            break
        start = max(end - overlap, start + 1)
    return chunks


def chunk_text(text: str, size: int, overlap: int) -> list[str]:
    chunks: list[str] = []
    for heading, body in markdown_sections(text):
        if heading and not body:
            continue
        chunks.extend(split_section(heading, body, size, overlap))
    return chunks


def vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{value:.9g}" for value in values) + "]"


def ingest_file(conn, path: Path, args) -> str:
    raw = path.read_bytes()
    text = raw.decode("utf-8")
    digest = hashlib.sha256(raw).hexdigest()
    uri = path.resolve().as_uri()
    title = title_from_text(path, text)
    chunks = chunk_text(text, args.chunk_size, args.chunk_overlap)
    if not chunks:
        return f"SKIP {path.name}: empty"

    with conn.cursor() as cur:
        cur.execute(
            """SELECT id FROM knowledge_documents
               WHERE source_uri = %s AND content_hash = %s AND status = 'ACTIVE'""",
            (uri, digest),
        )
        if cur.fetchone():
            return f"SKIP {path.name}: unchanged"

        cur.execute(
            "SELECT COALESCE(max(version), 0) + 1 FROM knowledge_documents WHERE source_uri = %s",
            (uri,),
        )
        version = cur.fetchone()[0]
        cur.execute(
            "UPDATE knowledge_documents SET status = 'INACTIVE' WHERE source_uri = %s AND status = 'ACTIVE'",
            (uri,),
        )
        cur.execute(
            """INSERT INTO knowledge_documents
               (title, source_uri, source_title, source_type, version, content_hash, status,
                metadata)
               VALUES (%s, %s, %s, %s, %s, %s, 'PROCESSING', %s)
               RETURNING id""",
            (title, uri, title, source_type(path), version, digest,
             json.dumps({"file_name": path.name})),
        )
        document_id = cur.fetchone()[0]

        for index, content in enumerate(chunks):
            embedding = ollama_embedding(args.ollama_url, args.model, content)
            if len(embedding) != args.dimensions:
                raise RuntimeError(
                    f"{args.model} returned {len(embedding)} dimensions; "
                    f"schema expects {args.dimensions}"
                )
            cur.execute(
                """INSERT INTO knowledge_chunks
                   (document_id, sequence_number, content, token_count, metadata)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                (document_id, index, content, len(content.split()),
                 json.dumps({"character_count": len(content)})),
            )
            chunk_id = cur.fetchone()[0]
            cur.execute(
                """INSERT INTO document_embeddings
                   (document_id, chunk_id, embedding_model, embedding_vector,
                    source_title, source_type, version, dimension, embedding_id)
                   VALUES (%s, %s, %s, %s::vector, %s, %s, %s, %s, %s)""",
                (document_id, chunk_id, args.model, vector_literal(embedding),
                 title, source_type(path), version, len(embedding),
                 f"{path.stem}-{version}-{index}"),
            )
        cur.execute(
            "UPDATE knowledge_documents SET status = 'ACTIVE' WHERE id = %s",
            (document_id,),
        )
    return f"OK   {path.name}: version={version}, chunks={len(chunks)}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Populate PostgreSQL RAG tables.")
    parser.add_argument("directory", nargs="?", default="knowledge")
    parser.add_argument("--model", default=os.getenv("EMBEDDING_MODEL", "nomic-embed-text"))
    parser.add_argument("--ollama-url", default=os.getenv("OLLAMA_URL", "http://localhost:11434"))
    parser.add_argument("--dimensions", type=int, default=1536)
    parser.add_argument("--chunk-size", type=int, default=1000)
    parser.add_argument("--chunk-overlap", type=int, default=150)
    args = parser.parse_args()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is required.", file=sys.stderr)
        return 2

    paths = sorted(
        p for p in Path(args.directory).rglob("*")
        if p.is_file() and p.suffix.lower() in {".md", ".txt"}
    )
    if not paths:
        print(f"No .md or .txt documents found in {args.directory}", file=sys.stderr)
        return 2

    with psycopg.connect(database_url) as conn:
        for path in paths:
            try:
                print(ingest_file(conn, path, args))
                conn.commit()
            except Exception as exc:
                conn.rollback()
                print(f"FAIL {path.name}: {exc}", file=sys.stderr)
                return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
