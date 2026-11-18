# AI Agent Instructions for AI-KMS

Welcome to the **AI-KMS (AI Knowledge Management System)** repository. This document serves as the central entry point and operating manual for AI agents and human contributors working within this codebase.

> [!IMPORTANT]
> **MANDATORY PROTOCOL FOR ALL AI AGENTS:**
> 1. **DO NOT scan or read the entire codebase blindly.** Grepping or reading files indiscriminately is strictly prohibited.
> 2. **ALWAYS read documentation first** before touching any code. Start with [`docs/06_Project_Management/PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md).
> 3. Based on the documentation, identify the specific component, route, controller, or model file responsible for your task and inspect **ONLY** those files.
> 4. Make minimal, surgical changes adhering to existing patterns.
> 5. **Update documentation IMMEDIATELY every single time** you make a change.
> 6. **Clean Technical Debt**: When a known issue is resolved, completely delete it from [`PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md) instead of keeping it marked as "Resolved".

---

## 1. Project Overview

**AI-KMS** is an intelligent personal knowledge workspace that transforms static learning materials (PDFs, PPTs, DOCX, TXT, MD) into an interactive study companion. It provides:
- **Universal Multi-format Ingestion**: Parsing, sanitizing, and storing lecture slides and textbooks up to 20MB.
- **Dynamic Curriculum & Topic Extraction**: Universal AI-powered topic extraction mapping uploaded study materials into hierarchical chapters and subtopics.
- **Context-Grounded RAG AI Chat**: Conversational engine powered by Google Gemini 2.5 Flash grounded in semantic chunks indexed in ChromaDB vector database.
- **Learning Dashboard**: Real-time study analytics, subject cards, topic checklists with optimistic updates, and cascade wipe subject management.
- **Interactive Revision Deck**: 3D perspective flip flashcards with spaced repetition and AI card generation.
- **AI Assessment & Quizzes**: Timed 4-option MCQ assessments with instant scoring, attempt history, and explanations.

---

## 2. Project Directory Structure

```text
ai-kms/
│
├── .agents/                               # AI agent rules and workflow specifications
│   ├── rules/
│   │   ├── project-rules.md               # Core constraints, architectural principles & user mandates
│   │   ├── coding-standards.md            # Naming conventions, security, frontend/backend quality
│   │   └── documentation-rules.md         # Source of truth rules, doc map & update protocols
│   │
│   └── workflows/
│       ├── feature-development.md         # 8-step lifecycle for building new features
│       ├── bug-fixing.md                  # 7-step lifecycle for diagnosing & resolving bugs
│       └── code-refactoring.md            # 7-step safe refactoring lifecycle
│
├── Backend/                               # Node.js + Express 5 REST API service
│   ├── uploads/                           # Local filesystem storage for uploaded files
│   └── src/
│       ├── config/                        # Database configuration (Mongoose connection)
│       ├── controllers/                   # Express controllers (auth, docs, knowledge, progress, quiz, flashcards)
│       ├── middleware/                    # JWT auth, error handlers, Multer file upload
│       ├── models/                        # Mongoose schemas (User, Document, Progress, Flashcard, Quiz)
│       ├── repositories/                  # Data access layer
│       ├── routes/                        # Express router definitions
│       ├── services/                      # Document processing, chunking, ChromaDB, Gemini LLM
│       ├── utils/                         # Token generator, nodemailer email sender
│       └── index.js                       # Express app entry point
│
├── Frontend/                              # React 19 Single Page Application (Vite 8)
│   └── src/
│       ├── api/                           # Axios API service instances with JWT interceptors
│       ├── components/                    # Modular UI components (auth, common, dashboard)
│       ├── context/                       # React Context providers (AuthContext)
│       ├── layouts/                       # Layout shells (AppLayout with Sidebar & Modals, AuthLayout)
│       ├── pages/                         # Route views (Dashboard, Chat, Notes, Quiz, Flashcards, Login, Signup)
│       ├── styles/                        # Modular vanilla CSS stylesheets (dark-mode tokens)
│       └── App.jsx                        # App shell and React Router tree
│
├── docs/                                  # Project Documentation (Authoritative Source of Truth)
│   ├── 01_Product/
│   │   ├── PRD.md                         # Product Requirements Document
│   │   └── ROADMAP.md                     # Product Roadmap & Phase Milestones
│   │
│   ├── 02_Architecture/
│   │   ├── SYSTEM_ARCHITECTURE.md         # System Architecture & Component Interactions
│   │   └── APP_FLOW.md                    # Detailed User Journeys & Application Flow
│   │
│   ├── 03_Design/
│   │   └── UI_UX.md                       # Design System, Component Specs & Layouts
│   │
│   ├── 04_Technical/
│   │   ├── TECH_STACK.md                  # Comprehensive Technology Stack & Constraints
│   │   ├── DATABASE_SCHEMA.md             # Mongoose Models, Schemas & Validation
│   │   ├── API_REFERENCE.md               # Complete REST API Reference
│   │   └── BACKEND_TESTING.md             # Automated Vitest & Supertest Testing Architecture
│   │
│   ├── 05_Development/
│   │   └── IMPLEMENTATION_PLAN.md         # Implementation Roadmap & Milestone Steps
│   │
│   ├── 06_Project_Management/
│   │   └── PROJECT_STATUS.md              # Living Project Status & Master Tracker
│   │
│   └── 07_Decisions/
│       └── ADR/                           # Architecture Decision Records
│
├── AGENTS.md                              # This file: AI agent entry point & guidelines
├── .gitignore                             # Git ignore rules
└── README.md                              # Public project overview & quickstart guide
```

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, React Router DOM 7, Lucide React icons, Modular Vanilla CSS |
| **Backend** | Node.js (ES Modules), Express.js 5, Mongoose 9, Multer 2, Nodemailer 10, bcryptjs |
| **Database** | MongoDB (`mongodb://127.0.0.1:27017/aikms`) |
| **AI / RAG** | Google Gemini 2.5 Flash, ChromaDB vector store, semantic recursive chunker |
| **Authentication** | JSON Web Tokens (JWT) with Bearer token authentication & localStorage sync |

---

## 4. Documentation Map & Navigation

Before undertaking any task, consult the appropriate documentation file:

- **Product Vision & Requirements**: [`docs/01_Product/PRD.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/01_Product/PRD.md)
- **Phase Milestones & Roadmap**: [`docs/01_Product/ROADMAP.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/01_Product/ROADMAP.md)
- **System Architecture & Data Flows**: [`docs/02_Architecture/SYSTEM_ARCHITECTURE.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/02_Architecture/SYSTEM_ARCHITECTURE.md)
- **User Navigation & Journeys**: [`docs/02_Architecture/APP_FLOW.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/02_Architecture/APP_FLOW.md)
- **UI Design System & Component Specs**: [`docs/03_Design/UI_UX.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/03_Design/UI_UX.md)
- **Tech Stack & Environment Details**: [`docs/04_Technical/TECH_STACK.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/04_Technical/TECH_STACK.md)
- **Database Models & Schemas**: [`docs/04_Technical/DATABASE_SCHEMA.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/04_Technical/DATABASE_SCHEMA.md)
- **Backend API Endpoints**: [`docs/04_Technical/API_REFERENCE.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/04_Technical/API_REFERENCE.md)
- **Backend Testing Architecture**: [`docs/04_Technical/BACKEND_TESTING.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/04_Technical/BACKEND_TESTING.md)
- **Implementation Sequence**: [`docs/05_Development/IMPLEMENTATION_PLAN.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/05_Development/IMPLEMENTATION_PLAN.md)
- **Living Project Status**: [`docs/06_Project_Management/PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md)
- **Architecture Decision Records**: [`docs/07_Decisions/ADR/`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/07_Decisions/ADR/)

---

## 5. AI Development Rules Location

Rules are located in `.agents/rules/` and are automatically discovered by Antigravity:
1. [`project-rules.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/.agents/rules/project-rules.md): Core restrictions, user mandates, minimal change principle, source of truth.
2. [`coding-standards.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/.agents/rules/coding-standards.md): Naming standards, folder structure, React 19 and Express 5 quality requirements.
3. [`documentation-rules.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/.agents/rules/documentation-rules.md): When and how documentation must be updated, cleanup rules for resolved issues.

---

## 6. How to Approach New Features

Follow the dedicated workflow in [`.agents/workflows/feature-development.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/.agents/workflows/feature-development.md):
1. **Understand Task**: Confirm requirements and avoid inventing unrequested features.
2. **Read Docs First**: Check [`docs/06_Project_Management/PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md) and relevant technical docs.
3. **Inspect Targeted Files**: Read ONLY the specific controller, model, route, or component files involved.
4. **Plan & Implement**: Make minimal, non-breaking additions adhering to coding standards.
5. **Verify & Test**: Check backend syntax (`node --check`) and verify frontend build (`npm run build --prefix Frontend`).
6. **Update Documentation**: Update [`docs/06_Project_Management/PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md) and relevant technical specs.

---

## 7. How to Approach Bug Fixes

Follow the dedicated workflow in [`.agents/workflows/bug-fixing.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/.agents/workflows/bug-fixing.md):
1. **Understand & Reproduce**: Determine the failure condition and locate the error trace.
2. **Trace Root Cause**: Inspect only the responsible file identified via documentation.
3. **Apply Minimal Fix**: Fix the root cause with the smallest surgical change necessary.
4. **Regression Testing**: Verify the fix does not break related views or API callers.
5. **Clean Technical Debt**: If the issue was recorded in [`docs/06_Project_Management/PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md), **completely delete it from the Known Issues list**.

---

## 8. How to Modify Existing Functionality / Refactor

Follow the dedicated workflow in [`.agents/workflows/code-refactoring.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/.agents/workflows/code-refactoring.md):
1. **Justify Change**: Refactor only when there is a concrete code smell, performance issue, or duplication.
2. **Preserve External Behavior**: Ensure component props, API contracts, and event payloads remain 100% backward compatible.
3. **Incremental Changes**: Make atomic, verifiable modifications.
4. **Verification**: Run `npm run build --prefix Frontend` and `node --check` to ensure zero compilation or syntax breaks.

---

## 9. Documentation Update Requirements

- **Mandatory on Every Turn**: Every single change made to source code must be reflected in documentation within the same turn.
- **Never Claim Unimplemented Features as Completed**: A feature is complete only after code is written, builds pass, and behavior is verified.
- **Strict Issue Removal**: Whenever a known issue is fixed, remove it entirely from [`PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md).

---

## 10. Testing Requirements

- **Backend Syntax Validation**: `node --check <modified_file.js>`
- **Frontend Production Build**: `npm run build --prefix Frontend` (must pass with 0 errors)
- **Clean Git Tracking**: Avoid leaving untracked temporary files or modifying unrelated source code.

---

## 11. Antigravity Environment & Instruction Compatibility

Antigravity natively discovers and loads:
- **`AGENTS.md`**: Loaded as top-level workspace rules.
- **`.agents/rules/*.md`**: Loaded automatically with `trigger: always_on` frontmatter.
- **`.agents/workflows/*.md`**: Referenced on-demand by agents for specific development workflows.

