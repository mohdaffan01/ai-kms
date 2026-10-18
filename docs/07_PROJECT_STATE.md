# Project State Snapshot (PROJECT_STATE)

## 1. Executive Summary

- **Project Name**: AI-KMS (AI Knowledge Management System)
- **Current Version**: 1.0.0 (Foundation Prototype)
- **Overall Status**: Phase 1 (Core Infrastructure) & Phase 2 (Document Vectorization & RAG Engine) Fully Complete & Operational. Ready for Phase 3 (Knowledge Graph Canvas & Visualization).
- **Primary Goal**: Transform uploaded multi-format learning materials into a context-grounded AI chat workspace with visual Knowledge Graphs and Knowledge Gap detection.

---

## 2. Current Development Phase
- **Active Phase**: Transitioning from **Phase 2 (Text Parsing, Vector Embeddings & RAG Search Engine)** to **Phase 3 (Knowledge Graph Canvas & Visualization)**.
- **Phase Completion**:
  - Phase 1: Core System & Data Layer — **100% Completed**
  - Phase 2: Document Vectorization & RAG Engine — **100% Completed**
  - Phase 3: Knowledge Graph Canvas — **0% Started**
  - Phase 4: Gap Detection & Analytics — **0% Started**

---

## 3. Detailed Feature Status Checklist

### 3.1 Authentication & User Management
- [x] User registration API with validation (`POST /api/auth/register`) (Name regex: alphabets & spaces only; strict password strength regex)
- [x] Password hashing using Bcrypt (`salt rounds = 10`)
- [x] User login API issuing JWT (`POST /api/auth/login`)
- [x] Persistent session handling using JWT stored in `localStorage`
- [x] JWT verification middleware (`protect`)
- [x] User profile view & preset avatar picker ([Profile.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Profile.jsx))
- [x] Profile update endpoint (`PUT /api/users/profile`)
- [x] Password change endpoint with current password check (`PUT /api/users/change-password`)

### 3.2 Document Management & Storage
- [x] Multipart file upload middleware using Multer (`diskStorage` to `Backend/uploads/`)
- [x] File extension validation whitelist (`.pdf`, `.ppt`, `.pptx`, `.doc`, `.docx`, `.txt`, `.md`)
- [x] Upload size cap enforcement (20MB limit)
- [x] Mongoose Document schema with metadata (Title, Subject, Topic, Folder, ContentType, Status)
- [x] Fetch user documents API with subject/topic/folder filtering (`GET /api/documents/my-documents`)
- [x] Document deletion endpoint with disk file cleanup and DB deletion (`DELETE /api/documents/:id`)
- [x] Interactive upload modal with drag-and-drop file dropzone ([UploadModal.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/UploadModal.jsx))
- [x] Document viewer modal with PDF iframe preview, download link, and metadata list ([DocumentViewerModal.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/DocumentViewerModal.jsx))

### 3.3 UI / UX & Navigation Workspace
- [x] Modern dark-mode aesthetic with custom CSS styling ([index.css](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/styles/index.css))
- [x] Fixed navigation bar with brand logo, nav links, user badge, and logout ([Navbar.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/common/Navbar.jsx))
- [x] Responsive sidebar with document drawer, count badge, view/delete action buttons, and mobile menu toggle ([Sidebar.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/Sidebar.jsx))
- [x] Chat interface layout with welcome empty state, auto-scrolling feed, and textarea input ([ChatWindow.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/ChatWindow.jsx))
- [x] AI Chat Interaction (Fully connected to RAG backend `/api/knowledge/chat` to answer questions directly from uploaded PDFs)
- [x] Manual Voice / Text-to-Speech Control (On-demand `Listen` / `Stop` button on AI response bubbles; auto-speak disabled)

### 3.4 Advanced AI & Analytics Capabilities
- [x] PDF text extraction dependency installed (`pdf-parse`)
- [x] Backend service structure created ([`documentProcessor.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/documentProcessor.js), [`textCleaner.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/textCleaner.js), [`textChunker.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/textChunker.js), [`embeddingService.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/embeddingService.js), [`chromaService.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/chromaService.js))
- [x] Document processing API endpoint (`POST /api/knowledge/process/:documentId`) ([knowledge.controller.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/knowledge.controller.js))
- [x] ChromaDB vector database store setup & collection indexing integration (`chromadb` npm package)
- [x] RAG-based semantic search endpoint (`POST /api/knowledge/search`)
- [x] Gemini 2.5 Flash LLM Integration (`gemini-2.5-flash` API endpoint for grounded Q&A and summary generation)
- [x] Vector deletion endpoint (`DELETE /api/knowledge/:documentId`)
- [x] Hierarchical Topic Extractor Engine ([`topicExtractor.service.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/topicExtractor.service.js)): Parses uploaded PDFs/notes into Parent Chapters and nested Child Subtopics automatically.
- [ ] Concept & relationship extraction for Knowledge Graphs
- [ ] Interactive Knowledge Graph visualization canvas
- [ ] Quiz generation & Knowledge Gap detection engine

### 3.5 Learning Dashboard & Curriculum Progress Tracking
- [x] Mongoose Progress Model with hierarchical topics and subtopics ([`progress.model.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/models/progress.model.js))
- [x] Real-time Dashboard data API with document synchronization ([`progress.controller.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/progress.controller.js))
- [x] Overview KPI Cards (Total Subjects, Total Topics, Completed Topics, Overall Progress %, Uploaded Documents) ([`OverviewStats.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/OverviewStats.jsx))
- [x] Subject Cards Grid with Document Count Badge and Progress Bar ([`SubjectCard.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/SubjectCard.jsx))
- [x] Hierarchical Accordion Subject Detail Modal ([`SubjectDetailModal.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/SubjectDetailModal.jsx)) with Parent Chapters, nested Child Subtopics, connecting line guide, and topic builders
- [x] Real-time optimistic Checkbox updates & backend persistence for both chapters and subtopics (`POST /api/progress/topic/toggle`)
- [x] Dynamic Subject Creation Modal ([`CreateSubjectModal.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/CreateSubjectModal.jsx)) with color palette presets
- [x] Visual Learning Progress Distribution bar & Recent Activity stream ([`LearningProgressSection.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/LearningProgressSection.jsx), [`RecentActivitySection.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/RecentActivitySection.jsx))

---

## 4. Current Component & Subsystem Status

### 4.1 Frontend Status
- **Framework**: React 19 + Vite 8 + React Router DOM 7
- **Health**: Fully operational. Compiles cleanly without errors.
- **Pages Built**:
  - `/login`: Public auth login page ([Login.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Login.jsx))
  - `/signup`: Public auth registration page ([Signup.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Signup.jsx))
  - `/register`: Standalone registration page with validation ([Register.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Register.jsx))
  - `/dashboard`: Protected main workspace ([Dashboard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Dashboard.jsx)) toggling between AI Chat Workspace and Learning Dashboard
  - `/profile`: Protected profile & security management ([Profile.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Profile.jsx))

### 4.2 Backend Status
- **Framework**: Node.js + Express 5
- **Health**: Fully operational. Server runs on port 3000 (`npm run dev`).
- **Middlewares Operational**: CORS, express.json(), static file serving (`/uploads`), auth middleware (`protect`), upload middleware (`uploadDocumentMiddleware`), error handling middleware (`notFound`, `errorHandler`).

### 4.3 Database Status
- **Engine**: MongoDB with Mongoose 9 (Metadata & Progress) + ChromaDB (Vector Store)
- **Health**: Operational. Connects via `connectDB()` in `Backend/src/config/db.js` and `chromaService.js`.
- **Collections Established**:
  - `users`: User profiles, credentials, role, timestamps.
  - `documents`: Document records, file metadata, ownership relation to `users`, processing status.
  - `progress`: User learning progress, subjects, hierarchical chapters and child subtopics, recent activity stream.
  - `knowledge_chunks`: ChromaDB collection storing text chunks & vector embeddings with metadata payload (`userId`, `documentId`, `chunkIndex`).

### 4.4 API Status
- **Total Operational Endpoints**: 19 active endpoints.
  1. `GET /`: Healthcheck response
  2. `POST /api/auth/register`: Public registration (with name alphabet validation, password strength check)
  3. `POST /api/auth/login`: Public login
  4. `GET /api/auth/me`: Authenticated profile fetch
  5. `PUT /api/users/profile`: Update name & avatar
  6. `PUT /api/users/change-password`: Change password
  7. `POST /api/documents/upload`: Multipart document file upload & automatic topic extraction
  8. `GET /api/documents/my-documents`: List user documents with filters
  9. `DELETE /api/documents/:id`: Delete document file and DB record
  10. `POST /api/knowledge/process/:documentId`: Extract, clean, chunk, embed & index document into ChromaDB
  11. `POST /api/knowledge/search`: User-isolated semantic RAG search across indexed documents in ChromaDB
  12. `POST /api/knowledge/chat`: Grounded RAG Chat endpoint answering user questions directly from uploaded PDFs
  13. `DELETE /api/knowledge/:documentId`: Delete document vector embeddings from ChromaDB
  14. `GET /api/progress/dashboard`: Fetch full learning dashboard state, synced subjects, and stats
  15. `POST /api/progress/topic/toggle`: Toggle chapter or individual subtopic completion state
  16. `POST /api/progress/topic/add`: Add custom parent chapter or child subtopic
  17. `POST /api/progress/subject/create`: Create new academic subject
  18. `DELETE /api/progress/subject/:subjectId`: Delete custom subject
  19. `POST /api/progress/reset-defaults`: Reset default computer science curriculum subjects

---

## 5. Known Issues & Technical Debt

1. **Hardcoded API URLs**: Frontend files hardcode `http://localhost:3000/api` in `authApi.js` and `http://localhost:3000` in `DocumentViewerModal.jsx`. Should be migrated to environment variables (`import.meta.env.VITE_API_BASE_URL`).
2. **Hardcoded Default Profile Avatar**: Default profile picture uses an external Unsplash URL (`https://images.unsplash.com/photo-1534528741775-53994a69daeb...`).

---

## 6. Current Next Steps

1. **Phase 3 - Concept Extraction Engine**: Implement NLP / LLM extraction of concept triplets `(Subject, Relation, Object)` from document chunks.
2. **Phase 3 - Knowledge Graph Canvas**: Render concept nodes and interactive relationships graph on frontend.
