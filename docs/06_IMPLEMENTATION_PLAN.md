# Implementation Plan (IMPLEMENTATION_PLAN)

## 1. Project Completion Overview

The **AI-KMS** repository has successfully completed:
- **Phase 1**: Foundational Architecture (Auth, File Ingestion, Workspace Layout) — **100% Completed**
- **Phase 2**: Document Processing, Vector Embeddings, ChromaDB Indexing & Grounded RAG AI Chat (`gemini-2.5-flash`) — **100% Completed**
- **Curriculum & Learning Dashboard**: Real-time stats, Subject cards, Hierarchical Topic Extractor engine, Accordion study progress checklist — **100% Completed**

The project is currently positioned at the transition point to **Phase 3: Knowledge Graph Construction & Visual Graph Canvas**.

---

## 2. Status Breakdown of Project Features

### 2.1 Completed Features (100%)
- **Authentication & User Management**:
  - Express JWT authentication backend with `bcryptjs` password hashing ([user.Controller.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/user.Controller.js)).
  - Frontend `AuthContext` provider with persistent token handling ([AuthContext.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/context/AuthContext.jsx)).
  - Registration, Login, Profile Edit, and Password Change views & API endpoints.
  - Password Reset via Nodemailer HTML Email (`sendEmail.js`), 30-min hashed token validation, and OTP verification fallback ([ForgotPassword.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/ForgotPassword.jsx), [ResetPassword.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/ResetPassword.jsx)).
- **Document Ingestion & File Storage**:
  - Multer middleware configuration supporting PDF, PPT, DOC, TXT, and MD uploads up to 20MB ([uploadMiddleware.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/middleware/uploadMiddleware.js)).
  - Server disk storage (`Backend/uploads`) and Mongoose database model ([document.model.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/models/document.model.js)).
  - Document retrieval API with subject/topic/folder query filtering ([getMyDocuments](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/document.controller.js#L58-L87)).
  - Document deletion endpoint cleaning up both disk storage files and database records ([deleteDocument](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/document.controller.js#L90-L139)).
- **Document Vectorization & RAG Engine**:
  - `pdf-parse` text extraction pipeline with semantic chunking & cleaning.
  - ChromaDB vector store integration with embedding indexing.
  - `/api/knowledge/chat` endpoint powered by Gemini 2.5 Flash for context-grounded Q&A with Search Scope bar (All Documents vs Specific Document).
- **Learning Dashboard & Hierarchical Topic Tracking**:
  - MongoDB `Progress` model storing subjects, parent topics, and nested subtopics.
  - `topicExtractor.service.js` automatically parses uploaded notes into parent chapters and child subtopics.
  - Comprehensive Dashboard with KPI cards, Subject cards, Hierarchical Accordion modal, inline subject renaming, and GitHub-style safe deletion modal.
- **Smart Flashcards & Spaced Revision Module**:
  - AI Flashcard generator creating curriculum-aligned cards from completed topics.
  - 3D perspective flip card deck with keyboard shortcuts, all-cards deck search, and manual card creator.
- **AI Assessment & Interactive Quiz Module**:
  - Mongoose `quizzes` schema with 4-option MCQs, timer, instant feedback, scoring percentage, and attempt analytics.
- **Workspace Navigation & Session Persistence**:
  - Root `/` automatically lands authenticated users directly on New Chat (`/dashboard`, default tab `'chat'`).
  - Dual-button sidebar architecture: `+ New Chat` (Mint-Teal action button `#2dd4bf`) and `Chat` navigation button.
  - `sessionStorage` (`aikms_active_chat_messages`) preserves ongoing conversation during tab switches and page refreshes.

### 2.2 Features in Planning & Next Phases
- **Knowledge Graph Construction & Visualization**: Extracting key concepts/entities and rendering an interactive visual graph (Phase 3).
- **Knowledge Gap Detection & Recommendations**: Analyzing user query patterns and quiz performance to detect knowledge gaps (Phase 4).

---

## 3. Logical Implementation Phases Roadmap

```
+-----------------------------------------------------------------------------------+
| PHASE 1: Core Foundation, Auth & Document Upload (COMPLETED - 100%)               |
+-----------------------------------------------------------------------------------+
                                          │
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 2: Document Processing, ChromaDB & Grounded RAG Chat (COMPLETED - 100%)     |
+-----------------------------------------------------------------------------------+
                                          │
                                          v
+-----------------------------------------------------------------------------------+
| LEARNING DASHBOARD & HIERARCHICAL TOPIC TRACKER (COMPLETED - 100%)                |
+-----------------------------------------------------------------------------------+
                                          │
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 3: Knowledge Graph Construction & Visual Graph Canvas (NEXT STEP)           |
+-----------------------------------------------------------------------------------+
                                          │
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 4: Knowledge Gap Detection & Adaptive Quizzing                              |
+-----------------------------------------------------------------------------------+
```

---

### Phase 2: Document Processing, Vector Indexing & RAG Engine (Immediate Focus)

**Goal**: Transform uploaded static files into searchable vector embeddings and connect the frontend chat interface to a real RAG-powered AI answer engine.

#### Step 2.1: Text Extraction Middleware & Utilities
- Install document parsing packages in `Backend`:
  - `pdf-parse` for PDF text extraction.
  - `mammoth` or `docx-parser` for DOCX text extraction.
  - `officeparser` for PPTX / PPT files.
- Implement `extractTextFromDocument(filePath, mimeType)` utility in `Backend/src/utils/textExtractor.js`.
- Trigger text extraction immediately following document creation in `uploadDocument`.

#### Step 2.2: Text Chunking Strategy & Vector Storage Setup
- Implement a recursive character text splitter (chunk size: 500-1000 tokens with 100 token overlap).
- Select and configure a Vector Database (e.g., ChromaDB, Qdrant, Pinecone, or MongoDB Vector Search).
- Store embeddings alongside document metadata (`documentId`, `userId`, `subject`, `topic`).
- Update `processingStatus` in `Document` model from `'uploaded'` -> `'processing'` -> `'ready'` (or `'failed'`).

#### Step 2.3: RAG Retrieval & AI Chat API Endpoint
- Create new Express route: `POST /api/chat/query` (Protected).
- Receive user message query string from frontend.
- Generate query embedding and perform vector cosine similarity search to retrieve top $K$ relevant document chunks.
- Construct grounded prompt containing system instructions, retrieved context chunks, and user query.
- Call LLM API (e.g., Gemini API / OpenAI API) to produce answer.
- Replace dummy timeout response in `Frontend/src/pages/Dashboard.jsx` with real HTTP POST request to `/api/chat/query`.

---

### Phase 3: Knowledge Graph Construction & Interactive Interface

**Goal**: Extract key concepts and relationships from user documents to generate a visual Knowledge Graph.

#### Step 3.1: Entity & Relationship Extraction Engine
- Process document text chunks using LLM prompt engineering or NLP libraries to extract `(Subject Entity, Relationship, Object Entity)` triplets.
- Store nodes and edges in a graph database or MongoDB collection (`knowledge_graphs`).

#### Step 3.2: Frontend Graph Visualization Canvas
- Install frontend graph visualization library (e.g., `react-flow-renderer`, `vis-network`, or `d3`).
- Create `KnowledgeGraphView.jsx` component.
- Allow users to visually explore concept nodes, click nodes to view linked document snippets, and filter graph by subject/folder.

---

### Phase 4: Knowledge Gap Detection & Analytics Dashboard

**Goal**: Build progress tracking tools and turn the placeholder Dashboard view into a functional learning analytics hub.

#### Step 4.1: Quiz & Assessment Generator
- Generate practice questions based on uploaded documents.
- Track user quiz scores and response accuracy per subject/topic.

#### Step 4.2: Gap Detection Algorithm
- Compare topics covered in uploaded documents against user quiz performance and query frequency.
- Identify weak topics (low score / frequent basic questions) and flag them as "Knowledge Gaps".

#### Step 4.3: Analytics Dashboard Implementation
- Replace placeholder header in `Frontend/src/pages/Dashboard.jsx` with a comprehensive learning dashboard:
  - Total documents uploaded metric card.
  - Subject breakdown pie chart.
  - Knowledge gap recommendation cards.
  - Learning activity timeline chart.

---

## 4. Environment & Technical Refactoring Tasks

Before commencing Phase 2 feature development, the following minor environment improvements should be addressed:
1. **Environment Variables for Frontend**: Move hardcoded backend base URLs (`http://localhost:3000`) in `authApi.js` and `DocumentViewerModal.jsx` to Vite environment variables (`import.meta.env.VITE_API_BASE_URL`).
2. **CORS Configuration**: Restrict CORS origin in `Backend/src/index.js` explicitly to `process.env.CLIENT_URL || 'http://localhost:5173'`.
