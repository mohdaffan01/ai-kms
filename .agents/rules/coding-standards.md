---
trigger: always_on
---

# Coding Standards & Quality Guidelines

## 1. Code Quality & General Principles
All code written for **AI-KMS** must be clean, readable, modular, well-commented, and robust against runtime failures. Code must adhere to existing repository patterns rather than introducing novel paradigms.

---

## 2. Naming Conventions

### File & Folder Naming
- **React Components**: PascalCase matching the component name (e.g., `DashboardOverview.jsx`, `SubjectDetailModal.jsx`, `AuthLayout.jsx`).
- **React Hooks & Utilities**: camelCase (e.g., `useAuth.js`, `formatDate.js`).
- **Express Routes**: kebab-case or camelCase followed by `.routes.js` (e.g., `document.routes.js`, `user.routes.js`, `flashcard.routes.js`).
- **Express Controllers**: camelCase followed by `.controller.js` (e.g., `progress.controller.js`, `document.controller.js`, `knowledge.controller.js`).
- **Mongoose Models**: singular camelCase or PascalCase followed by `.model.js` (e.g., `user.model.js`, `document.model.js`, `progress.model.js`).
- **Backend Services**: camelCase followed by `.service.js` or descriptive suffix (e.g., `topicExtractor.service.js`, `chromaService.js`, `documentProcessor.js`).
- **CSS Stylesheets**: kebab-case matching layout or view (e.g., `index.css`, `auth.css`, `dashboard.css`, `dashboard-view.css`).

### Variable & Function Naming
- **Variables & Functions**: camelCase (e.g., `getUserProfile`, `matchingDocs`, `isMastered`).
- **Constants**: UPPER_SNAKE_CASE for global configuration constants (e.g., `DEFAULT_CS_SUBJECTS`, `JWT_SECRET`).
- **React State & Props**: Descriptive camelCase (e.g., `activeTab`, `isGenerating`, `onOpenViewer`).
- **CSS Classes**: BEM or kebab-case with clear namespaces (e.g., `.subject-card`, `.accordion-header`, `.delete-warning-banner`).

---

## 3. Folder & File Organization

```text
Backend/
├── uploads/              # Local disk storage for user-uploaded documents
└── src/
    ├── config/           # Database and third-party configuration (db.js)
    ├── controllers/      # Request handlers and business logic
    ├── middleware/       # Express middlewares (authMiddleware.js, uploadMiddleware.js)
    ├── models/           # Mongoose schemas and model definitions
    ├── repositories/     # Data access layer for abstracting model operations
    ├── routes/           # Express router endpoints mapped to controllers
    ├── services/         # Extraction, chunking, embeddings, ChromaDB, AI integration
    ├── utils/            # Shared helper functions (sendEmail.js, token generator)
    └── index.js          # Server entry point

Frontend/
└── src/
    ├── api/              # Axios API service clients with JWT interceptor
    ├── components/       # Modular, reusable UI components grouped by feature
    │   ├── auth/         # Login, Register, ProtectedRoute
    │   ├── common/       # Navbar, Logo, Splash screens, Modals
    │   └── dashboard/    # Cards, Modals, Accordions, Chat workspace
    ├── context/          # React Context providers (AuthContext.jsx)
    ├── pages/            # Top-level route pages (Dashboard, Login, Profile)
    ├── styles/           # Modular CSS stylesheets
    └── App.jsx           # App shell and React Router tree
```

---

## 4. Frontend Coding Standards (React 19)

1. **Pure Functional Components**: Use modern functional components with standard React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`).
2. **Explicit Iconography (Lucide React)**:
   - Use vector icons from `lucide-react`.
   - **No Hardcoded External Avatars**: Never embed external URLs (e.g. Unsplash) or stock images for user avatars. Use themed vector icons (e.g. `<User />`, `<Sparkles />`).
3. **State Management & Cross-Component Synchronization**:
   - Use `AuthContext` for authentication and user session state.
   - For loosely-coupled sibling views (e.g., when a subject or document is deleted and Sidebar/NotesView must update), dispatch custom DOM events (`aikms:refresh-dashboard`, `aikms:document-deleted`).
   - Use `sessionStorage` (`aikms_active_chat_messages`) for transient state like active chat messages to guarantee zero message loss during navigation.
4. **Optimistic UI with Rollback Safety**:
   - Provide immediate visual feedback on user actions (e.g., checking topic checkboxes).
   - Catch errors on API failure and gracefully revert state with user alerts.
5. **Pure Vanilla CSS**:
   - Do not inject Tailwind classes or inline styles where CSS classes are available.
   - Maintain dark-mode design tokens defined in `Frontend/src/styles/index.css`.

---

## 5. Backend Coding Standards (Node.js & Express 5)

1. **ES Module Syntax**: Always use standard ES Modules (`import` / `export`). Do not mix with CommonJS (`require` / `module.exports`).
2. **Controller-Service-Repository Pattern**:
   - Controllers handle HTTP requests, validate input, call repositories/services, and return structured JSON.
   - Keep business logic modularized into dedicated services (e.g., `topicExtractor.service.js`, `chromaService.js`).
3. **Async / Await with Error Handling**:
   - Every asynchronous controller function must wrap operations in `try / catch` blocks or delegate to an async wrapper.
   - Return semantic HTTP status codes (200, 201, 400, 401, 403, 404, 500) with consistent JSON payloads: `{ success: boolean, message: string, ...data }`.
4. **Mongoose Document Deep Modification**:
   - When modifying nested arrays or subdocuments inside Mongoose models (e.g. `progress.subjects`), always call `progress.markModified('subjects')` before saving.
5. **File Handling Safety**:
   - Always verify file existence (`fs.existsSync`) before attempting to read or unlink (`fs.unlinkSync`) disk files.
   - Guard against relative vs. absolute path collisions using `path.resolve`.

---

## 6. Security & Data Protection Practices

1. **Authentication & Authorization**:
   - Protect all private endpoints with the `protect` JWT middleware ([`authMiddleware.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/middleware/authMiddleware.js)).
   - Verify resource ownership (`uploadedBy: req.user._id` or `userId: req.user._id`) on every query, update, and deletion operation.
2. **Password Security**:
   - Passwords must be hashed using `bcryptjs` with at least 10 salt rounds before persistence.
   - Password reset tokens must be cryptographically hashed using SHA-256 and given short expiry windows (30 minutes).
3. **Upload Sanitization & Validation**:
   - Validate file MIME types and enforce extension whitelists (`.pdf`, `.ppt`, `.pptx`, `.doc`, `.docx`, `.txt`, `.md`).
   - Enforce the 20MB file size limit in Multer.
   - Guard against blank files: extract text and reject files with fewer than 3 readable characters.

---

## 7. Testing & Verification Requirements

Before declaring any change completed:
1. **Syntax & Static Checks**: Run `node --check <file>` on modified backend files to guarantee zero syntax or import errors.
2. **Build Verification**: Run `npm run build --prefix Frontend` to verify that Vite bundles successfully with zero JSX, syntax, or Rollup binding errors.
3. **No Regressions**: Verify that related features (e.g. subject creation, document viewing, topic checking) continue to operate cleanly.

