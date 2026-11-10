---
trigger: always_on
---

# Project Rules & Architectural Principles

## 1. Purpose & Core Mandate
This file defines the overarching rules, architectural principles, and development restrictions that every AI agent and contributor must follow when working on **AI-KMS (AI Knowledge Management System)**.

The documentation inside `docs/` is the authoritative primary source of truth for the project. No agent or developer may make architectural or implementation changes based on assumptions or isolated code inspection.

---

## 2. Mandatory Protocol: Read Docs First — Never Scan Entire Codebase Blindly

> [!IMPORTANT]
> **STRICT USER MANDATE:**
> 1. **DO NOT read or scan the entire codebase blindly.** Grepping, recursive directory listing, or reading across arbitrary files without checking documentation first is strictly forbidden.
> 2. **ALWAYS read the documentation in `docs/` FIRST** before touching any code.
> 3. Start by reading [`PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md) to understand the current implementation state.
> 4. Based on the documentation, identify **EXACTLY** which component, route, controller, service, or model file is responsible for the task.
> 5. Read **ONLY** those specific, targeted files.
> 6. Formulate and implement the minimal required change.
> 7. **EVERY SINGLE TIME a change is made, IMMEDIATELY update the relevant `docs/` files** (especially [`PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md) and related technical docs) so documentation stays 100% accurate.
> 8. **Resolved Issues Cleanup**: In [`PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md) under "Known Issues & Technical Debt", when an issue is resolved, **completely remove/delete it from the list** instead of retaining it marked as "Resolved".
> 9. This protocol is permanent and must be followed on every single task without reminders.

---

## 3. Source of Truth Principles

The documentation in `docs/` represents the project's source of truth.

When source code and documentation disagree:
1. Do not blindly choose one over the other.
2. Inspect the specific implementation file to determine ground reality.
3. Determine whether the code or documentation is outdated.
4. Preserve working functionality unless a change is explicitly requested by the user.
5. Update the relevant documentation when the actual project state changes.
6. Never silently ignore a conflict between documentation and code.

---

## 4. Minimal Change Principle

Make the smallest change necessary to complete the task accurately and reliably.

The AI MUST NOT:
- Rewrite working code unnecessarily.
- Refactor unrelated components, controllers, or utilities.
- Alter application architecture without a concrete requirement.
- Introduce unnecessary third-party dependencies or external packages.
- Rename files, folders, API endpoints, or database fields without explicit necessity.
- Remove or degrade existing features without user approval.
- Modify unrelated features while working on a targeted task.

---

## 5. Preserve Existing Functionality

When implementing new features or resolving bugs:
- **Zero Regressions**: Existing functionality must continue to work without interruption.
- **Backward Compatibility**: Existing API routes, parameters, and response structures should remain compatible unless a breaking change is explicitly required.
- **Data Safety**: Existing database data in MongoDB and vector embeddings in ChromaDB must not be corrupted or wiped casually.
- **UI Continuity**: Existing UI behavior, layouts, and UX patterns should be preserved unless explicitly targeted for redesign.

---

## 6. Architecture & Technology Constraints

AI-KMS operates on a strict, decoupled Client-Server architecture:
- **Frontend**: Single Page Application built with React 19, Vite, React Router DOM 7, and Lucide React icons. Styled with modular vanilla CSS (no CSS-in-JS, Tailwind, or component libraries).
- **Backend**: RESTful API service built on Node.js ES Modules with Express 5, Mongoose 9, Multer for disk uploads, Nodemailer for transactional emails, and JWT for session management.
- **AI & RAG Engine**: Retrieval-Augmented Generation utilizing Google Gemini 2.5 Flash (`@google/genai` / REST) grounded in semantic chunks stored in ChromaDB vector database.
- **Database**: MongoDB instance managing collections: `users`, `documents`, `progress`, `flashcards`, `quizzes`.

### Architectural Rules:
1. **No Casual Architecture Swaps**: Never swap databases, vector engines, CSS frameworks, or runtime versions without an approved Architecture Decision Record (ADR) in `docs/07_Decisions/ADR/`.
2. **Consult Architecture Docs First**: Any change affecting system layers must be verified against [`SYSTEM_ARCHITECTURE.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/02_Architecture/SYSTEM_ARCHITECTURE.md) and [`TECH_STACK.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/04_Technical/TECH_STACK.md).
3. **Hardware / Host Boundaries**: Default backend runs on port 3000, Vite dev server on port 5173, MongoDB on port 27017, and ChromaDB locally. Keep environment configurations centralized in `.env` files.

---

## 7. Consistency and Requirement Changes

1. **Do Not Invent Requirements**: The AI must not invent unrequested product features, business rules, database fields, or API endpoints. If details are ambiguous:
   - Check existing code and existing documentation.
   - Infer only when intent is obvious and aligns with established patterns.
   - For material decisions affecting architecture or data, ask the user for clarification before acting.
2. **Handling Requirement Changes**: When user requirements evolve:
   - Identify all affected documentation in `docs/`.
   - Update documentation to reflect the new direction.
   - Check existing code for inconsistencies and update code accordingly.
   - Update [`PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md) immediately.
   - Never leave contradictory documentation behind.

