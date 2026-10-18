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

### 2.2 Workspace Layout ([Dashboard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Dashboard.jsx))
- **Structure**: Split-screen two-column layout.
- **Left Column**: Collapsible navigation sidebar ([Sidebar.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/Sidebar.jsx)) containing document list, subject links, and upload triggers.
- **Right Column**: Dynamically renders active tab content:
  - **AI Chat Workspace**: Conversational RAG interface ([ChatWindow.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/ChatWindow.jsx) + [ChatInput.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/ChatInput.jsx)).
  - **Learning Dashboard**: Comprehensive curriculum and progress overview ([DashboardOverview.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/DashboardOverview.jsx)) featuring Overview KPI stats, Subject cards, Hierarchical Topic & Subtopic Progress Accordions, Learning Progress breakdown, and Recent Study Activity feeds.

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

### 3.7 Learning Dashboard Overview ([DashboardOverview.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/DashboardOverview.jsx))
- **Hero & Quick Actions**: Top header displaying active curriculum status, "+ Add Subject", "Upload Notes", "Reset Defaults", and "Refresh" quick action triggers.
- **KPI Overview Cards ([OverviewStats.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/OverviewStats.jsx))**:
  - Total Subjects counter with folder badge.
  - Total Topics & Subtopics indexed.
  - Completed Topics count with checkmark.
  - Overall Learning Progress % with visual progress indicator.
  - Uploaded Documents count.
- **Learning Progress Distribution ([LearningProgressSection.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/LearningProgressSection.jsx))**:
  - Horizontal multi-colored progress bar depicting proportional completion across subjects.
  - Subject breakdown legend with completion percentages.
- **Recent Activity Section ([RecentActivitySection.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/RecentActivitySection.jsx))**:
  - Chronological activity timeline with event type icons (`CheckCircle2`, `BookOpen`, `UploadCloud`).
  - Relative humanized timestamps (e.g. "Just now", "2 hours ago").

### 3.8 Subject Cards Grid ([SubjectCard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/SubjectCard.jsx))
- **Card Design**: Clean obsidian card with subtle glowing colored accent border and icon pill.
- **Card Content**:
  - Subject Name & Course Code.
  - Document count badge tag (e.g. `1 document`, `0 documents`).
  - Progress percentage and completion fraction (`X / Y topics completed`).
  - Custom CSS progress bar filled with the subject's theme color.
  - "Study with AI" button that launches the RAG chat workspace scoped to this subject.
  - Entire card click triggers the Subject Detail Modal.

### 3.9 Hierarchical Subject Detail Modal ([SubjectDetailModal.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/SubjectDetailModal.jsx))
- **Header Section**:
  - Subject Title with inline rename pencil button (`Pencil` icon); clicking switches to an inline text input with checkmark save and X cancel buttons, persisting to the backend and updating all linked documents and dashboard cards.
  - Theme color pill, percentage completed highlight, and linked document counter.
  - High-precision progress bar header filled with the subject's theme color.
- **Sidebar Actions**:
  - "Study with AI" primary call-to-action button (`Sparkles` icon).
  - "Delete Subject" danger action button (`Trash2` icon) placed directly below the "Study with AI" button.
- **GitHub-Style Delete Confirmation Modal**:
  - When "Delete Subject" is clicked, an isolated high-safety mini confirmation modal opens with a blurred backdrop.
  - Displays a warning banner: *"Warning: This action cannot be undone. This will permanently delete the curriculum and reset your study progress."*
  - Requires the user to type the exact subject name (e.g. `General` or `DBMS`) into a focused input box.
  - The destructive "I understand, delete this subject" button remains disabled until the typed text strictly matches the subject name.
  - Upon deletion, unlinks associated documents to prevent automatic subject re-creation and closes the modal cleanly.
- **Hierarchical Accordion Structure**:
  - **Parent Chapter Rows**:
    - Expand / Collapse chevron toggle (`ChevronDown` / `ChevronRight`).
    - Chapter Title (e.g., `1. All about DBMS`, `2. Database Architecture`).
    - Completion pill showing child progress (e.g., `3 of 5 subtopics completed`).
    - Parent checkbox that toggles all child subtopics simultaneously.
  - **Child Subtopic Rows**:
    - Indented subtopic list connected by a subtle visual vertical line guide.
    - Custom square checkbox with checkmark animation.
    - Subtopic name (e.g., `Key Features of DBMS`, `Database Languages`).
    - Strikethrough and muted text style when completed.
    - Real-time optimistic update and backend sync on click.
- **Inline Topic Builder**:
  - Expandable form with "+ Add Topic" button.
  - Topic type selector dropdown: "Top-level Parent Chapter" or select an existing chapter to nest the new topic as a "Child Subtopic".
  - Text input for topic name with submit button.

### 3.10 Create Subject Modal ([CreateSubjectModal.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/CreateSubjectModal.jsx))
- Subject Name (Required).
- Course Code & Description (Optional).
- Theme Color Picker with 5 curated presets (`Emerald`, `Sky`, `Purple`, `Amber`, `Rose`).
- Optional custom topics chip list.
- Automatically initializes with zero dummy topics, ready for automatic document extraction.

---

## 4. Forms & Interactive Elements

| Form / Component | Interactive Control | Validation / State Behavior |
|---|---|---|
| `LoginForm` | Email & Password inputs | Disables submit when submitting; displays inline alert banner on invalid credentials |
| `SignupForm` / `Register` | Full Name, Email, Password, Confirm Password | Validates email regex, min 8 char password, and password equality before API submit |
| `UploadModal` | Drag-and-drop & file picker | Validates file extension whitelist and 20MB max size; autofills title |
| `Profile` | Name & Avatar picker | Supports 5 preset avatar selection buttons or custom URL string |
| `Profile` (Security) | Password update fields | Verifies non-empty fields, min 8 length, and password match |
| `CreateSubjectModal` | Subject name, color presets, syllabus topics | Requires subject name; validates non-duplicate topics |
| `SubjectDetailModal` | Accordion toggles, Parent/Child checkboxes | Optimistic checkbox toggle with instant stats calculation; filters by All/Pending/Completed |

---

## 5. Responsive Behavior

- **Desktop View (>1024px)**: Full dual-column dashboard layout with persistent sidebar width (`260px` to `300px`).
- **Tablet / Mobile View (<768px)**:
  - Sidebar collapses off-screen left (`transform: translateX(-100%)`).
  - Hamburger mobile menu button (`Menu` icon) rendered at top left toggles sidebar overlay drawer.
  - Semi-transparent backdrop overlay covers main area when mobile sidebar drawer is open.
  - Modals adapt to single-column vertical layout on narrow viewports.
