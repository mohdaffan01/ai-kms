---
trigger: always_on
---

# AI AGENT RULES

## 1. PURPOSE

This file defines the mandatory rules that every AI agent must follow
when working on this project.

The documentation inside `/docs` is the primary source of truth for the project.

AI MUST NOT make important project changes based only on assumptions
or by looking at isolated code.

---

# 2. MANDATORY PROTOCOL: READ DOCS FIRST — NEVER SCAN ENTIRE CODEBASE

> [!IMPORTANT]
> **STRICT RULE FROM USER:**
> 1. **DO NOT read or scan the entire codebase blindly.** Grepping or recursively reading across files without checking docs first is strictly forbidden.
> 2. **ALWAYS read the documentation in `/docs` FIRST** before touching any code.
> 3. Start by reading `docs/07_PROJECT_STATE.md` to know the current state.
> 4. Based on `/docs`, identify **EXACTLY** which component, route, controller, or model file is responsible for the task.
> 5. Read **ONLY** those specific, targeted files.
> 6. Implement the minimal required change.
> 7. **EVERY SINGLE TIME a change is made, IMMEDIATELY update the relevant `/docs` files** (especially `docs/07_PROJECT_STATE.md` and related doc files) so the documentation is always 100% up to date.
> 8. **Resolved Issues Cleanup**: In `docs/07_PROJECT_STATE.md` under "Known Issues & Technical Debt", when an issue is resolved, **completely remove/delete it from the list** instead of retaining it as "Resolved".
> 9. This is a permanent instruction that must be followed on every interaction without needing reminders.

---

# 3. DOCUMENTATION MAP

Use the following documents according to the task.

### 01_PRD.md

Defines:

- Product purpose
- Problem being solved
- Target users
- Product requirements
- Features
- Functional requirements
- Non-functional requirements
- Product goals

Read this before adding, removing, or significantly changing a feature.

---

### 02_TRD.md

Defines:

- Technical architecture
- Technologies
- Frameworks
- Libraries
- Backend/frontend communication
- Technical constraints
- Infrastructure
- Technical requirements

Read this before making architectural or major technical changes.

---

### 03_APP_FLOW.md

Defines:

- User journeys
- Page navigation
- User actions
- Application flow
- Screen-to-screen transitions
- Authentication flow

Read this before changing navigation, user journeys, or application behavior.

---

### 04_UI_UX.md

Defines:

- UI structure
- Design system
- Layout
- Components
- User experience
- Responsive behavior
- Interaction patterns

Read this before changing UI/UX or creating new screens/components.

---

### 05_BACKEND_SCHEMA.md

Defines:

- Database structure
- Collections/tables
- Fields
- Relationships
- Data types
- Validation rules
- Backend data models

Read this before changing database models, schemas, or stored data.

---

### 06_IMPLEMENTATION_PLAN.md

Defines:

- Development phases
- Build sequence
- Implementation order
- Dependencies between tasks
- Development milestones

Read this before starting a new major implementation task.

---

### 07_PROJECT_STATE.md

Defines the CURRENT state of the project.

It contains:

- Completed work
- Work currently in progress
- Not-started work
- Current implementation status
- Recent important changes
- Known issues
- Current milestone
- Next steps

This file MUST be read before every development task.

---

# 4. SOURCE OF TRUTH

The documentation files are the project's source of truth.

If the code and documentation disagree:

1. Do NOT blindly choose one.
2. Inspect the existing implementation.
3. Determine whether the code or documentation is outdated.
4. Preserve working functionality unless a change is explicitly required.
5. Update the relevant documentation when the actual project state changes.

Never silently ignore a conflict between documentation and code.

---

# 5. BEFORE MAKING A CHANGE

Before modifying code, the AI must determine:

- What currently exists?
- What does the project documentation require?
- What is the current project state?
- What files will be affected?
- Could this change break existing functionality?
- Does this change affect architecture?
- Does this change affect the database?
- Does this change affect the user flow?
- Does this change affect the UI/UX?
- Does this change affect the implementation plan?

For major changes, create a short implementation plan before editing.

---

# 6. MINIMAL CHANGE PRINCIPLE

Make the smallest change necessary to correctly complete the task.

The AI MUST NOT:

- Rewrite working code unnecessarily.
- Refactor unrelated code.
- Change architecture without a reason.
- Introduce unnecessary dependencies.
- Rename files or folders without necessity.
- Remove existing functionality without approval.
- Change unrelated features while implementing a task.

Avoid unnecessary changes.

---

# 7. PRESERVE EXISTING FUNCTIONALITY

When adding a new feature:

- Existing functionality must continue to work.
- Existing APIs should remain compatible unless a breaking change is required.
- Existing database data must not be damaged.
- Existing UI behavior should not be changed unnecessarily.

Before removing or changing existing behavior, verify that the change is
actually required.

---

# 8. ARCHITECTURE RULE

Do not introduce architectural changes casually.

Any major change involving:

- Frontend architecture
- Backend architecture
- Database architecture
- Authentication
- API architecture
- External services
- Infrastructure

must first be checked against:

`docs/02_TRD.md`

If the architecture needs to change, update `02_TRD.md`
so that the documentation remains accurate.

---

# 9. DATABASE RULE

Before changing the database:

1. Read `docs/05_BACKEND_SCHEMA.md`.
2. Understand the existing schema.
3. Check relationships and dependencies.
4. Make the required change.
5. Update `05_BACKEND_SCHEMA.md`.

Never change the database structure without updating the documentation.

---

# 10. API RULE

Before changing or creating an API:

1. Understand the existing backend structure.
2. Check the TRD.
3. Check the backend schema.
4. Check whether the API affects the frontend.
5. Implement the API.
6. Update the relevant documentation if the API changes the documented system.

---

# 11. UI/UX RULE

Before creating or modifying a screen:

1. Read `04_UI_UX.md`.
2. Read `03_APP_FLOW.md` when navigation/user flow is affected.
3. Follow the existing design system.
4. Reuse existing components when appropriate.
5. Do not introduce inconsistent UI patterns.

If the UI/UX specification changes, update `04_UI_UX.md`.

---

# 12. FEATURE RULE

Before implementing a major feature:

1. Read `01_PRD.md`.
2. Read `07_PROJECT_STATE.md`.
3. Read `06_IMPLEMENTATION_PLAN.md`.
4. Read any other relevant documentation.
5. Inspect existing implementation.
6. Implement the feature.
7. Test the feature.
8. Update `07_PROJECT_STATE.md`.

A feature must not be marked as completed unless it has actually
been implemented and verified.

---

# 13. PROJECT STATE RULE ⭐

`docs/07_PROJECT_STATE.md` is the single source for the CURRENT
implementation status of the project.

After every meaningful development milestone, the AI MUST update it.

Meaningful changes include:

- New feature added
- Feature completed
- Feature partially completed
- Feature removed
- Major bug fixed
- New API added
- API significantly changed
- Database schema changed
- Major UI completed
- Major architecture changed
- New integration added
- Development phase completed

The update should contain:

- What changed
- What was added
- What was completed
- What remains
- Current progress
- Known issues
- Next recommended step

---

# 14. PROJECT STATE FORMAT

Keep `07_PROJECT_STATE.md` easy to scan.

Use this general structure:

## Current Project Status

Describe the current overall state.

## Current Phase

Describe what phase of development the project is currently in.

## Completed

List completed features/tasks.

## In Progress

List currently active work.

## Not Started

List planned work that has not started.

## Recent Changes

Record important recent changes.

## Known Issues

Record known problems or limitations.

## Next Steps

List the next recommended development tasks.

---

# 15. DOCUMENTATION UPDATE RULE

If a code change makes existing documentation inaccurate,
the AI MUST update the relevant documentation.

Examples:

Database changed
→ Update `05_BACKEND_SCHEMA.md`

Architecture changed
→ Update `02_TRD.md`

User flow changed
→ Update `03_APP_FLOW.md`

UI/UX changed
→ Update `04_UI_UX.md`

Requirements changed
→ Update `01_PRD.md`

Implementation sequence changed
→ Update `06_IMPLEMENTATION_PLAN.md`

Project progress changed
→ Update `07_PROJECT_STATE.md`

---

# 16. DO NOT INVENT REQUIREMENTS

The AI must not invent product requirements, features,
business rules, database fields, APIs, or user flows.

If something is not defined:

1. Check the existing code.
2. Check all relevant documentation.
3. Infer only when the intent is obvious.
4. If the decision would materially affect the project,
   ask for clarification before implementing it.

---

# 17. TESTING AND VERIFICATION

After making a meaningful code change:

1. Run the relevant tests.
2. Check for errors.
3. Verify that the changed functionality works.
4. Check for obvious regressions.
5. Only then update the project state.

Never mark a feature as completed merely because code was written.

---

# 18. COMPLETION RULE

A task is considered completed only when:

- Required code has been implemented.
- Relevant tests/checks have been performed.
- Existing functionality has been preserved.
- Relevant documentation has been updated.
- `07_PROJECT_STATE.md` reflects the new state.

---

# 19. WHEN REQUIREMENTS CHANGE

If the user changes an existing requirement:

1. Identify which documentation is affected.
2. Update the relevant documentation.
3. Check whether existing code is now inconsistent.
4. Update the implementation accordingly.
5. Update `07_PROJECT_STATE.md`.

Do not implement a new requirement while leaving contradictory
documentation behind.

---

# 20. FINAL RESPONSE AFTER A TASK

After completing a task, briefly report:

### Changed
What was changed.

### Added
What was added.

### Updated
Which documentation files were updated.

### Verified
What was tested or verified.

### Current State
Where the project stands after the change.

### Next Step
What should be done next, if applicable.

---

# 21. GOLDEN RULE

1. **NEVER scan or read the whole codebase blindly.**
2. **ALWAYS read the documentation first (`docs/07_PROJECT_STATE.md` + relevant docs).**
3. **Decide from the docs which file to read, and inspect ONLY that specific file.**
4. **Make the required change.**
5. **Update `/docs` IMMEDIATELY every single time without exception.**

The AI must always leave the project in a state where another AI agent
can understand what the project is, what has been completed, what is
currently being worked on, and what should happen next.