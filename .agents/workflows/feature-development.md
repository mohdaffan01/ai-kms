# Workflow: Feature Development

## Objective
Provide a disciplined, step-by-step workflow for implementing new features in **AI-KMS** without causing regressions, bloated code, or documentation drift.

---

## The 8-Step Feature Lifecycle

```text
1. Understand Task
        │
        v
2. Read Rules & Instructions
        │
        v
3. Read Relevant Documentation
        │
        v
4. Inspect Targeted Code (Never Scan Entire Codebase)
        │
        v
5. Plan Implementation & Changes
        │
        v
6. Implement Minimal, High-Quality Code
        │
        v
7. Test & Verify (Build & Syntax Checks)
        │
        v
8. Update Documentation Immediately (Docs First)
```

---

### Step 1: Understand the Task
- Parse the user's requirements thoroughly.
- Identify the core capability being requested (e.g. new export option, new filter chip, new assessment type).
- Clarify any ambiguities upfront rather than making unsupported assumptions.

### Step 2: Read Rules & Instructions
- Review `.agents/rules/project-rules.md` for architectural constraints.
- Review `.agents/rules/coding-standards.md` for naming, folder structure, and security patterns.
- Review `.agents/rules/documentation-rules.md` for doc requirements.

### Step 3: Read Relevant Documentation
- Read [`docs/06_Project_Management/PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md) to locate the current implementation state.
- Check [`docs/01_Product/PRD.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/01_Product/PRD.md) to understand product requirements and user expectations.
- If modifying UI, check [`docs/03_Design/UI_UX.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/03_Design/UI_UX.md) and [`docs/02_Architecture/APP_FLOW.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/02_Architecture/APP_FLOW.md).
- If modifying APIs or Database, check [`docs/04_Technical/API_REFERENCE.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/04_Technical/API_REFERENCE.md) and [`docs/04_Technical/DATABASE_SCHEMA.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/04_Technical/DATABASE_SCHEMA.md).

### Step 4: Inspect Targeted Code
- Identify **ONLY** the specific files responsible for the feature based on the documentation.
- **NEVER** recursively scan or grep across the whole codebase.
- Read only the targeted components, controllers, routes, or models.

### Step 5: Plan Implementation & Changes
- Outline the minimal edits required across backend and frontend.
- Check for dependency impacts (e.g. does adding a parameter break existing callers?).
- Formulate an implementation sequence (e.g., Mongoose schema -> Backend controller/route -> Frontend API client -> React UI component).

### Step 6: Implement Minimal, High-Quality Code
- Follow the Minimal Change Principle.
- Reuse existing utilities (e.g., `generateToken.js`, `authApi.js`, `TopicCheckbox`).
- Apply proper error handling, logging, and input sanitization.
- Ensure ES Module syntax in Backend and pure functional React 19 standards in Frontend.

### Step 7: Test & Verify
- Backend verification: `node --check <modified_file.js>` for syntax integrity.
- Frontend verification: `npm run build --prefix Frontend` to ensure zero Vite compilation or Rollup bundling errors.
- Verify functional expectations and check for unintended side effects on existing features.

### Step 8: Update Documentation Immediately
- Update [`docs/06_Project_Management/PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md) to record the completed feature with clickable file links.
- Update technical docs ([`API_REFERENCE.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/04_Technical/API_REFERENCE.md), [`DATABASE_SCHEMA.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/04_Technical/DATABASE_SCHEMA.md), [`UI_UX.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/03_Design/UI_UX.md)) if schemas, routes, or UI components changed.
- Prepare a clean summary response following the documentation rules protocol.

