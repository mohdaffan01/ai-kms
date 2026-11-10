# ADR-001: Selection of ChromaDB & Google Gemini 2.5 Flash for RAG Engine

## Status
Accepted

## Date
2026-10-13

## Context
AI-KMS requires a semantic retrieval pipeline to allow users to ask questions grounded directly in their personal study materials (PDFs, lecture slides, notes). The solution needed to support:
1. Fast local or low-overhead vector storage without complex cloud cluster infrastructure.
2. High context window, factual grounding, and accurate reasoning on academic texts.
3. Reasonable cost and rapid prototyping during early phases.

## Decision
We chose **ChromaDB** (`chromadb` npm client) as our embedded vector store and **Google Gemini 2.5 Flash** (`gemini-2.5-flash`) as our primary generative model for conversational RAG.

## Consequences
### Positive:
- ChromaDB runs alongside the application and supports document-level and user-level metadata filtering.
- Gemini 2.5 Flash delivers sub-second inference speeds, strong reasoning on technical subjects, and native support for large context windows.
### Negative / Trade-offs:
- ChromaDB requires local persistence management and process coordination.
- Requires network egress to Google AI Studio / Gemini API endpoints.

