# Architecture Decision Records (ADRs)

## 1. Purpose of ADRs
Architecture Decision Records capture important architectural, infrastructural, and design decisions made throughout the evolution of **AI-KMS**. They provide context, rationale, and consequences so future contributors understand why specific technologies or patterns were adopted.

---

## 2. ADR Format Standard
Each record is authored in Markdown with the following structure:
- **Title**: `ADR-XXX: Short Descriptive Title`
- **Status**: `[ Proposed | Accepted | Deprecated | Superseded ]`
- **Date**: Date of decision adoption
- **Context**: Problem statement and forces influencing the decision
- **Decision**: The architectural or technical choice made
- **Consequences**: Benefits, trade-offs, and resulting constraints

---

## 3. ADR Index

| ADR ID | Title | Status | Date |
|---|---|---|---|
| [`001`](./001-chromadb-and-gemini-rag.md) | Selection of ChromaDB & Google Gemini 2.5 Flash for RAG Engine | Accepted | 2026-10-13 |
| [`002`](./002-local-filesystem-storage.md) | Local Filesystem Storage for Uploaded Study Materials | Accepted | 2026-10-13 |
| [`003`](./003-hierarchical-curriculum-progress.md) | Dynamic Document-Driven Curriculum & Hierarchical Topic Extraction | Accepted | 2026-10-19 |
| [`004`](./004-cascade-subject-deletion.md) | Full Cascade Wipe on Subject Deletion | Accepted | 2026-11-10 |

