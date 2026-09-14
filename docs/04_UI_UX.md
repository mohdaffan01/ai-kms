# UI / UX Documentation (UI_UX)

## 1. Design Aesthetics & Visual Style

- **Color Palette & Theme**:
  - **Background**: Deep obsidian dark mode (`#0b0f19`, `#0f172a`, `#111827`).
  - **Panels & Cards**: Semi-transparent dark surface cards (`#1e293b`, `#161e31`, `#0f172a`) with subtle glowing borders (`#2e354f`, `#1e293b`).
  - **Primary Accent**: Neon violet/indigo gradient highlights (`#6366f1`, `#4f46e5`, `#818cf8`).
  - **Text Colors**: Primary crisp white (`#f8fafc`), secondary muted gray (`#94a3b8`), dim footnote gray (`#64748b`).
  - **Status Accents**: Success green (`#10b981`), Error red (`#ef4444`), Warning amber (`#f59e0b`), Info blue (`#3b82f6`).
- **Typography**: Clean sans-serif system font stack with high readability contrast.
- **Visual Effects**: Subtle glassmorphism, dotted background pattern (`.dotted-background`), soft drop-shadows, rounded corners (`8px` to `16px`), and smooth transition hover effects.

---

## 2. Page & Layout Structure

### 2.1 Navigation Bar ([Navbar.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/common/Navbar.jsx))
- **Position**: Fixed top navigation bar.
- **Elements**:
  - **Brand Logo**: Glowing brain icon with gradient text **AiKMS** ([Logo.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/common/Logo.jsx)).
  - **Navigation Links** (when logged in): **Dashboard** tab link, **Profile** tab link.
  - **User Badge**: Circular user avatar image with fallback error handling, displaying user first name.
  - **Logout Button**: Red/muted icon button triggering session cleanup and redirecting to `/login`.

### 2.2 Dashboard Layout ([Dashboard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Dashboard.jsx))
- **Structure**: Split-screen two-column layout.
- **Left Column**: Collapsible navigation sidebar ([Sidebar.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/Sidebar.jsx)) containing document list and upload triggers.
- **Right Column**: Main chat main area ([ChatWindow.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/ChatWindow.jsx) and [ChatInput.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/ChatInput.jsx)) or placeholder view when switched to Dashboard tab.

---

## 3. Important Components & Interactivity

### 3.1 Sidebar Component ([Sidebar.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/Sidebar.jsx))
- **Brand Header**: Compact logo displaying "AiKMS".
- **Navigation Action Buttons**:
  - **Dashboard Button**: Switches main view to high-level Dashboard header.
  - **New Chat Button**: Clears current message stream.
- **Content Section**:
  - Displays count badge of uploaded documents.
  - Scrollable document list item cards featuring file title, subject tag, quick view eye icon button, and delete garbage bin button.
- **Upload Content Trigger**: Accent button with upload icon launching [UploadModal.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/UploadModal.jsx).
- **User Footer**: Profile avatar badge, user name, user email, and logout icon button.

### 3.2 Chat Window ([ChatWindow.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/ChatWindow.jsx))
- **Empty State**: Centered welcome screen featuring a large glowing Brain icon, "Welcome to AiKMS" heading, and subtitle instruction ("Ask anything from your uploaded learning materials.").
- **Message Stream**: Vertical feed with smooth auto-scroll to bottom.
  - **User Row**: Right-aligned/distinct bubble displaying user icon and message text.
  - **AI Row**: Left-aligned bubble featuring Brain icon avatar, sender label ("AiKMS Assistant"), and markdown response text.

### 3.3 Chat Input ([ChatInput.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/ChatInput.jsx))
- **Input Textarea**: Auto-expanding single-row textarea with placeholder ("Ask anything about your study material...").
- **Keyboard Shortcut**: Submits on `Enter` key (without `Shift`).
- **Send Button**: Circular icon button with `Send` icon, disabled when input string is empty or whitespace.
- **Footer Disclaimer**: Micro text ("AiKMS Demo Workspace • RAG-based AI answer model will be enabled in Module 2").

### 3.4 Upload Content Modal ([UploadModal.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/UploadModal.jsx))
- **Overlay**: Darkened backdrop dismissing modal on click.
- **Drop Zone**: Interactive dashed drag-and-drop file target. Highlights on drag over.
  - Displays file icon, name, file size, and "Change" button once a valid file is selected.
- **Form Fields**:
  - **Title** (Required, text input, auto-filled from filename).
  - **Subject** (Required, text input, e.g., "DBMS").
  - **Topic** (Optional, text input).
  - **Folder** (Optional, text input, defaults to "General").
- **Alert Banners**: Alert messages for unsupported file formats, size cap (>20MB) violations, or server errors.
- **Action Footer**: Cancel button and primary "Upload Document" button displaying a rotating spinner during network transmission.

### 3.5 Document Viewer Modal ([DocumentViewerModal.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/DocumentViewerModal.jsx))
- **Layout**: Two-column modal layout.
- **Left Column (Preview)**:
  - Embeds native browser PDF viewer iframe (`<iframe src={`${fileUrl}#toolbar=0`} />`) for PDF files.
  - Displays file icon placeholder with "Open Document File" button for non-PDF file formats (PPT, DOC, TXT, MD).
- **Right Column (Metadata Panel)**:
  - Details list displaying Subject, Topic, Folder, File Size formatted (KB/MB), Uploaded Date, and Processing Status badge (`uploaded`, `processing`, `ready`, `failed`).
  - Quick action buttons: **Open in Tab**, **Download**, and **Delete**.

### 3.6 Auth Cards & Forms ([LoginForm.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/auth/LoginForm.jsx), [SignupForm.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/auth/SignupForm.jsx))
- Centered glassmorphic card with brand logo header.
- Form fields with left-aligned icons (`Mail`, `Lock`, `User`) and password visibility toggle (`Eye` / `EyeOff`).
- Accent submit buttons with loading spinner during submission.
- Alert error banners with `AlertCircle` icons.

---

## 4. Forms & Interactive Elements

| Form / Component | Interactive Control | Validation / State Behavior |
|---|---|---|
| `LoginForm` | Email & Password inputs | Disables submit when submitting; displays inline alert banner on invalid credentials |
| `SignupForm` / `Register` | Full Name, Email, Password, Confirm Password | Validates email regex, min 8 char password, and password equality before API submit |
| `UploadModal` | Drag-and-drop & file picker | Validates file extension whitelist and 20MB max size; autofills title |
| `Profile` | Name & Avatar picker | Supports 5 preset avatar selection buttons or custom URL string |
| `Profile` (Security) | Password update fields | Verifies non-empty fields, min 8 length, and password match |

---

## 5. Responsive Behavior

- **Desktop View (>1024px)**: Full dual-column dashboard layout with persistent sidebar width (`260px` to `300px`).
- **Tablet / Mobile View (<768px)**:
  - Sidebar collapses off-screen left (`transform: translateX(-100%)`).
  - Hamburger mobile menu button (`Menu` icon) rendered at top left toggles sidebar overlay drawer.
  - Semi-transparent backdrop overlay covers main area when mobile sidebar drawer is open.
  - Modals adapt to single-column vertical layout on narrow viewports.
