# AIKMS – Backend Automated Testing Documentation

This document provides a comprehensive overview of the automated testing system implemented for the **AI Knowledge Management System (AIKMS)** backend.

---

## 1. Testing Architecture & Principles

The AIKMS backend testing architecture is engineered around the following core principles:

1. **Zero External Dependency at Test Runtime**: Tests run independently without requiring active Ollama, ChromaDB, Gmail SMTP, or local MongoDB instances. External APIs, network calls, and vector storage engines are cleanly isolated via mock implementations.
2. **Regression-Free Decoupling**: The Express server configuration is decoupled into [`src/app.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/app.js) (app setup & routes) and [`src/index.js`](file:///c:/Users/mohd%20affan/major-projects/ai-kms/Backend/src/index.js) (server listen & DB connect). This enables Supertest to mount the application without port collisions or unwanted database connections.
3. **Multi-Layered Verification**:
   - **Unit Tests**: Focus on individual algorithms, utilities, middlewares, models, and controllers in isolation using the *Arrange, Act, Assert* pattern.
   - **Integration Tests**: Verify complete HTTP request/response lifecycles, route authorization guards, and controller-repository-service contracts using Supertest.

---

## 2. Frameworks & Dependencies

| Tool / Package | Version | Purpose |
|---|---|---|
| **Vitest** | `^5.1.0` | High-performance ES-module native unit and integration test runner |
| **Supertest** | `^7.3.2` | HTTP assertions and API request simulation against Express application |
| **@vitest/coverage-v8** | `^5.1.0` | Native V8 code coverage provider producing statements, branches, functions, and lines metrics |

---

## 3. Test Directory Structure

```text
Backend/
├── tests/
│   ├── setup.js                                    # Global test environment configuration & mocks
│   ├── fixtures/
│   │   └── sampleData.js                           # Standardized mock users, documents, chunks, embeddings
│   │
│   ├── unit/                                       # Isolated Unit Tests (76 tests across 15 files)
│   │   ├── utils/
│   │   │   ├── generateToken.test.js               # JWT generation & expiry tests
│   │   │   └── sendEmail.test.js                   # Nodemailer SMTP & fallback tests
│   │   ├── middleware/
│   │   │   ├── authMiddleware.test.js              # Bearer token verification & 401 guards
│   │   │   ├── errorMiddleware.test.js             # 404 handler & 500 error sanitization
│   │   │   └── uploadMiddleware.test.js            # MIME type whitelist & 20MB limit
│   │   ├── models/
│   │   │   └── userModel.test.js                   # Password hashing, bcrypt match, OTP, reset tokens
│   │   ├── services/
│   │   │   ├── textCleaner.test.js                 # PDF noise, line normalization, headers/footers
│   │   │   ├── textChunker.test.js                 # 800-char window, 100-char overlap, boundary snapping
│   │   │   ├── embeddingService.test.js            # Ollama API 768-dim embeddings & offline zero vector
│   │   │   ├── chromaService.test.js               # Upsert, query with userId filter, delete vectors
│   │   │   ├── documentProcessor.test.js           # Text extraction, chunking, and ChromaDB pipeline
│   │   │   └── topicExtractor.test.js              # Universal topic sanitizer & MCQ noise rejection
│   │   └── controllers/
│   │       ├── authController.test.js              # Registration validation, login, profile fetch
│   │       ├── documentController.test.js          # Blank document guard, stats, upload, delete
│   │       ├── flashcardController.test.js         # Manual card creation, mastery toggle, deck deletion
│   │       ├── quizController.test.js              # Attempt calculation, percentage scoring, bestScore
│   │       └── progressController.test.js          # Curriculum KPI stats, dynamic subjects, topic toggle
│   │
│   └── integration/                                # Supertest HTTP API Tests (38 tests across 4 files)
│       ├── authApi.test.js                         # Register, Login, /me, Healthcheck
│       ├── documentApi.test.js                     # Multipart upload, blank file rejection, list, delete
│       ├── knowledgeApi.test.js                    # Vectorization, RAG semantic search, chat greetings
│       └── studyHubApi.test.js                     # Dashboard overview, topic toggle, flashcards, quiz submit
│
├── vitest.config.js                                # Vitest configuration with V8 coverage settings
└── package.json                                    # Testing scripts & devDependencies
```

---

## 4. Mocking Strategy

To guarantee regression safety and speed, external subsystems are mocked:

- **Ollama AI Model Endpoint**: `globalThis.fetch` intercepted in tests to return mock 768-dimensional float embeddings, testing both 200 OK and graceful offline fallback states.
- **ChromaDB Vector Store**: `chromadb` client mocked to verify vector upsert payloads, user-isolated cosine search queries, and document cascade deletions without requiring a running ChromaDB daemon.
- **Transactional Email**: `nodemailer.createTransport` intercepted to verify mail options and message delivery without sending real emails.
- **Database Repositories**: Data access calls (`userRepository`, `documentRepository`, `progressRepository`, `flashcardRepository`, `quizRepository`) are cleanly mocked with predictable fixtures, ensuring tests never connect to or mutate production MongoDB collections.

---

## 5. Commands to Execute Tests

All test commands can be executed from the `Backend` directory or via the `--prefix Backend` flag from project root:

### Run All Tests (Unit + Integration)
```bash
npm test --prefix Backend
```

### Run Only Unit Tests
```bash
npm run test:unit --prefix Backend
```

### Run Only Integration Tests
```bash
npm run test:integration --prefix Backend
```

### Generate Code Coverage Report
```bash
npm run test:coverage --prefix Backend
```

---

## 6. Current Testing Status

- **Total Test Files**: 21 files (17 unit + 4 integration)
- **Total Executed Tests**: 114 tests
- **Passed Tests**: 114 (100% Pass Rate)
- **Failed / Skipped Tests**: 0
- **Execution Time**: ~6.5 seconds

### Coverage Summary Table
| Module / Layer | Statement Coverage | Function Coverage | Line Coverage |
|---|---|---|---|
| **Utils** (`generateToken`, `sendEmail`) | 100% | 100% | 100% |
| **Middlewares** (`auth`, `error`, `upload`) | 95.65% | 100% | 95.55% |
| **Routes** (All API Routers) | 100% | 100% | 100% |
| **App Entry Shell** (`app.js`) | 94.73% | 100% | 94.73% |
| **Core Services** (`cleaner`, `chunker`, `embedding`, `chroma`) | 88% - 100% | 85% - 100% | 88% - 100% |
| **Controllers & API Integration** | ~35% - 50% | ~35% | ~35% - 50% |
