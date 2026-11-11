# System Architecture (SYSTEM_ARCHITECTURE)

## 1. High-Level Architectural Overview

**AI-KMS (AI Knowledge Management System)** is constructed on a decoupled **Client-Server RESTful architecture** with a specialized **Retrieval-Augmented Generation (RAG) vector pipeline**.

```text
                                  +---------------------------------------+
                                  |         React 19 Frontend             |
                                  |  (Vite + React Router + Context API)  |
                                  +-------------------+-------------------+
                                                      |
                                            HTTP / REST API Calls
                                            (Bearer JWT Token)
                                                      |
                                                      v
                                  +-------------------+-------------------+
                                  |         Node.js / Express Backend     |
                                  |  (Routes -> Middlewares -> Controllers)|
                                  +---------+---------+---------+---------+
                                            |         |         |
                     +----------------------+         |         +-----------------------+
                     |                                |                                 |
                     v                                v                                 v
          +-------------------+             +-------------------+             +-------------------+
          | Local File System |             |   MongoDB Store   |             |     ChromaDB      |
          | (Backend/uploads) |             |    (Mongoose)     |             |  (Vector Store)   |
          +-------------------+             +-------------------+             +---------+---------+
                                                                                        |
                                                                              Semantic Embeddings
                                                                                        |
                                                                                        v
                                                                              +-------------------+
                                                                              | Google Gemini LLM |
                                                                              | (gemini-2.5-flash)|
                                                                              +-------------------+
```

---

## 2. Frontend Architecture (React 19)

### 2.1 Core Framework & Libraries
- **Framework**: React 19 (`react` 19.2.8, `react-dom` 19.2.8)
- **Bundler**: Vite 8.2.2
- **Routing**: React Router DOM 7.18.3 (`BrowserRouter`, `Routes`, `Route`, `Navigate`)
- **HTTP Client**: Axios 1.20.0 with request interceptors
- **Icons**: Lucide React 1.42.0
- **Markdown Rendering**: `react-markdown` 10.1.0

### 2.2 Client Routing Map & Layout Hierarchy
```text
App Shell (App.jsx)
├── Public Routes (Login, Signup, ForgotPassword, ResetPassword, NotFound)
└── Protected Routes Wrapped in AppLayout (Frontend/src/layouts/AppLayout.jsx)
    ├── /dashboard   ──> Dashboard.jsx (Curriculum progress, subject vaults, study metrics)
    ├── /chat        ──> Chat.jsx (RAG conversational workspace with dual-state layout)
    ├── /quiz        ──> Quiz.jsx (AI assessment hub, timed player, scoring)
    ├── /flashcards  ──> Flashcards.jsx (3D interactive flip deck & spaced revision)
    └── /notes       ──> Notes.jsx (Study materials repository & notes vault)
```

| Route Path | Layout | Page View | Purpose | Access Control |
|---|---|---|---|---|
| `/` | — | `RootRedirect` in `App.jsx` | Redirects authenticated users to `/dashboard`, unauthenticated to `/login` | Public |
| `/login` | `AuthLayout.jsx` | `Login.jsx` | User sign-in with email & password | Public |
| `/signup` | `AuthLayout.jsx` | `Signup.jsx` | User registration with input validation | Public |
| `/forgot-password` | `AuthLayout.jsx` | `ForgotPassword.jsx` | Password reset email request | Public |
| `/reset-password/:token` | `AuthLayout.jsx` | `ResetPassword.jsx` | Password update with 30-min security token | Public |
| `/dashboard` | `AppLayout.jsx` | `Dashboard.jsx` | Curriculum progress, subject vaults, study metrics | Protected (JWT) |
| `/chat` | `AppLayout.jsx` | `Chat.jsx` | RAG conversational workspace with scope selector & dual-state layout | Protected (JWT) |
| `/quiz` | `AppLayout.jsx` | `Quiz.jsx` | AI assessment hub, timed player, scoring | Protected (JWT) |
| `/flashcards` | `AppLayout.jsx` | `Flashcards.jsx` | 3D interactive flip deck & spaced revision | Protected (JWT) |
| `/notes` | `AppLayout.jsx` | `Notes.jsx` | Study materials repository & notes vault | Protected (JWT) |
| `/server-offline` | — | `NotFound.jsx` (`isBackendOffline: true`) | Dedicated 503 backend disconnection screen | Public |
| `*` | — | `NotFound.jsx` | 404 Knowledge Node Not Found error screen | Public |

### 2.3 State Management & Synchronization
1. **`AuthContext` (`Frontend/src/context/AuthContext.jsx`)**:
   - Manages user authentication state (`user`, `token`, `isAuthenticated`, `loading`).
   - Synchronizes tokens and session state with browser `localStorage`.
2. **Session Chat Persistence (`sessionStorage`)**:
   - Ongoing chat messages are stored under `aikms_active_chat_messages` in `sessionStorage` so navigating between tabs does not lose conversation context.
3. **Decoupled DOM Events**:
   - Sibling views communicate state changes without prop drilling:
     - `aikms:refresh-dashboard`: Triggers fresh dashboard metrics fetch.
     - `aikms:document-deleted`: Signals document removal to update sidebars and notes view immediately.

---

## 3. Backend Architecture (Node.js & Express 5)

### 3.1 Application Structure
```text
Backend/
├── uploads/                 # Local directory storing uploaded files
└── src/
    ├── config/
    │   └── db.js            # MongoDB connection logic via Mongoose
    ├── controllers/
    │   ├── document.controller.js  # Upload, fetch, and delete logic
    │   ├── flashcard.controller.js # Flashcard generation, flip deck, mastery
    │   ├── knowledge.controller.js # Processing, vector search, RAG chat
    │   ├── progress.controller.js  # Dashboard stats, topic toggle, subject cascade
    │   ├── quiz.controller.js      # Quiz generation, player, scoring analytics
    │   └── user.Controller.js     # Register, login, profile, password reset
    ├── middleware/
    │   ├── authMiddleware.js      # Bearer token verification middleware (protect)
    │   ├── errorMiddleware.js     # 404 Not Found & global error handler
    │   └── uploadMiddleware.js    # Multer diskStorage & file filter config
    ├── models/
    │   ├── document.model.js      # Document metadata & processing status
    │   ├── flashcard.model.js     # Flashcard question, answer, hint, mastery
    │   ├── progress.model.js      # Subjects, hierarchical chapters/subtopics
    │   ├── quiz.model.js          # MCQ questions, timer, score, attempts
    │   └── user.model.js          # Credentials, hashed password, reset tokens
    ├── repositories/
    │   ├── document.repository.js # Document data access abstractions
    │   └── progress.repository.js # Progress data access abstractions
    ├── routes/
    │   ├── document.routes.js     # /api/documents
    │   ├── flashcard.routes.js    # /api/flashcards
    │   ├── knowledge.routes.js    # /api/knowledge
    │   ├── progress.routes.js     # /api/progress
    │   ├── quiz.routes.js         # /api/quizzes
    │   └── user.routes.js         # /api/auth & /api/users
    ├── services/
    │   ├── chromaService.js       # ChromaDB collection & vector operations
    │   ├── documentProcessor.js   # PDF/text file parsing (pdf-parse)
    │   ├── embeddingService.js    # Vector embeddings generation
    │   ├── textChunker.js         # Recursive semantic chunker
    │   ├── textCleaner.js         # Text normalization & cleaning
    │   └── topicExtractor.service.js # Universal Gemini topic hierarchy extraction
    ├── utils/
    │   ├── generateToken.js       # JWT signing helper utility
    │   └── sendEmail.js           # Nodemailer Gmail SMTP email sender
    └── index.js                   # Main Express application entry point
```

---

## 4. The RAG Vector Pipeline

The Retrieval-Augmented Generation (RAG) system grounds conversational responses directly in the user's uploaded documents:

```text
[ Upload Document (.pdf, .docx, .txt, etc.) ]
                      │
                      v
[ DocumentProcessor (pdf-parse / text parser) ]
                      │
                      v
[ TextCleaner & Semantic Chunker (500-1000 chars, 100 overlap) ]
                      │
                      v
[ EmbeddingService -> Vector Representation ]
                      │
                      v
[ ChromaDB: Stored with DocumentId & UserId Metadata ]
                      │
                      +-----------------------------+
                                                    |
                                                    v
[ User Query in Chat ] ──────────> [ ChromaDB Vector Similarity Search ]
                                                    │
                                                    v
                                   [ Top K Context Chunks Retrieved ]
                                                    │
                                                    v
                                   [ Google Gemini 2.5 Flash Grounded Prompt ]
                                                    │
                                                    v
                                   [ Factual, Context-Grounded AI Answer Stream ]
```

---

## 5. Security & Isolation Architecture

1. **JWT Authentication**: Private endpoints require `Authorization: Bearer <token>`. The `protect` middleware decodes the token and attaches the authenticated user to `req.user`.
2. **Strict User Scoping**: All database queries (`find`, `findOne`, `deleteMany`) enforce `uploadedBy: req.user._id` or `userId: req.user._id`, guaranteeing complete data isolation between users.
3. **Local File Sanitization**: Uploaded files receive timestamped, cryptographically random filenames to prevent directory traversal or name collisions.
4. **Blank File Guard**: Files with less than 3 characters of extractable text are rejected with HTTP 400 and removed immediately from disk.
5. **Cascade Subject Wiping**: Deleting a subject permanently cleans physical files from disk, vectors from ChromaDB, and related records from `Document`, `Flashcard`, and `Quiz` collections.

