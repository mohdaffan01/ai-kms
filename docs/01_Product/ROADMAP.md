# AI-KMS Product Roadmap

## 1. Roadmap Overview
This document outlines the strategic product roadmap and milestone progression for **AI-KMS (AI Knowledge Management System)**. Milestones reflect actual verified capabilities and planned phases without speculative timelines.

```text
+-----------------------------------------------------------------------------------+
| PHASE 1: Core Foundation, Auth & Document Upload (COMPLETED - 100%)               |
+-----------------------------------------------------------------------------------+
                                          │
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 2: Document Vectorization, Grounded RAG, Dashboard & Revision (COMPLETED)   |
+-----------------------------------------------------------------------------------+
                                          │
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 3: Knowledge Graph Construction & Visual Graph Canvas (IN PLANNING)         |
+-----------------------------------------------------------------------------------+
                                          │
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 4: Knowledge Gap Detection & Adaptive Analytics (PLANNED)                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Milestone Breakdown

### Phase 1: Foundation, Authentication & Storage (Status: Completed ✅)
- **User Authentication**: JWT-based registration, login, profile editing, and password change.
- **Password Recovery**: Nodemailer SMTP email password reset with 30-min hashed token and OTP fallback.
- **Document Ingestion**: Multi-format upload (`.pdf`, `.ppt`, `.pptx`, `.doc`, `.docx`, `.txt`, `.md`) up to 20MB.
- **Local Storage Engine**: Disk storage in `Backend/uploads` with sanitized unique filenames and blank document guards.
- **Document Preview & Viewer**: Metadata inspection, PDF iframe preview, download, and file deletion.
- **Workspace Navigation**: Responsive layout with collapsible sidebar, active chat session persistence, and custom routing.

---

### Phase 2: RAG Engine, Learning Dashboard & Study Tools (Status: Completed ✅)
- **Text Processing & Chunking**: Semantic character chunking with clean normalization.
- **Vector Storage**: ChromaDB vector collection management with document-level embedding indexing.
- **Conversational RAG**: Grounded question-answering powered by Google Gemini 2.5 Flash with search scope filtering (All Documents vs. Specific Document).
- **Curriculum & Progress Dashboard**: Real-time study analytics, subject cards, dynamic document-driven subjects, and hierarchical chapter/subtopic extraction.
- **Interactive Checklists**: Optimistic chapter/subtopic toggles with deep Mongoose persistence and activity logging.
- **Cascade Subject Management**: GitHub-style confirmation modal with full cascade deletion of physical files, vector embeddings, flashcards, and quizzes.
- **Smart 3D Flashcards**: Flip cards with keyboard shortcuts, AI deck generation from completed topics, and spaced mastery tracking.
- **Interactive Quizzes**: Timed 4-option MCQs generated from notes, scoring analytics, and attempt history.

---

### Phase 3: Knowledge Graph Construction & Visual Canvas (Status: In Planning 🔄)
- **Concept & Relationship Extraction**:
  - LLM-assisted extraction of key concepts, entities, and cross-document relationships.
  - Identification of prerequisite concepts across curriculum subjects.
- **Graph Storage Architecture**:
  - Node and edge schema definition in MongoDB or specialized graph storage.
- **Interactive Visual Canvas**:
  - 2D/3D force-directed node graph visualizer (e.g. Force-Graph, React Flow, Cytoscape).
  - Node expansion, filtering by subject/topic, and click-to-explore concept summaries.
- **Concept-to-Document Linking**:
  - Direct navigation from a graph node to the underlying source document excerpt.

---

### Phase 4: Knowledge Gap Detection & Adaptive Learning (Status: Planned 📋)
- **Weakness & Knowledge Gap Detection**:
  - Analysis of quiz attempt errors and topic checklist completion ratios.
  - Identification of skipped chapters and misunderstood core principles.
- **Automated Study Recommendations**:
  - Contextual study guides and suggested reading materials based on detected gaps.
  - Targeted quiz and flashcard deck recommendations to reinforce weak areas.
- **Collaborative Study Spaces**:
  - Optional peer sharing of subject curriculums and public deck templates.

