# Technical Stack & Infrastructure (TECH_STACK)

## 1. Overview
This document describes the technical stack, frameworks, libraries, runtime environments, hardware/network requirements, data communication patterns, and technical constraints of the **AI-KMS** repository.

For architectural diagrams and data flows, see [`SYSTEM_ARCHITECTURE.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/02_Architecture/SYSTEM_ARCHITECTURE.md). For complete API route definitions, see [`API_REFERENCE.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/04_Technical/API_REFERENCE.md).

---

## 2. Technology Stack

### 2.1 Frontend Stack
- **Framework**: React 19 (`react` 19.2.8, `react-dom` 19.2.8)
- **Build Tool / Bundler**: Vite 8.2.2 (`@vitejs/plugin-react` 6.1.0)
- **Routing**: React Router DOM 7.18.3 (`BrowserRouter`, `Routes`, `Route`, `Navigate`)
- **HTTP Client**: Axios 1.20.0
- **Iconography**: Lucide React 1.42.0 (`Brain`, `FileText`, `UploadCloud`, `User`, `Lock`, `Mail`, etc.)
- **Styling**: Vanilla CSS (Modular stylesheets: [index.css](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/styles/index.css), [auth.css](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/styles/auth.css), [dashboard.css](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/styles/dashboard.css))
- **Environment**: Node.js ES Modules (`"type": "module"`)

### 2.2 Backend Stack
- **Runtime Environment**: Node.js
- **Web Framework**: Express.js 5.2.1
- **Database ODM**: Mongoose 9.9.4
- **File Upload Handler**: Multer 2.3.0 (`diskStorage`)
- **Authentication**: JSON Web Tokens (`jsonwebtoken` 9.0.3)
- **Password Hashing**: `bcryptjs` 3.0.3
- **Middleware & Utilities**: `cors` 2.8.6, `dotenv` 17.4.2, `nodemon` 3.1.14

### 2.3 Database
- **Database System**: MongoDB
- **Connection URI**: Configured via `MONGO_URI` in `.env` (Fallback: `mongodb://127.0.0.1:27017/aikms`) ([db.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/config/db.js))

---

## 3. Libraries and Dependencies Summary

### Backend Dependencies (`Backend/package.json`)
```json
{
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "chromadb": "^3.5.0",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "mongoose": "^9.9.4",
    "multer": "^2.3.0",
    "nodemailer": "^10.2.1",
    "nodemon": "^3.1.14",
    "pdf-parse": "^2.4.5"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^5.1.0",
    "supertest": "^7.3.2",
    "vitest": "^5.1.0"
  }
}
```

### Frontend Dependencies (`Frontend/package.json`)
```json
{
  "dependencies": {
    "axios": "^1.20.0",
    "lucide-react": "^1.42.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-markdown": "^10.1.0",
    "react-router-dom": "^7.18.3"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "@vitejs/plugin-react": "^6.1.0",
    "eslint": "^10.9.0",
    "vite": "^8.2.2"
  }
}
```

---

## 4. Project Architecture

The application follows a standard **Client-Server (REST API)** architecture.

```
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
                      +---------+-------------------+---------+
                                |                   |
                      Static File Serving      Mongoose ODM
                                |                   |
                                v                   v
                      +---------+---------+   +-----+---------+
                      | Local File System |   |    MongoDB    |
                      | (Backend/uploads) |   |  (Database)   |
                      +-------------------+   +---------------+
```

### 4.1 Frontend Component Structure
```
Frontend/src/
├── api/
│   ├── authApi.js           # Axios instance with request interceptor
│   ├── documentApi.js       # Endpoints for document upload, retrieval, & deletion
│   ├── knowledgeApi.js      # Endpoints for RAG processing, vector search, and chat
│   └── progressApi.js       # Endpoints for dashboard data, topic toggle, subject management
├── components/
│   ├── auth/
│   │   ├── AuthLayout.jsx   # Shell for auth forms with brand header
│   │   ├── LoginForm.jsx    # Login form component with error/loading states
│   │   ├── ProtectedRoute.jsx # HOC route wrapper enforcing auth
│   │   └── SignupForm.jsx   # Registration form component
│   ├── common/
│   │   ├── Logo.jsx         # Reusable brand logo
│   │   └── Navbar.jsx       # Top navigation header
│   └── dashboard/
│       ├── ChatInput.jsx    # Chat textarea input box
│       ├── ChatWindow.jsx   # Message stream display & welcome view
│       ├── CreateSubjectModal.jsx # Modal to create custom subject
│       ├── DashboardOverview.jsx  # Main Learning Dashboard container
│       ├── DocumentViewerModal.jsx # PDF preview & document metadata modal
│       ├── LearningProgressSection.jsx # Progress distribution visualizer
│       ├── OverviewStats.jsx       # KPI stats cards
│       ├── QuickActionsBar.jsx     # Quick action buttons bar
│       ├── RecentActivitySection.jsx # Chronological activity log
│       ├── Sidebar.jsx      # Left sidebar navigation & document drawer
│       ├── SubjectCard.jsx  # Subject card with progress bar & study button
│       ├── SubjectDetailModal.jsx  # Hierarchical topic accordion checklist
│       └── UploadModal.jsx  # Drag & drop document upload modal
├── context/
│   └── AuthContext.jsx      # Authentication provider state management
├── pages/
│   ├── Dashboard.jsx        # Main workspace page (toggling Chat vs Dashboard)
│   ├── Login.jsx            # Login page view
│   ├── Profile.jsx          # User settings & security page
│   ├── Register.jsx         # Standalone registration page view
│   └── Signup.jsx           # Signup wrapper page view
└── styles/
    ├── auth.css             # Authentication styling
    ├── dashboard.css        # Workspace layout styling
    ├── dashboard-view.css   # Dark-mode Learning Dashboard & Accordion styling
    └── index.css            # Base design tokens & CSS resets
```

### 4.2 Backend Directory Structure
```
Backend/
├── uploads/                 # Local directory storing uploaded files
└── src/
    ├── config/
    │   └── db.js            # MongoDB connection logic via Mongoose
    ├── controllers/
    │   ├── document.controller.js # Upload, fetch, and delete logic
    │   ├── knowledge.controller.js # Document processing, search, and chat logic
    │   ├── progress.controller.js # Dashboard stats, topic toggle, subject management
    │   └── user.Controller.js    # Register, login, profile, password logic
    ├── middleware/
    │   ├── authMiddleware.js     # Bearer token verification middleware
    │   ├── errorMiddleware.js    # 404 Not Found & global error handler
    │   └── uploadMiddleware.js   # Multer diskStorage & file filter config
    ├── models/
    │   ├── document.model.js     # Mongoose Document schema definition
    │   ├── progress.model.js     # Mongoose Progress schema definition
    │   └── user.model.js         # Mongoose User schema definition with password hash hook
    ├── routes/
    │   ├── document.routes.js    # Express router for /api/documents
    │   ├── knowledge.routes.js   # Express router for /api/knowledge
    │   ├── progress.routes.js    # Express router for /api/progress
    │   └── user.routes.js        # Express routers for /api/auth & /api/users
    ├── services/
    │   ├── chromaService.js      # ChromaDB client & vector operations
    │   ├── documentProcessor.js  # PDF/text file parsing
    │   ├── embeddingService.js   # Vector embeddings generation
    │   ├── textChunker.js        # Semantic text chunking
    │   ├── textCleaner.js        # Text normalization & cleaning
    │   └── topicExtractor.service.js # Universal AI-Powered (Gemini) dynamic curriculum & topic hierarchy extraction with heuristic fallback
    ├── utils/
    │   └── generateToken.js      # JWT signing helper utility
    └── index.js                  # Main Express app initialization & server entry point
```

---

## 5. Frontend-Backend Communication

1. **API Protocol**: JSON over HTTP/HTTPS.
2. **Base URL**: `http://localhost:3000/api` (configured in [authApi.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/api/authApi.js#L3)).
3. **Authentication Interceptor**: `authApi` configures an Axios request interceptor reading `token` from `localStorage` and populating `Authorization: Bearer <token>` on all outgoing requests.
4. **Static File Serving**: Express serves uploaded document files via `app.use("/uploads", express.static("uploads"))` at `http://localhost:3000/uploads/<filename>`.

---

## 6. Authentication Implementation

- **Token Generation**: Uses `jsonwebtoken` signed with secret `JWT_SECRET` (expiration: `30d`).
- **Password Security**: Password pre-save hook in `user.model.js` uses `bcrypt.genSalt(10)` and `bcrypt.hash()` to encrypt passwords before saving to MongoDB.
- **Password Comparison**: `userSchema.methods.matchPassword` compares raw candidate passwords against hashed stored values.
- **Middleware Guard**: `protect` middleware ([authMiddleware.js](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/middleware/authMiddleware.js)) extracts token from Authorization header, verifies signature, fetches user document excluding `password`, and attaches it to `req.user`.

---

## 7. API Endpoints

### 7.1 Authentication Routes (`/api/auth`)
| Method | Endpoint | Access | Controller Function | Description |
|---|---|---|---|---|
| POST | `/api/auth/register` | Public | `registerUser` | Register user, create account, and return user object with JWT token |
| POST | `/api/auth/login` | Public | `loginUser` | Authenticate user credentials and return user object with JWT token |
| GET | `/api/auth/me` | Private | `getUserProfile` | Get current logged-in user profile details |

### 7.2 User Routes (`/api/users`)
| Method | Endpoint | Access | Controller Function | Description |
|---|---|---|---|---|
| PUT | `/api/users/profile` | Private | `updateUserProfile` | Update user name and profile image URL |
| PUT | `/api/users/change-password` | Private | `changeUserPassword` | Validate current password and update to new password |

### 7.3 Document Routes (`/api/documents`)
| Method | Endpoint | Access | Controller Function | Description |
|---|---|---|---|---|
| POST | `/api/documents/upload` | Private | `uploadDocument` | Upload file via Multer single file (`file`), store file on disk, create DB record |
| GET | `/api/documents/my-documents` | Private | `getMyDocuments` | Fetch documents uploaded by user with optional query filters (`subject`, `topic`, `folder`) |
| DELETE | `/api/documents/:id` | Private | `deleteDocument` | Verify ownership, delete file from `/uploads` directory, delete DB document record |

### 7.4 Knowledge & RAG Routes (`/api/knowledge`)
| Method | Endpoint | Access | Controller Function | Description |
|---|---|---|---|---|
| POST | `/api/knowledge/process/:documentId` | Private | `processDocument` | Extract, clean, chunk, embed, and store document in ChromaDB |
| POST | `/api/knowledge/search` | Private | `searchKnowledge` | Semantic vector search scoped to authenticated user |
| POST | `/api/knowledge/chat` | Private | `chatWithKnowledge` | Grounded RAG conversational Q&A using Gemini 2.5 Flash |
| DELETE | `/api/knowledge/:documentId` | Private | `deleteDocumentKnowledge` | Delete document embeddings and chunks from ChromaDB |

### 7.5 Progress & Dashboard Routes (`/api/progress`)
| Method | Endpoint | Access | Controller Function | Description |
|---|---|---|---|---|
| GET | `/api/progress/dashboard` | Private | `getDashboardData` | Fetch synchronized dashboard KPI stats, subject cards, and recent activities |
| POST | `/api/progress/topic/toggle` | Private | `toggleTopic` | Toggle chapter or individual subtopic completion state and recalculate progress |
| POST | `/api/progress/subject` | Private | `createSubject` | Create new subject with custom color and optional topics |
| PUT | `/api/progress/subject/:subjectId` | Private | `updateSubject` | Rename or update subject metadata with document auto-sync |
| DELETE | `/api/progress/subject/:subjectId` | Private | `deleteSubject` | Remove subject from user curriculum and unlink documents |
| POST | `/api/progress/reset-defaults` | Private | `resetDefaultSubjects` | Clean curriculum to active study materials |

### 7.6 Flashcards & Spaced Revision Routes (`/api/flashcards`)
| Method | Endpoint | Access | Controller Function | Description |
|---|---|---|---|---|
| GET | `/api/flashcards` | Private | `getFlashcards` | Fetch user flashcards with subject/topic/mastery filters & deck stats |
| POST | `/api/flashcards/generate` | Private | `generateFlashcards` | Inspect completed topics, extract PDF text, and generate revision cards with Gemini LLM |
| POST | `/api/flashcards` | Private | `createManualFlashcard` | Create a custom flashcard with front/back/hint/difficulty |
| PATCH | `/api/flashcards/:id/master` | Private | `toggleFlashcardMastered` | Toggle card mastery state (`isMastered: true/false`) and increment review count |
| DELETE | `/api/flashcards/:id` | Private | `deleteFlashcard` | Remove flashcard from database |
| POST | `/api/flashcards/reset-mastery` | Private | `resetDeckMastery` | Reset mastery status for all cards in a subject to practice again |

### 7.7 System Routes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Healthcheck endpoint returning `{ message: 'AiKMS API Server is running smoothly' }` |

---

## 8. Important Technical Decisions

1. **Local Disk Storage for File Uploads**: Documents are uploaded to `Backend/uploads` with timestamped unique filenames (`${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`).
2. **Dual State Persistence**: Auth state is maintained both in React Context state (`AuthContext`) and synchronized with `localStorage` (`token`, `user`, `isAuthenticated`).
3. **Pre-defined Document Status Scheme**: Documents include a `processingStatus` enum (`'uploaded'`, `'processing'`, `'ready'`, `'failed'`) designed to orchestrate asynchronous background vector processing in upcoming modules.
4. **Mongoose Timestamps**: Both User and Document schemas use `{ timestamps: true }` enabling automated `createdAt` and `updatedAt` field tracking.

---

## 9. Important Technical Constraints

- **Single Host Static Base URL**: Frontend currently hardcodes `http://localhost:3000` for file serving and API requests.
- **Upload File Limit**: Maximum size per file is capped at **20MB** in Multer config.
- **Allowed Extensions**: Whitelist restricted strictly to `.pdf`, `.ppt`, `.pptx`, `.doc`, `.docx`, `.txt`, `.md`.
- **Database Dependency**: MongoDB server must be running locally on port 27017 or accessible via `MONGO_URI`.
