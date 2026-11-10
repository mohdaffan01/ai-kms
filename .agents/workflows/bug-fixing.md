# Workflow: Bug Fixing

## Objective
Provide a systematic, disciplined methodology for triaging, diagnosing, fixing, and verifying bug reports in **AI-KMS**, ensuring zero regressions and immediate documentation synchronization.

---

## The 7-Step Bug Fixing Lifecycle

```text
1. Understand Bug Report
        │
        v
2. Reproduce the Issue / Failure Condition
        │
        v
3. Identify Root Cause (Targeted Inspection)
        │
        v
4. Inspect Dependencies & Call Sites
        │
        v
5. Apply Minimal Fix
        │
        v
6. Test & Regression Verification
        │
        v
7. Update Documentation & Clean Technical Debt
```

---

### Step 1: Understand Bug Report
- Analyze the user's description, screenshots, or error logs.
- Identify the affected subsystem (e.g. Auth, Upload, Progress Checkbox, Flashcards, Quiz, RAG Chat).
- Note expected vs. actual behavior.

### Step 2: Reproduce the Issue
- Trace the sequence of user actions or API requests leading to the failure.
- If an error trace is provided (e.g., Axios 404, Mongoose cast error, undefined property access), locate the exact failing line.

### Step 3: Identify Root Cause
- Consult [`docs/06_Project_Management/PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md) and [`docs/02_Architecture/APP_FLOW.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/02_Architecture/APP_FLOW.md) to pinpoint the exact responsible file.
- Inspect **ONLY** the relevant file (controller, route, component, or model). Do not scan the codebase blindly.
- Distinguish symptom from root cause (e.g., is a component failing because of an unhandled null prop or because the backend returned a 404?).

### Step 4: Inspect Dependencies & Call Sites
- Check where the failing function or component is called.
- Verify whether the fix could affect sibling components (e.g. changing an event payload or a Mongoose query condition).

### Step 5: Apply Minimal Fix
- Fix the problem at its true source with the smallest surgical change necessary.
- Preserve existing styling, error handling conventions, and data formats.
- Avoid broad refactoring while fixing a targeted bug.

### Step 6: Test & Regression Verification
- Run `node --check <file>` on modified backend files.
- Run `npm run build --prefix Frontend` to guarantee production bundle integrity.
- Verify that the original error condition is resolved AND that related features continue to work normally.

### Step 7: Update Documentation & Clean Technical Debt
- **Strict User Mandate**: If this bug was listed in [`PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md) under "Known Issues & Technical Debt", **completely delete/remove the item from the list** (never leave it marked as "Resolved").
- If application behavior or contracts were adjusted, update the corresponding documentation ([`API_REFERENCE.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/04_Technical/API_REFERENCE.md), [`UI_UX.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/03_Design/UI_UX.md), etc.).

