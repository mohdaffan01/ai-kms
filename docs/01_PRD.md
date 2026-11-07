# Product Requirement Document (PRD)

## 1. Product Overview
**AI-KMS (AI Knowledge Management System)** is an intelligent personal knowledge workspace designed to help learners organize, connect, search, and understand their learning materials. The system transforms static study documents (PDFs, PPTs, Word documents, text files, and markdown notes) into an interactive environment where users can converse with their study materials and manage their knowledge repository.

---

## 2. Problem Statement
Learners and students face significant challenges in managing learning materials:
- **Fragmented Materials**: Notes, slides, and textbooks are scattered across folders, making retrieval difficult.
- **Lack of Interactive Study Tools**: Traditional document viewers only allow passive reading, not interactive Q&A or query-based exploration.
- **Knowledge Silos**: Concepts across different subjects and topics remain isolated without clear conceptual connections.
- **Difficulty Tracking Progress**: Learners lack visibility into which topics they have mastered and where knowledge gaps exist.

---

## 3. Target Users
- **Higher Education Students**: Managing lecture slides, syllabi, assignment briefs, and textbook PDFs across multiple subjects.
- **Researchers & Academicians**: Organizing research papers, notes, and references.
- **Self-Learners & Professionals**: Building personal knowledge bases for skill development and certifications.
- **Educators & Tutors**: Structuring subject modules, topic breakdown, and teaching materials.

---

## 4. Existing Features

### 4.1 User Authentication & Account Management
- **User Registration**: Sign up with Full Name, Email, Password (with uppercase, lowercase, and number validations), and Password Confirmation ([Register.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Register.jsx)).
- **User Login**: Secure authentication issuing JSON Web Tokens (JWT) stored in `localStorage` ([LoginForm.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/auth/LoginForm.jsx)).
- **Session Protection**: Protected route wrapper redirecting unauthenticated users to `/login` ([ProtectedRoute.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/auth/ProtectedRoute.jsx)).
- **User Profile Management**: View profile details, select avatar presets or custom image URLs, and update personal info ([Profile.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Profile.jsx)).
- **Security & Password Management**: Change user password with current password verification and strict length constraints ([changeUserPassword](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/user.Controller.js#L174-L206)).

### 4.2 Document Ingestion & Management
- **Multipart Document Upload**: Upload document files up to 20MB ([uploadMiddleware.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/middleware/uploadMiddleware.js)).
- **Supported File Types**: `.pdf`, `.ppt`, `.pptx`, `.doc`, `.docx`, `.txt`, `.md`.
- **Document Metadata**: Capture title, subject, optional topic, optional folder category, file size, mime type, and original file name ([document.model.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/models/document.model.js)).
- **Document Repository**: Retrieve documents owned by the authenticated user with optional subject/topic/folder filtering ([getMyDocuments](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/document.controller.js#L58-L87)).
- **Document Deletion**: Remove document records from MongoDB and un-link files from server disk storage ([deleteDocument](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/document.controller.js#L90-L139)).

### 4.3 Document Preview & Interactive Interface
- **Document Viewer Modal**: View document details, file metadata (size, upload timestamp, subject, processing status), open PDF preview in-browser iframe, open in new tab, or download file ([DocumentViewerModal.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/DocumentViewerModal.jsx)).
- **Interactive Chat Workspace**: Full conversational UI layout featuring a sidebar document drawer, message stream, welcome empty state, and message input ([Dashboard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Dashboard.jsx)).
- **Mock AI Chat**: Conversational interface with simulated response feedback informing users about upcoming RAG integration ([ChatInput.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/ChatInput.jsx)).

---

## 5. Product Goals

1. **Intelligent Ingestion**: Automatically parse, chunk, and index multi-format learning materials into a vector database.
2. **Semantic Context Retrieval (RAG)**: Deliver precise, context-aware answers derived exclusively from the user's uploaded documents.
3. **Visual Knowledge Graphs**: Render conceptual relationships between subjects, topics, and extracted entities.
4. **Knowledge Gap Identification**: Analyze user interactions and study materials to highlight missed topics and recommend focus areas.

---

## 6. Functional Requirements

### 6.1 Implemented Functional Requirements
| ID | Module | Feature Description | Status | Relevant Files |
|---|---|---|---|---|
| FR-01 | Auth | User registration with input validation | Completed | [user.Controller.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/user.Controller.js), [SignupForm.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/auth/SignupForm.jsx) |
| FR-02 | Auth | JWT-based user authentication & persistent login | Completed | [authMiddleware.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/middleware/authMiddleware.js), [AuthContext.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/context/AuthContext.jsx) |
| FR-03 | User | User profile update & preset avatar selection | Completed | [Profile.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Profile.jsx) |
| FR-04 | User | Password change functionality | Completed | [user.Controller.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/user.Controller.js#L174-L206) |
| FR-05 | Docs | Single document upload with metadata tagging | Completed | [uploadMiddleware.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/middleware/uploadMiddleware.js), [UploadModal.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/UploadModal.jsx) |
| FR-06 | Docs | View user document list sorted by date | Completed | [document.controller.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/document.controller.js#L58-L87), [Sidebar.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/Sidebar.jsx) |
| FR-07 | Docs | Delete document (disk file & database record) | Completed | [document.controller.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/document.controller.js#L90-L139) |
| FR-08 | Docs | PDF & Document preview modal | Completed | [DocumentViewerModal.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/DocumentViewerModal.jsx) |
| FR-09 | UI | Responsive dashboard layout with sidebar & chat area | Completed | [Dashboard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Dashboard.jsx) |
| FR-10 | AI / RAG | Document text extraction (PDF, DOCX, PPTX, MD) & Hierarchical Topic Extraction | Completed | [documentProcessor.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/documentProcessor.js), [topicExtractor.service.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/topicExtractor.service.js) |
| FR-11 | AI / RAG | Vector embedding generation & ChromaDB vector storage | Completed | [embeddingService.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/embeddingService.js), [chromaService.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/chromaService.js) |
| FR-12 | AI / RAG | Semantic search & context-grounded AI QA engine | Completed | [knowledge.controller.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/knowledge.controller.js) |
| FR-16 | Analytics | Comprehensive learning progress dashboard with hierarchical chapters & subtopics | Completed | [DashboardOverview.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/DashboardOverview.jsx), [progress.controller.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/progress.controller.js) |
| FR-17 | Revision | Smart 3D Flashcards & Spaced Revision deck with completed-topics AI generation | Completed | [FlashcardsView.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/FlashcardsView.jsx), [flashcard.controller.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/flashcard.controller.js) |
| FR-18 | Assessment | AI-Powered Quiz Generation, Interactive Player, Timer, and Scoring Analytics | Completed | [QuizView.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/QuizView.jsx), [quiz.controller.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/quiz.controller.js) |
| FR-19 | Auth | Password Reset via Nodemailer HTML Email, 30-min Token, and OTP Fallback | Completed | [ForgotPassword.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/ForgotPassword.jsx), [ResetPassword.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/ResetPassword.jsx), [sendEmail.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/utils/sendEmail.js) |
| FR-20 | Navigation | New Chat default landing, Dual-button sidebar, Mint-Teal action button, and sessionStorage persistence | Completed | [Dashboard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Dashboard.jsx), [Sidebar.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/Sidebar.jsx), [App.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/App.jsx) |

### 6.2 Planned Functional Requirements
| ID | Module | Feature Description | Status | Target Milestone |
|---|---|---|---|---|
| FR-13 | Graph | Concept extraction & Knowledge Graph construction | Not Started | Module 3 / Phase 3 |
| FR-14 | Graph | Interactive Knowledge Graph visualization canvas | Not Started | Module 3 / Phase 3 |
| FR-15 | Gap | Knowledge gap detection & study recommendations | Not Started | Module 4 / Phase 4 |

---

## 7. Non-Functional Requirements

- **Security & Privacy**:
  - Passwords salted and hashed with `bcryptjs` (salt rounds = 10).
  - Standard JWT tokens with 30-day expiration.
  - Strict resource ownership verification on document deletion and listing.
- **File Validation**:
  - Restrict uploads to whitelisted file extensions (`.pdf`, `.ppt`, `.pptx`, `.doc`, `.docx`, `.txt`, `.md`).
  - File size cap enforced at 20MB per document upload.
  - Blank document guard: Documents must contain at least 3 characters of readable text; blank or sub-3 character files are blocked and removed upon upload.
- **Performance & Scalability**:
  - Express static file serving for fast document retrieval.
  - Async MongoDB database queries with index support on `uploadedBy` and `email`.
- **Usability & Design**:
  - Dark mode workspace with visual status indicators (`uploaded`, `processing`, `ready`, `failed`).
  - Mobile-responsive layout featuring a collapsible drawer navigation sidebar.
