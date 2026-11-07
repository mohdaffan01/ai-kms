# Project State Snapshot (PROJECT_STATE)

## 1. Executive Summary

- **Project Name**: AI-KMS (AI Knowledge Management System)
- **Current Version**: 1.1.0 (Interactive AI Study Workspace & Curriculum Hub)
- **Overall Status**: Phase 1 (Core Infrastructure), Phase 2 (Document Vectorization & RAG Engine), Curriculum Dashboard, Smart Flashcards, AI Quizzes, and Chat Session Architecture are **100% Fully Complete & Operational**. Ready for Phase 3 (Knowledge Graph Canvas & Visualization).
- **Primary Goal**: Transform uploaded multi-format learning materials into a context-grounded AI chat workspace with visual Knowledge Graphs, spaced revision flashcards, adaptive quizzes, and curriculum progress tracking.

---

## 2. Current Development Phase
- **Active Phase**: Transitioning to **Phase 3 (Knowledge Graph Canvas & Entity Visualization)**.
- **Phase Completion**:
  - Phase 1: Core System & Data Layer — **100% Completed**
  - Phase 2: Document Vectorization & Grounded RAG AI Engine — **100% Completed**
  - Curriculum Dashboard & Hierarchical Topic Tracking — **100% Completed**
  - Smart Flashcards & Spaced Revision Module — **100% Completed**
  - AI Assessment & Interactive Quiz Module — **100% Completed**
  - Workspace Routing, Dual-Button Chat Navigation & Session Persistence — **100% Completed**
  - Phase 3: Knowledge Graph Canvas — **Ready to Start**
  - Phase 4: Knowledge Gap Detection & Analytics — **In Pipeline**

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
- [x] **Forgot Password Email Flow**: (`POST /api/auth/forgot-password`) sends rich HTML email with secure 30-minute password reset link using Nodemailer & Gmail SMTP credentials ([`sendEmail.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/utils/sendEmail.js))
- [x] **Token-Based Password Reset**: (`POST /api/auth/reset-password/:token`) validates hashed reset token, checks expiration, and updates password ([`user.Controller.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/user.Controller.js))
- [x] **OTP-Based Password Reset**: (`POST /api/auth/reset-password-otp`) alternative OTP code verification for password recovery
- [x] Public Forgot Password & Reset Password frontend pages ([ForgotPassword.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/ForgotPassword.jsx), [ResetPassword.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/ResetPassword.jsx))

### 3.2 Document Management & Storage
- [x] Multipart file upload middleware using Multer (`diskStorage` to `Backend/uploads/`)
- [x] File extension validation whitelist (`.pdf`, `.ppt`, `.pptx`, `.doc`, `.docx`, `.txt`, `.md`)
- [x] Upload size cap enforcement (20MB limit)
- [x] **Blank Document & Content Guard**: Validates readable text length on upload; if a PDF contains less than 3 characters of readable text, the upload is rejected immediately (`400 Bad Request`) and the uploaded temporary file is unlinked from disk to prevent storage clutter ([document.controller.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/document.controller.js))
- [x] Mongoose Document schema with metadata (Title, Subject, Topic, Folder, ContentType, Status)
- [x] Fetch user documents API with subject/topic/folder filtering (`GET /api/documents/my-documents`)
- [x] Document deletion endpoint with disk file cleanup and DB deletion (`DELETE /api/documents/:id`)
- [x] Interactive upload modal with drag-and-drop file dropzone ([UploadModal.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/UploadModal.jsx))
- [x] Document viewer modal with PDF iframe preview, download link, and metadata list ([DocumentViewerModal.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/DocumentViewerModal.jsx))

### 3.3 UI / UX & Workspace Navigation Architecture
- [x] **Zero-Flash Branded Splash Screen & Preloader**: Eliminated white blank page flash completely with native inline preloader in `index.html` (immediate dark background `#171717`) and `AppSplashScreen` component featuring an animated glowing Brain logo, AiKMS typography, and glowing progress bar on every app startup/reload ([index.html](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/index.html), [AppSplashScreen.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/common/AppSplashScreen.jsx), [App.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/App.jsx))
- [x] **Default Landing on New Chat**: Platform entry (`/`) directly evaluates authentication state — authenticated users land straight on `/dashboard` with active tab defaulting to `'chat'` (New Chat screen) rather than Dashboard Overview ([App.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/App.jsx), [Dashboard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Dashboard.jsx))
- [x] **Dual Chat Navigation Architecture**:
  - **`+ New Chat` Button**: Action button styled in distinctive Mint-Teal (`#2dd4bf`) that resets active conversation (`messages = []`) and clears session storage for a brand new conversation ([Sidebar.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/Sidebar.jsx))
  - **`Chat` Navigation Button**: Standard sidebar navigation item (`MessageSquare` icon) that switches view to active chat **without clearing ongoing messages** ([Sidebar.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/Sidebar.jsx))
- [x] **Chat Session Persistence**: Ongoing chat messages are automatically synchronized and persisted in `sessionStorage` (`aikms_active_chat_messages`), preventing accidental chat loss when navigating to Dashboard Overview, Quiz, or Flashcards, or when refreshing the page ([Dashboard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Dashboard.jsx))
- [x] **Chat Scope Selector Bar**: Real-time dropdown above chat feed allowing learners to query across "All Documents" (auto search) or restrict retrieval context to a specific selected document ([Dashboard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Dashboard.jsx))
- [x] **Resizable Sidebar Drawer**: Draggable sidebar with custom resize handle and persistent width stored in `localStorage` ([Sidebar.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/Sidebar.jsx))
- [x] **Collapsible Documents Section**: Accordion document list with expand/collapse toggle and state saved in `localStorage` ([Sidebar.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/Sidebar.jsx))
- [x] User Profile Flyout with Password Change shortcut, Dashboard Overview link, and Logout ([UserProfileFlyout.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/UserProfileFlyout.jsx))
- [x] Manual Voice / Text-to-Speech Control (`Listen` / `Stop` button on AI response bubbles with SpeechSynthesis cleanup) ([ChatWindow.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/ChatWindow.jsx))
- [x] **Minimalist 404 & Backend Connection Error Screen**: Clean, editorial dark-themed error view ([NotFound.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/NotFound.jsx), [not-found.css](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/styles/not-found.css)) featuring giant faint background watermark (`404` / `503`), architectural background guide lines, centered typography ("Page Not Found" / "Backend Disconnected"), and pill-shaped action buttons (`Go to Dashboard →`, `Retry Connection →`, `Go Home`) with live connection ping recovery.

### 3.4 Advanced AI & RAG Engine
- [x] PDF text extraction dependency installed (`pdf-parse`)
- [x] Backend service structure created ([`documentProcessor.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/documentProcessor.js), [`textCleaner.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/textCleaner.js), [`textChunker.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/textChunker.js), [`embeddingService.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/embeddingService.js), [`chromaService.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/chromaService.js))
- [x] Document processing API endpoint (`POST /api/knowledge/process/:documentId`) ([knowledge.controller.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/knowledge.controller.js))
- [x] ChromaDB vector database store setup & collection indexing integration (`chromadb` npm package)
- [x] RAG-based semantic search endpoint (`POST /api/knowledge/search`)
- [x] Gemini 2.5 Flash LLM Integration (`gemini-2.5-flash` API endpoint for grounded Q&A and summary generation)
- [x] Universal AI-Powered Hierarchical Topic Extractor Engine ([`topicExtractor.service.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/services/topicExtractor.service.js)): Dynamically analyzes ANY uploaded study material using Gemini 2.5 Flash to automatically discover authentic chapters/units and conceptual subtopics, while globally eliminating MCQs, exam questions, and fragments through linguistic sanitization.
- [ ] Concept & relationship extraction for Knowledge Graphs (Phase 3)
- [ ] Interactive Knowledge Graph visualization canvas (Phase 3)

### 3.5 Learning Dashboard & Curriculum Progress Tracking
- [x] **Shimmer Skeleton Loading State**: High-fidelity animated Shimmer Skeleton UI ([`DashboardSkeleton.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/DashboardSkeleton.jsx)) mirroring Overview KPI stats, My Vaults cards, and Learning Progress charts with animated light-sweep shimmer waves, completely eliminating spinners and blank page delays.
- [x] Mongoose Progress Model with hierarchical topics and subtopics ([`progress.model.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/models/progress.model.js))
- [x] Real-time Dashboard data API with fast-path MongoDB caching (Sub-100ms page load; avoids redundant LLM re-extraction on page visits) ([`progress.controller.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/progress.controller.js))
- [x] Pure Document-Driven & Dynamic Subjects: Empty demo/placeholder CS subjects purged; workspace starts cleanly and automatically generates subjects from uploaded study materials or user creation.
- [x] Overview KPI Cards (Total Subjects, Total Topics, Completed Topics, Overall Progress %, Uploaded Documents) ([`OverviewStats.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/OverviewStats.jsx))
- [x] Subject Cards Grid with Document Count Badge and Progress Bar ([`SubjectCard.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/SubjectCard.jsx))
- [x] Hierarchical Accordion Subject Detail Modal ([`SubjectDetailModal.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/SubjectDetailModal.jsx)) with Parent Chapters, nested Child Subtopics, connecting line guide, and topic builders
- [x] Inline Subject Renaming ([`SubjectDetailModal.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/SubjectDetailModal.jsx)): Instant inline title editing with Pencil button, Enter/Save controls, and automatic synchronization across all associated documents and dashboard cards (`PUT /api/progress/subject/:subjectId`).
- [x] GitHub-Style Subject Deletion Modal ([`SubjectDetailModal.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/SubjectDetailModal.jsx)): High-safety confirmation dialog requiring the user to type the exact subject name before the destructive delete button activates; unlinks documents to prevent auto-recreation (`DELETE /api/progress/subject/:subjectId`).
- [x] Real-time optimistic Checkbox updates & backend persistence for both chapters and subtopics (`POST /api/progress/topic/toggle`)
- [x] Dynamic Subject Creation Modal ([`CreateSubjectModal.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/CreateSubjectModal.jsx)) with color palette presets
- [x] Visual Learning Progress Distribution bar & Recent Activity stream ([`LearningProgressSection.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/LearningProgressSection.jsx), [`RecentActivitySection.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/RecentActivitySection.jsx))

### 3.6 Smart Flashcards & Spaced Revision Module
- [x] Mongoose Flashcard Schema with compound indexes, mastery flags, and difficulty ratings ([`flashcard.model.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/models/flashcard.model.js))
- [x] AI-Powered Flashcard Generator ([`flashcard.controller.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/flashcard.controller.js)): Intelligently inspects user's `Progress` model for completed topics in a subject, extracts relevant sections from uploaded PDFs, and prompts Gemini LLM (with heuristic definition extractor fallback) to generate curriculum-aligned revision cards.
- [x] Interactive 3D Flip Card Study Deck ([`FlashcardsView.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/FlashcardsView.jsx)) with CSS 3D perspective transforms, progress bar, and completion summary screen.
- [x] Full Keyboard Shortcut Navigation (`Space` to flip, `ArrowLeft`/`ArrowRight` to navigate, `1` for practice, `2` for mastered).
- [x] All Cards Deck Grid Mode with real-time text search, difficulty pills, and direct delete actions (no alert popups).
- [x] Manual Card Creator Modal for adding custom study prompts and definitions.
- [x] Subject Detail Modal Flashcards CTA ([`SubjectDetailModal.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/SubjectDetailModal.jsx)): Direct bridge from subject overview into targeted flashcards revision.

### 3.7 AI Assessment & Interactive Quiz Module
- [x] Mongoose Quiz Schema ([`quiz.model.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/models/quiz.model.js)): Questions with 4 options, 0-based correctAnswer, explanations, difficulty, topic tags, attempt records, bestScore, and bestPercentage.
- [x] AI Quiz Generator ([`quiz.controller.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/controllers/quiz.controller.js)): Generates rigorous 4-option MCQs from user's completed topics in `Progress` and uploaded document notes via Gemini LLM with heuristic fallback.
- [x] Interactive Quiz Player ([`QuizView.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/QuizView.jsx)): Live timer, question counter, progress bar, instant option selection, green correct / red wrong feedback, and detailed conceptual explanation drawer.
- [x] Scoring & Attempt Analytics: Calculates percentage score, updates best score, logs activity in user's learning history (`POST /api/quizzes/:id/submit`).
- [x] Quiz Hub: Overview stats (total quizzes, attempted, avg score %, total attempts), subject filters, text search, start/retake actions, and direct deletion without popups.
- [x] Sidebar & Modal Integration: Activated Quiz square button in [`Sidebar.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/Sidebar.jsx) and added "Take AI Quiz" CTA button in [`SubjectDetailModal.jsx`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/SubjectDetailModal.jsx).

---

## 4. Current Component & Subsystem Status

### 4.1 Frontend Status
- **Framework**: React 19 + Vite 8 + React Router DOM 7
- **Health**: Fully operational. Compiles cleanly without errors (`npm run build`).
- **Pages Built**:
  - `/login`: Public auth login page ([Login.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Login.jsx))
  - `/signup`: Public auth registration page ([Signup.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Signup.jsx))
  - `/register`: Standalone registration page with validation ([Register.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Register.jsx))
  - `/forgot-password`: Password reset request page ([ForgotPassword.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/ForgotPassword.jsx))
  - `/reset-password/:token`: Secure password reset execution page ([ResetPassword.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/ResetPassword.jsx))
  - `/dashboard`: Protected main workspace ([Dashboard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Dashboard.jsx)) toggling between New Chat (default), Dashboard Overview, Smart Flashcards, and AI Quizzes
  - `/profile`: Protected profile & security management ([Profile.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Profile.jsx))
  - `/404`: Dedicated Not Found error page for broken or non-existent URLs ([NotFound.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/NotFound.jsx))
  - `/server-offline`: Dedicated 503 Backend Connection Failure screen with live ping tester ([NotFound.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/NotFound.jsx))

### 4.2 Backend Status
- **Framework**: Node.js + Express 5
- **Health**: Fully operational. Server runs on port 3000 (`npm run dev`).
- **Email Service**: Nodemailer 10.2 configured with Gmail SMTP ([sendEmail.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/utils/sendEmail.js)).
- **Middlewares Operational**: CORS, express.json(), static file serving (`/uploads`), auth middleware (`protect`), upload middleware (`uploadDocumentMiddleware`), error handling middleware (`notFound`, `errorHandler`).

### 4.3 Database Status
- **Engine**: MongoDB with Mongoose 9 (Metadata, Curriculum & Assessments) + ChromaDB (Vector Store)
- **Health**: Operational. Connects via `connectDB()` in `Backend/src/config/db.js` and `chromaService.js`.
- **Collections Established**:
  - `users`: User profiles, credentials, resetPasswordToken, resetPasswordExpire, role, timestamps.
  - `documents`: Document records, file metadata, ownership relation to `users`, processing status.
  - `progress`: User learning progress, subjects, hierarchical chapters and child subtopics, recent activity stream.
  - `flashcards`: Study flashcards with questions, answers, hints, mastery tracking, and source linkage.
  - `quizzes`: Practice quizzes with MCQ questions, explanations, difficulty ratings, attempt logs, and best score.
  - `knowledge_chunks`: ChromaDB collection storing text chunks & vector embeddings with metadata payload (`userId`, `documentId`, `chunkIndex`).

### 4.4 API Status
- **Total Operational Endpoints**: 34 active endpoints.
  1. `GET /`: Healthcheck response
  2. `POST /api/auth/register`: Public registration (with alphabet name validation, password strength check)
  3. `POST /api/auth/login`: Public login
  4. `GET /api/auth/me`: Authenticated profile fetch
  5. `POST /api/auth/forgot-password`: Request password reset email with token link via Nodemailer
  6. `POST /api/auth/reset-password/:token`: Reset password using URL token
  7. `POST /api/auth/reset-password-otp`: Reset password using email OTP verification
  8. `PUT /api/users/profile`: Update name & avatar
  9. `PUT /api/users/change-password`: Change password
  10. `POST /api/documents/upload`: Multipart document file upload & automatic topic extraction
  11. `GET /api/documents/my-documents`: List user documents with filters
  12. `DELETE /api/documents/:id`: Delete document file and DB record
  13. `POST /api/knowledge/process/:documentId`: Extract, clean, chunk, embed & index document into ChromaDB
  14. `POST /api/knowledge/search`: User-isolated semantic RAG search across indexed documents in ChromaDB
  15. `POST /api/knowledge/chat`: Grounded RAG Chat endpoint answering user questions directly from uploaded PDFs
  16. `DELETE /api/knowledge/:documentId`: Delete document vector embeddings from ChromaDB
  17. `GET /api/progress/dashboard`: Fetch full learning dashboard state, synced subjects, and stats
  18. `POST /api/progress/topic/toggle`: Toggle chapter or individual subtopic completion state
  19. `POST /api/progress/topic/add`: Add custom parent chapter or child subtopic
  20. `POST /api/progress/subject`: Create new academic subject
  21. `PUT /api/progress/subject/:subjectId`: Update subject name & metadata with automatic document resynchronization
  22. `DELETE /api/progress/subject/:subjectId`: Delete subject from user curriculum
  23. `POST /api/progress/reset-defaults`: Clean curriculum to active study materials
  24. `GET /api/flashcards`: Fetch user's flashcards with subject, topic, mastery filters and deck statistics
  25. `POST /api/flashcards/generate`: Generate AI flashcards based on completed topics & uploaded reference notes
  26. `POST /api/flashcards`: Manually create a custom flashcard
  27. `PATCH /api/flashcards/:id/master`: Toggle flashcard mastery status & increment review count
  28. `DELETE /api/flashcards/:id`: Delete a single flashcard
  29. `POST /api/flashcards/reset-mastery`: Reset mastery for all cards in a subject deck to practice again
  30. `GET /api/quizzes`: Fetch user's quizzes with subject filters and quiz stats
  31. `POST /api/quizzes/generate`: Generate AI assessment quiz from completed topics
  32. `GET /api/quizzes/:id`: Fetch specific quiz details for practice session
  33. `POST /api/quizzes/:id/submit`: Submit quiz answers, compute percentage score, and save attempt log
  34. `DELETE /api/quizzes/:id`: Delete a practice quiz

---

## 5. Known Issues & Technical Debt

1. **Hardcoded API URLs**: Frontend files hardcode `http://localhost:3000/api` in `authApi.js` and `http://localhost:3000` in `DocumentViewerModal.jsx`. Should be migrated to environment variables (`import.meta.env.VITE_API_BASE_URL`).
2. **Hardcoded Default Profile Avatar**: Default profile picture uses an external Unsplash URL (`https://images.unsplash.com/photo-1534528741775-53994a69daeb...`).

---

## 6. Current Next Steps

1. **Phase 3 - Concept Extraction Engine**: Implement NLP / LLM extraction of concept triplets `(Subject, Relation, Object)` from document chunks.
2. **Phase 3 - Knowledge Graph Canvas**: Render interactive concept graph with nodes and relationship edges on frontend.
