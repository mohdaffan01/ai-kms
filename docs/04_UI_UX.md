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

### 2.0 Zero-Flash Native Preloader & App Splash Screen ([index.html](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/index.html), [AppSplashScreen.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/common/AppSplashScreen.jsx))
- **Zero-Flash Dark Baseline**: `index.html` embeds inline dark styling (`background-color: #171717`) in `<head>` preventing browser white blank page flashes on initial load and slow networks (3G/4G).
- **0ms Native Preloader**: Renders official AiKMS logo (`logo-128.png`), glowing green aura, and progress track inside `#root` before JavaScript bundles parse.
- **React AppSplashScreen**: Smooth startup brand animation displaying floating official AiKMS emerald logo (`#10a37f`), glowing halo, and animated progress bar, transitioning out with a 350ms graceful fade.

### 2.1 Brand Identity & Official Logo ([Logo.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/common/Logo.jsx))
- **Official Brand Mark**: Minimalist human profile outline with an emerald green (`#10a37f`) knowledge ribbon/infinite brain loop symbol inside, seamlessly rendered across authentication headers, splash screen, sidebar, and browser favicon (`/favicon.png`).
- **Brand Typography**: High-contrast crisp white `Ai` + neon emerald `KMS`.
  - **Navigation Links** (when logged in): **Dashboard** tab link, **Profile** tab link.
  - **User Badge**: Circular vector user avatar badge with emerald accent (`User` from Lucide), displaying user first name.
  - **Logout Button**: Red/muted icon button triggering session cleanup and redirecting to `/login`.

### 2.2 Workspace Layout & First-Class Path Routing ([Dashboard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Dashboard.jsx), [App.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/App.jsx))
- **Standard Clean Path Architecture**: All core study modules are mapped to clean browser paths:
  - **Dashboard Overview**: `/dashboard`
  - **AI Chat Workspace**: `/chat`
  - **Study Notes Vault**: `/notes`
  - **Quiz Assessment**: `/quiz`
  - **Flashcards Deck**: `/flashcards`
  - **Authentication**: `/login` & `/signup`
- **Structure**: Split-screen two-column layout.
- **Left Column**: Collapsible navigation sidebar ([Sidebar.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/Sidebar.jsx)) containing document list, subject links, and upload triggers.
- **Right Column**: Dynamically renders active route view:
  - **AI Chat Workspace (`/chat`)**: Conversational RAG interface ([ChatWindow.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/ChatWindow.jsx) + [ChatInput.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/ChatInput.jsx)).
  - **Learning Dashboard (`/dashboard`)**: Comprehensive curriculum and progress overview ([DashboardOverview.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/DashboardOverview.jsx)) featuring Overview KPI stats, Subject cards, Hierarchical Topic & Subtopic Progress Accordions, Learning Progress breakdown, and Recent Study Activity feeds.
  - **Study Notes Vault (`/notes`)**: Complete document and note repository ([NotesView.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/NotesView.jsx)) featuring dynamic subject filter pills, real-time search, study card grid with metadata badges, instant PDF viewer modal, and direct "Ask AI" navigation.
  - **Smart Flashcards Workspace (`/flashcards`)**: 3D interactive revision card deck ([FlashcardsView.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/FlashcardsView.jsx)) with AI generation from completed topics, deck grid search, and keyboard shortcut navigation.
  - **Interactive Quiz Hub (`/quiz`)**: MCQ assessment engine ([QuizView.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/QuizView.jsx)) with timer, analytics, and instant feedback.

---

## 3. Important Components & Interactivity

### 3.1 Sidebar Component ([Sidebar.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/Sidebar.jsx))
- **Brand Header & Click-to-Collapse**: Compact logo displaying "AiKMS" with official logo badge (`logo-128.png`) and `PanelLeftClose` toggle button. Features interactive `cursor: pointer` with emerald glow on hover; clicking the logo toggles sidebar between expanded and collapsed modes (state persisted in `localStorage` as `aikms_sidebar_collapsed`).
- **Collapsible Mini-Rail Mode (68px width)**:
  - Shrinks width smoothly with `transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1)`.
  - Centers all module actions (`+ New Chat`, `Chat`, `Dashboard`, `Notes`, `Quiz`, `Flashcards`) into 44px icon buttons with tooltips.
  - Places the quick upload button (`.btn-upload-content-collapsed`) directly inside the top action rail alongside Flashcards for a tight, consistent layout without empty vertical gaps.
  - Stacks user avatar badge and logout button cleanly at the footer (redundant bottom expand button eliminated since the top logo seamlessly controls toggle).
  - Hides the draggable `.sidebar-resizer` handle and documents accordion while collapsed.
- **Action & Navigation Buttons**:
  - **`+ New Chat` Button**: Modern squircle action button (`border-radius: 11px`) styled with a dual-stop teal gradient (`background: linear-gradient(135deg, rgba(20, 184, 166, 0.15) ...)`), inward specular light (`inset 0 1px 0 rgba(255, 255, 255, 0.08)`), and soft hover glow. Clicking resets conversation state.
  - **`Chat` Navigation Button**: Sleek modern nav button with `MessageSquare` icon, translucent surface, and subtle hover transition. Switches to active chat conversation without clearing messages (`/chat`).
  - **`Dashboard` Button**: Modern nav button with `LayoutDashboard` icon switching view to Curriculum Overview (`/dashboard`). Highlights with emerald gradient surface and crisp border when active.
  - **`Notes` Navigation Button**: Modern nav button with `FileText` icon switching view to the Notes study vault (`/notes`). Displays all study files, subject filters, and preview modals.
  - **Bluish Study Module Action Grid**: 2-column square button container styled with dashboard-inspired cyan/blue & indigo tones:
    - **Quiz Button (Left)**: Sky-blue themed card (`#38bdf8`) with `HelpCircle` icon, glowing hover state, and cyan active border launching AI Assessment hub (`/quiz`).
    - **Flashcards Button (Right)**: Indigo-blue themed card (`#818cf8`) with `Layers` icon, glowing hover state, and blue active border launching Spaced Revision workspace (`/flashcards`).
- **Content Section (Documents Drawer)**:
  - Collapsible accordion header with title, count badge, and animated chevron arrow. Expansion state is remembered in `localStorage` (`aikms_sidebar_docs_expanded`).
  - **Modern Upload Content Button**: Sleek dashed pill/squircle with subtle surface hover.
  - Folder grouping and scrollable document list item cards featuring file title, subject tag, quick view eye icon button, and delete garbage bin button.
- **Sidebar Resize Handle**: Custom draggable right edge (`.sidebar-resizer`) allowing user to adjust sidebar width between 220px and 520px (persisted in `localStorage` as `aikms_sidebar_width`).
- **User Footer**: Profile avatar badge, user name, user email, and profile flyout trigger with change password and logout options.
  - **User Profile Flyout ([UserProfileFlyout.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/UserProfileFlyout.jsx))**: Compact popover menu floating comfortably to the right of the sidebar (`left: calc(100% + 24px)`, `bottom: 12px`, `width: 308px`), with reduced vertical padding, 40px avatar, and balanced stats/actions list to avoid overcrowding the sidebar border.

### 3.2 Chat Window & Scope Bar ([ChatWindow.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/ChatWindow.jsx), [Dashboard.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/Dashboard.jsx))
- **Chat Scope Bar**: Context bar above the conversation feed featuring a dropdown selector:
  - **All Documents (Default)**: Searches across all indexed PDF materials with auto-search globe icon.
  - **Specific Document**: Filters context down strictly to a selected document file with subject tag badge.
  - **Reset to All**: Reset button appearing whenever a single document is selected.
- **Empty State**: Centered welcome screen featuring a large glowing Brain icon, "Welcome to AiKMS" heading, and subtitle instruction ("Ask anything from your uploaded PDF learning materials.").
- **Message Stream**: Vertical feed with smooth auto-scroll to bottom.
  - **User Row**: Right-aligned distinct bubble displaying user icon and message text.
  - **AI Row**: Left-aligned bubble featuring Brain icon avatar, sender label ("AiKMS Assistant"), listen/stop voice synthesis toggle button, and markdown response text.
  - **Chat Session Persistence**: Messages stay synced in `sessionStorage` (`aikms_active_chat_messages`) during tab switches and page refreshes.

### 3.3 Chat Input ([ChatInput.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/ChatInput.jsx))
- **Input Textarea**: Auto-expanding single-row textarea with placeholder ("Ask anything about your study material...").
- **Keyboard Shortcut**: Submits on `Enter` key (without `Shift`).
- **Send Button**: Circular icon button with `Send` icon, disabled when input string is empty or whitespace.
- **Footer Disclaimer**: Micro text ("AiKMS Demo Workspace • RAG-based AI answer model will be enabled in Module 2").

### 3.4 Upload Content Modal ([UploadModal.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/UploadModal.jsx))
- **Overlay & Modal Stacking**: Darkened backdrop dismissing modal on click. Configured with elevated `z-index: 2000` so that triggering file uploads directly from inside `SubjectDetailModal` (`z-index: 1000`) renders the upload window comfortably on top without getting obscured behind the subject view.
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
- **Shimmer Skeleton Loading State ([DashboardSkeleton.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/DashboardSkeleton.jsx))**: High-fidelity dark skeleton with smooth CSS shimmer wave sweep (`.aikms-shimmer-sweep`) rendered during initial dashboard data loading, exactly matching the 3-section layout (5 Overview cards, 3 Vault cards, and Learning Progress cards).
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

### 3.11 Smart Flashcards Component ([FlashcardsView.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/components/dashboard/FlashcardsView.jsx))
- **Study Mode (3D Interactive Flip Deck)**:
  - 3D card flipping scene with CSS `perspective: 1200px` and `preserve-3d` transforms.
  - Front face displaying question prompt, subject/topic badges, difficulty tag (`Easy` / `Medium` / `Hard`), and collapsible hint box.
  - Back face displaying comprehensive conceptual explanation, key formulas, and terms.
  - Controls bar: Previous card, Flip card, Next card, Shuffle deck, Mark as Mastered (green accent), and Mark as Learning (amber accent).
  - Keyboard navigation: `Space` (flip), `←`/`→` (navigate), `1` (needs practice), `2` (mastered).
  - Deck completion celebration screen displaying mastery score with restart options.
- **Deck Grid Mode**:
  - Filterable card grid view with real-time text search.
  - Quick-action buttons for delete and mastery state toggle.
- **AI Generator Modal**:
  - Automatically loads and highlights completed topics from user's `Progress` document.
  - Options to generate cards from "All Completed Topics" or a "Specific Topic".
  - Generates 2-15 flashcards via Gemini LLM with automatic text fallback.

### 3.12 Minimalist 404 & Backend Disconnection Error Screen ([NotFound.jsx](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/pages/NotFound.jsx), [not-found.css](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Frontend/src/styles/not-found.css))
- **Design Philosophy**: Minimalist, clean, editorial dark theme matching modern high-end web applications (inspired by minimalist layout demo).
- **Visual Composition**:
  - **Dark Base Canvas**: Pure obsidian dark theme (`#0d0f14`) with crisp text contrast (`#f8fafc`).
  - **Architectural Background Columns**: 5 faint vertical guide lines (`rgba(255, 255, 255, 0.035)`) adding subtle depth without visual clutter.
  - **Giant Watermark Number**: Huge faint `404` or `503` watermark (`clamp(14rem, 30vw, 26rem)`, `rgba(255, 255, 255, 0.04)`) layered directly behind the foreground text.
  - **Centered Editorial Typography**: Clean heading ("Page Not Found" / "Backend Disconnected") with elegant line-height and subdued subtitle (`#94a3b8`).
- **Pill-Shaped Action Buttons**:
  - **Primary Solid Pill (Left)**: Solid dark pill (`border-radius: 9999px`) with hover elevation and directional arrow (`Go to Dashboard →` or `Retry Connection →`).
  - **Secondary Outlined Pill (Right)**: Translucent glass pill (`border-radius: 9999px`, `border: 1px solid rgba(255, 255, 255, 0.25)`) routing to home (`Go Home`).
- **Subtle Live Health Status**: Minimal pill indicator with pulsing status dot (`● Server Online` in emerald, `● Checking...` in amber, or `● Server Unreachable` in crimson) displayed non-intrusively in offline mode.

---

## 4. Forms & Interactive Elements

| Form / Component | Interactive Control | Validation / State Behavior |
|---|---|---|
| `LoginForm` | Email & Password inputs | Disables submit when submitting; displays inline alert banner on invalid credentials |
| `SignupForm` / `Register` | Full Name, Email, Password, Confirm Password | Validates email regex, min 8 char password, and password equality before API submit |
| `UploadModal` | Drag-and-drop & file picker | Validates file extension whitelist and 20MB max size; autofills title |
| `Profile` | Name & Security settings | Name updating and secure password change with emerald vector user badge |
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
