# ADR-004: Full Cascade Wipe on Subject Deletion

## Status
Accepted

## Date
2026-11-10

## Context
Previously, deleting a subject vault from the dashboard only removed the subject entry from `progress.subjects` and renamed linked documents to `"General"`. This left orphan disk files, orphan ChromaDB vector embeddings, orphan flashcards, and orphan quizzes, causing user confusion and phantom data.

## Decision
We adopted a **Full Cascade Wipe Policy** on subject deletion:
1. Locate all documents tagged with the deleted subject name.
2. Unlink and remove all corresponding physical files from `Backend/uploads` (`fs.unlinkSync`).
3. Clear vector embeddings in ChromaDB and memory caches (`deleteVectorsByDocument`, `clearDocumentCache`).
4. Cascade delete database records across MongoDB: `Document.deleteMany`, `Flashcard.deleteMany`, and `Quiz.deleteMany`.
5. Remove the subject from `Progress.subjects` and recalculate remaining user curriculum stats.

## Consequences
### Positive:
- Clean data integrity across disk storage, vector store, and MongoDB collections.
- Zero orphaned flashcards or quizzes for non-existent subjects.
### Negative / Trade-offs:
- Destructive and irreversible action; mitigated by adding a GitHub-style high-safety confirmation modal requiring the user to type the exact subject name to confirm deletion.

