# ADR-003: Dynamic Document-Driven Curriculum & Hierarchical Topic Extraction

## Status
Accepted

## Date
2026-10-19

## Context
Initial implementations used hardcoded static CS subject placeholders (e.g. `sub-dbms`, `sub-os`, `sub-cn`). This created empty placeholder noise for users studying unrelated disciplines (e.g., Biology, Law) and required manual curriculum configuration.

## Decision
We removed hardcoded default subjects in favor of **Dynamic Document-Driven Curriculum Generation**. When notes or books are uploaded, `topicExtractor.service.js` automatically analyzes the material with Gemini, extracts hierarchical parent chapters and nested child subtopics, and dynamically creates or updates the user's Mongoose `Progress` document. Users can also manually create custom subjects with `isUserCreated: true` flags.

## Consequences
### Positive:
- Any academic subject or book can be ingested dynamically with zero manual syllabus setup.
- Hierarchical structure provides granular study checklists (parent chapter with nested subtopics).
### Negative / Trade-offs:
- Extraction relies on document readability; blank documents or unparseable scans require heuristic fallbacks.

