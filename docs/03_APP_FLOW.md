# Application Flow Document (APP_FLOW)

## 1. Application Entry Point
- **Root URL**: `http://localhost:5173/`
- **Initial Routing Logic**: When a user accesses the application, `App.jsx` evaluates the route. If an unauthenticated user accesses `/dashboard` or undefined routes (`*`), they are automatically redirected to `/login` ([App.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/App.jsx#L19)).

---

## 2. Pages & Screens Map

| Page Route | Component File | Description | Access Control |
|---|---|---|---|
| `/login` | [Login.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Login.jsx) | Account login page with form layout | Public (Redirects to `/dashboard` if logged in) |
| `/signup` | [Signup.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Signup.jsx) | Registration page with account setup form | Public (Redirects to `/dashboard` if logged in) |
| `/register` | [Register.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Register.jsx) | Standalone registration view with full validation | Public (Redirects to `/dashboard` if logged in) |
| `/dashboard` | [Dashboard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Dashboard.jsx) | Main workspace (Sidebar + Chat Interface / Dashboard tab) | Protected (Requires valid JWT session) |
| `/profile` | [Profile.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Profile.jsx) | User settings, avatar selection, & password update page | Protected (Requires valid JWT session) |

---

## 3. Step-by-Step User Journey Flows

### 3.1 Authentication & Onboarding Flow

```
[ Unauthenticated User ]
          │
          ├──> Access /signup or /register
          │        │
          │        ├──> Fill Full Name, Email, Password, Confirm Password
          │        ├──> Click "Create Account"
          │        ├──> HTTP POST /api/auth/register
          │        └──> Receive JWT Token & User Data -> Saved to localStorage
          │
          └──> Access /login
                   │
                   ├──> Fill Email & Password
                   ├──> Click "Log in"
                   ├──> HTTP POST /api/auth/login
                   └──> Receive JWT Token & User Data -> Saved to localStorage
                            │
                            v
                 [ Redirect to /dashboard ]
```

1. **User Registration**:
   - User navigates to `/signup` or `/register`.
   - User inputs Name, Email, Password, and Password Confirmation.
   - Frontend validates email format, password minimum length (8 characters), and matching passwords.
   - Request is sent via `registerApi` (`POST /api/auth/register`).
   - On success, token and user state are saved in `localStorage`, and user is navigated to `/dashboard`.

2. **User Login**:
   - User navigates to `/login`.
   - User enters Email and Password.
   - Request is sent via `loginApi` (`POST /api/auth/login`).
   - On success, `token`, `isAuthenticated=true`, and `user` payload are written to `localStorage`.
   - Navigation redirects to `/dashboard`.

3. **Session Verification & Logout**:
   - On app startup, `AuthContext` checks for `token` in `localStorage`. If present, calls `getMeApi()` (`GET /api/auth/me`).
   - Clicking **Logout** in Navbar or Sidebar clears `localStorage` tokens and redirects user to `/login`.

---

### 3.2 Document Upload Flow

```
[ User on /dashboard ]
          │
          ├──> Click "Upload Content" button in Sidebar
          │
          ├──> [ UploadModal Opens ]
          │        ├──> Drag & Drop or select file (.pdf, .ppt, .doc, .txt, .md <= 20MB)
          │        ├──> Auto-fills Title (editable)
          │        ├──> Enter required Subject (e.g., DBMS)
          │        ├──> Optionally enter Topic & Folder
          │        └──> Click "Upload Document"
          │
          ├──> HTTP POST /api/documents/upload (Multipart FormData with Bearer Token)
          │        ├──> Backend Multer saves file to Backend/uploads/
          │        ├──> Backend creates Document record in MongoDB
          │        └──> extractTopicsFromDocument automatically extracts hierarchical chapters & subtopics and syncs with Progress collection
          │
          └──> Modal shows success message -> Auto closes
                   │
                   v
   [ Sidebar document list & Dashboard Subject Topics automatically refresh via GET /api/documents/my-documents and GET /api/progress/dashboard ]
```

---

### 3.3 Document Viewing & Deletion Flow

```
[ User views document list in Sidebar ]
          │
          ├──> Click document item or "Eye" icon
          │        │
          │        ├──> [ DocumentViewerModal Opens ]
          │        ├──> Displays metadata (Title, File Size, Upload Date, Subject, Folder, Processing Status)
          │        ├──> Displays PDF preview inside iframe (if file is PDF)
          │        │
          │        ├──> Action: "Open in Tab" -> Opens http://localhost:3000/uploads/<filename> in browser tab
          │        ├──> Action: "Download" -> Initiates direct file download
          │        └──> Action: "Delete" -> Triggers deletion confirmation prompt
          │
          └──> Confirm Deletion
                   │
                   ├──> HTTP DELETE /api/documents/:id
                   │        ├──> Backend unlinks file from disk (fs.unlinkSync)
                   │        └──> Backend deletes document from MongoDB
                   │
                   └──> DocumentViewerModal closes -> Item removed from Sidebar document list
```

---

### 3.4 Interactive Chat Flow

```
[ User on /dashboard (Active tab: 'chat') ]
          │
          ├──> User types query into ChatInput textarea
          │    (e.g., "Summarize Unit 3 Database Indexing")
          │
          ├──> Press Enter or click Send button
          │
          ├──> User message appended immediately to ChatWindow stream
          │
          ├──> Input textarea clears & sends query to RAG backend (POST /api/knowledge/chat)
          │
          └──> Grounded AI Assistant response streamed back from ChromaDB chunks with TTS voice control
```

---

### 3.5 User Profile & Security Settings Flow

```
[ User navigates to /profile ]
          │
          ├──> Profile Information Panel
          │        ├──> Modify Full Name
          │        ├──> Enter custom Image URL or select from 5 Preset Avatars
          │        ├──> Click "Save Profile Changes"
          │        └──> HTTP PUT /api/users/profile -> Updates MongoDB & Context user state
          │
          └──> Security & Password Panel
                   ├──> Enter Current Password
                   ├──> Enter New Password (min. 8 chars) & Confirm New Password
                   ├──> Click "Update Password"
                   └──> HTTP PUT /api/users/change-password -> Validates current password and hashes new password
```

---

### 3.6 Learning Dashboard & Subject Progress Tracking Flow

```
[ User on /dashboard (Active tab: 'dashboard') ]
          │
          ├──> Initial Load: HTTP GET /api/progress/dashboard
          │        ├──> Fetches user progress, subject cards, and stats
          │        └──> Automatically cleans empty demo subjects & synchronizes uploaded docs
          │
          ├──> Overview KPI Cards:
          │        Displays Total Subjects, Total Topics, Completed Topics, Overall Progress %, Documents
          │
          ├──> Subject Cards Grid:
          │        ├──> Each card displays Subject Name, Code, Document Count Badge, Progress Bar
          │        ├──> "Study with AI" button -> Switches to Chat tab scoped to subject
          │        └──> Click anywhere on Card -> Launches Hierarchical SubjectDetailModal
          │
          └──> Quick Actions:
                   ├──> "+ Add Subject" -> Opens CreateSubjectModal
                   ├──> "Upload Notes" -> Opens UploadModal
                   └──> "Reset Defaults" -> Restores default CS curriculum subjects
```

---

### 3.7 Hierarchical Topic Checklist & Progress Tracking Flow

```
[ User opens SubjectDetailModal ]
          │
          ├──> Modal Header displays Subject Name, Progress Bar, Topic Completion Ratio, and Filter Pills
          │
          ├──> Accordion Chapters List:
          │        ├──> Click Chevron / Chapter Row -> Expands/Collapses chapter to view child subtopics
          │        ├──> Parent Completion Pill shows progress (e.g., "3 of 5 subtopics completed")
          │        │
          │        ├──> Toggle Child Subtopic Checkbox:
          │        │        ├──> Instant optimistic UI strikethrough & progress recalculation
          │        │        ├──> HTTP POST /api/progress/topic/toggle { subjectId, topicId, subtopicId, completed }
          │        │        └──> Backend persists completion and appends to recentActivities
          │        │
          │        └──> Toggle Parent Chapter Checkbox:
          │                 ├──> Toggles all nested child subtopics simultaneously
          │                 └──> HTTP POST /api/progress/topic/toggle { subjectId, topicId, completed }
          │
          └──> Add Custom Topic / Subtopic:
                   ├──> Click "+ Add Topic" inline form
                   ├──> Select "Top-level Parent Chapter" or select an existing parent to nest as child subtopic
                   ├──> Enter topic title and submit
                   └──> HTTP POST /api/progress/topic/add { subjectId, name, parentTopicId }
```

---

### 3.8 Smart Flashcards & 3D Interactive Revision Deck Flow

```
[ User on /dashboard (Active tab: 'flashcards') ]
          │
          ├──> Access via Sidebar "Flashcards" square button OR "Practice Flashcards" CTA in SubjectDetailModal
          │
          ├──> Initial Load: HTTP GET /api/flashcards?subject=...&filter=...
          │        ├──> Fetches user's flashcards, deck stats (Total, Mastered, Needs Practice), and topic list
          │        └──> Calculates mastery percentage bar
          │
          ├──> Study Mode (3D Interactive Flip Deck):
          │        ├──> Front Face: Displays Concept/Question prompt, subject/topic badges, difficulty pill, and hint
          │        ├──> Click Card or press Spacebar -> 3D flip animation revealing back face with detailed explanation
          │        ├──> Press "Mark as Mastered" (or Key '2') -> HTTP PATCH /api/flashcards/:id/master { isMastered: true }
          │        ├──> Press "Needs Practice" (or Key '1') -> HTTP PATCH /api/flashcards/:id/master { isMastered: false }
          │        ├──> Press Left/Right arrow keys -> Instant card navigation
          │        ├──> Shuffle button -> Randomizes card array for enhanced active recall
          │        └──> Deck Completion -> Celebratory summary card with score & restart/shuffle actions
          │
          ├──> Deck Grid Mode:
          │        ├──> Switch tab to "All Cards" -> Responsive grid of all flashcards
          │        ├──> Real-time search filter by question or explanation text
          │        └──> Direct deletion and mastery toggles
          │
          └──> AI Flashcard Generation:
                   ├──> Click "✨ Generate with AI" button -> Opens AI Generator Modal
                   ├──> Displays green checkmark badges for all Completed Topics in that subject (from Progress DB)
                   ├──> Select "All Completed Topics" or "Specific Topic", and choose count (2-15)
                   ├──> HTTP POST /api/flashcards/generate { subject, topic, count }
                   └──> Gemini LLM analyzes reference PDF text & completed topics -> Returns and saves new cards to deck
```
