# ADR-002: Local Filesystem Storage for Uploaded Study Materials

## Status
Accepted

## Date
2026-10-13

## Context
Uploaded student documents (.pdf, .ppt, .docx, .txt, .md) need to be stored, read by server-side text extraction parsers (`pdf-parse`), and served to the client browser for inline viewing and downloads. Options considered were cloud object storage (AWS S3, Google Cloud Storage) vs. local disk storage via Multer.

## Decision
We chose **local filesystem storage** (`Backend/uploads/`) handled via Multer `diskStorage`, served directly using Express static middleware (`app.use('/uploads', express.static('uploads'))`).

## Consequences
### Positive:
- Zero external cloud credentials, billing setup, or network latency during local development and testing.
- Direct filesystem path accessibility for text extractors and unlinking routines (`fs.unlinkSync`).
### Negative / Trade-offs:
- Multi-instance horizontal scaling requires a shared volume or migration to an S3-compatible object store in production.
- Disk usage must be managed locally; handled by enforcing the 20MB per file limit.

