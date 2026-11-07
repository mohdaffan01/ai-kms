# Application Flow Document (APP_FLOW)

## 1. Application Entry Point
- **Root URL**: `http://localhost:5173/`
- **Initial Routing Logic**: When a user accesses the root `/` or any unmatched route, `App.jsx` evaluates the `RootRedirect` component. 
  - If **authenticated** (`localStorage.getItem('isAuthenticated') === 'true'`), the user is immediately navigated to `/dashboard`.
  - On `/dashboard`, the active view defaults to **`chat`** (New Chat screen with welcome header & chat input) rather than the dashboard overview.
  - If **unauthenticated**, the user is redirected to `/login`.

---

## 2. Pages & Screens Map

| Page Route | Component File | Description | Access Control |
|---|---|---|---|
| `/login` | [Login.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Login.jsx) | Account login page with credentials form | Public (Redirects to `/dashboard` if logged in) |
| `/signup` | [Signup.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Signup.jsx) | Registration page with account setup form | Public (Redirects to `/dashboard` if logged in) |
| `/register` | [Register.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Register.jsx) | Standalone registration view with full validation | Public (Redirects to `/dashboard` if logged in) |
| `/forgot-password` | [ForgotPassword.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/ForgotPassword.jsx) | Password reset request form (triggers Nodemailer reset email) | Public |
| `/reset-password/:token` | [ResetPassword.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/ResetPassword.jsx) | Password reset token verification & new password submission | Public |
| `/dashboard` | [Dashboard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Dashboard.jsx) | Main workspace (Sidebar + New Chat default / Dashboard Overview / Flashcards / Quizzes) | Protected (Requires valid JWT session) |
| `/profile` | [Profile.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Profile.jsx) | User settings, avatar selection, & password update page | Protected (Requires valid JWT session) |
| `/404` | [NotFound.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/NotFound.jsx) | Themed 404 Knowledge Node Not Found error screen | Public |
| `/server-offline` | [NotFound.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/NotFound.jsx) | Dedicated 503 Backend Server Disconnected screen with live ping tester | Public |
| `*` (Catch-all) | [NotFound.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/NotFound.jsx) | Fallback route rendering 404 error page | Public |

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

3. **Password Reset Flow (Email & Token / OTP)**:
   - User clicks "Forgot Password?" link on `/login`.
   - User enters registered email address and submits.
   - Frontend calls `POST /api/auth/forgot-password`.
   - Backend creates a crypto hash token (expires in 30 mins) and sends an HTML email via `sendEmail.js` using Nodemailer Gmail SMTP.
   - User clicks the reset link in the email (`http://localhost:5173/reset-password/<token>`).
   - User enters new password and confirms password.
   - Frontend calls `POST /api/auth/reset-password/:token`.
   - On success, password is encrypted with bcrypt, token is cleared, and user is redirected to `/login` with success banner.

4. **Dual Chat Navigation & Session Persistence Flow**:
   - When user starts a chat in the workspace, messages are automatically saved to `sessionStorage` (`aikms_active_chat_messages`).
   - If user navigates to **Dashboard Overview**, **Quiz**, or **Flashcards** and then clicks **`Chat`** (`MessageSquare` icon in sidebar), the workspace switches back to Chat with all previous messages completely preserved.
   - If user wants a fresh start, clicking **`+ New Chat`** (Mint-Teal button in sidebar) clears the message array and removes the session item, opening a clean welcome screen.

5. **Session Verification & Logout**:
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
          │        ├──> Backend Multer receives file in Backend/uploads/
          │        ├──> Content Validation: resolveDocumentStats extracts readable text; if charCount < 3 (blank file), file is unlinked from disk & returns HTTP 400 Bad Request
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

---

### 3.9 Backend Disconnection & 404 Recovery Journey

```
[ User encounters Unmatched Route OR Backend Failure ]
          │
          ├──> Unmatched Route (e.g., /invalid-url)
          │        │
          │        └──> Router catches with path="*"
          │                 ├──> Renders <NotFound /> in 404 Mode
          │                 ├──> Displays "404 - Knowledge Node Not Found"
          │                 ├──> Explains link is broken or resource does not exist
          │                 └──> Action buttons: "Go to Dashboard" or "Back to Login"
          │
          └──> Backend Connection Failure (Server down on port 3000)
                   │
                   ├──> Triggers:
                   │        ├──> Direct navigation to /server-offline or ?reason=offline
                   │        ├──> Axios API error: error.code === 'ERR_NETWORK' / !error.response
                   │        └──> DashboardOverview catch handler displays red error banner with "Server Status" link
                   │
                   ├──> Renders <NotFound isBackendOffline={true} />
                   │        ├──> Displays "503 - Backend Server Disconnected"
                   │        ├──> Hero icon renders glowing Server + WifiOff badge
                   │        ├──> Diagnostics Card shows:
                   │        │        ├──> Target URL (http://localhost:3000/api)
                   │        │        ├──> Live Status pill ("Server Unreachable" / "Server Online")
                   │        │        ├──> Detailed error explanation
                   │        │        └──> CLI Quick-fix instruction: `npm run dev` in Backend/
                   │        │
                   │        └──> User clicks "Retry Connection":
                   │                 ├──> Pings `GET http://localhost:3000/` with 3.5s timeout
                   │                 ├──> If unreachable: Updates status to "Server Unreachable"
                   │                 └──> If reachable: Status turns green ("Server Online") and automatically redirects to /dashboard within 1.2s
```
