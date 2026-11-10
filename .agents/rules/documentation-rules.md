---
trigger: always_on
---

# Documentation Rules & Maintenance Protocols

## 1. Core Principle: Documentation as the Source of Truth
The documentation inside `docs/` is the single source of truth for **AI-KMS**.
Whenever source code is modified, the corresponding documentation **must be updated immediately** in the same task turn. Outdated, desynchronized, or contradictory documentation is considered a critical bug.

---

## 2. When Documentation Must Be Updated

Documentation must be updated whenever any of the following occur:
- A new feature or sub-feature is added or completed.
- Existing functionality or user workflow is modified.
- An API endpoint is created, updated, or deprecated.
- Database models, fields, or Mongoose subdocuments change.
- UI components, layouts, styling tokens, or modal interactions are updated.
- A bug is resolved or technical debt is addressed.
- Development milestones or implementation phases advance.

> [!CAUTION]
> Never complete a coding task without updating the relevant documentation files.

---

## 3. Documentation Consultation Map

Consult and update the relevant documents based on the task:

| Document | Primary Topics Defined | When to Consult & Update |
|---|---|---|
| [`01_Product/PRD.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/01_Product/PRD.md) | Product vision, target users, problem statement, functional & non-functional requirements | Before adding, altering, or removing functional product requirements |
| [`01_Product/ROADMAP.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/01_Product/ROADMAP.md) | Phase milestones (Phase 1-4), timeline, deliverables | When milestone goals, completion statuses, or future phases shift |
| [`02_Architecture/SYSTEM_ARCHITECTURE.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/02_Architecture/SYSTEM_ARCHITECTURE.md) | High-level system design, component diagrams, data flows, RAG pipeline | Before making architectural decisions or cross-cutting structural changes |
| [`02_Architecture/APP_FLOW.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/02_Architecture/APP_FLOW.md) | Step-by-step user journeys, navigation flow, auth flows, deletion flows | Before changing navigation, routes, user journeys, or application behavior |
| [`03_Design/UI_UX.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/03_Design/UI_UX.md) | UI layout, color palette, design tokens, modals, interactive components | Before creating or altering screens, modals, or design components |
| [`04_Technical/TECH_STACK.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/04_Technical/TECH_STACK.md) | Frameworks, libraries, package versions, environment configs, constraints | When adding or updating libraries, dependencies, or infrastructure settings |
| [`04_Technical/DATABASE_SCHEMA.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/04_Technical/DATABASE_SCHEMA.md) | Mongoose models, schemas, fields, validation, hooks, subdocuments | Before changing database models, schemas, indexes, or relationships |
| [`04_Technical/API_REFERENCE.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/04_Technical/API_REFERENCE.md) | REST API routes, request parameters, payloads, responses, status codes | Before creating, updating, or deleting any backend API endpoint |
| [`05_Development/IMPLEMENTATION_PLAN.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/05_Development/IMPLEMENTATION_PLAN.md) | Step-by-step development sequence, phase breakdown, task dependencies | Before starting a major feature or implementation phase |
| [`06_Project_Management/PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md) | Comprehensive current project status, completed tasks, active work, next steps | **Mandatory on every single task turn** |
| [`07_Decisions/ADR/`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/07_Decisions/ADR/) | Architecture Decision Records (ADRs) | Whenever a significant architectural or design decision is adopted |

---

## 4. How to Update Project Status (`PROJECT_STATUS.md`)

[`PROJECT_STATUS.md`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/docs/06_Project_Management/PROJECT_STATUS.md) is the master tracker of the project's living state.

### Standard Structure:
1. **Overview & Current Phase**: Summary of overall completion and current milestone.
2. **Completed Features Breakdown**: Verified features marked with `[x]`, citing exact component and controller files with clickable links (`file:///...`).
3. **In Progress & Upcoming Work**: Active work marked with `[ ]`.
4. **Known Issues & Technical Debt**:
   > [!IMPORTANT]
   > **STRICT CLEANUP RULE:**
   > When a known issue or bug is resolved, **completely delete/remove it from the list** instead of marking it "Resolved". The list must contain only active, unresolved issues. If there are no active issues, write `*No active known issues or technical debt.*`
5. **Next Steps**: Explicit list of prioritized upcoming tasks.

---

## 5. Rules Against Documenting Unimplemented Features as Completed

1. **Verification Before Documentation**: Never mark a feature, sub-task, or checkbox as `[x]` merely because code was drafted.
2. **Actual Verification Required**: A feature is complete ONLY after:
   - All required backend endpoints and frontend components are written.
   - Syntax checks pass (`node --check`).
   - Production bundle builds pass (`npm run build`).
   - Integration behavior is verified against runtime expectations.
3. **No Hallucinated Progress**: If a feature is only partially complete, document it explicitly as *In Progress* with what is working and what remains.

---

## 6. Final Response Format Protocol

After completing any development or documentation task, summarize the work cleanly:

### Summary of Actions:
- **Changed**: Specific existing files or behaviors modified.
- **Added**: New files, endpoints, components, or tests created.
- **Documentation Updated**: List of specific `docs/` files updated with clickable links (`file:///...`).
- **Verified**: Build checks, syntax checks, or regression verifications executed.
- **Current State**: Where the project stands after the changes.
- **Next Step**: What should be tackled next.

