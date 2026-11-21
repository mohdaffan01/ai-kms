# AI-KMS REST API Reference (API_REFERENCE)

## 1. API Architecture & Global Conventions

- **Base URL**: `http://localhost:3000/api`
- **Protocol**: HTTP/1.1 & HTTP/2 over JSON
- **Static Assets**: `http://localhost:3000/uploads/<filename>`
- **Authentication**: JWT Bearer Token provided in request header:
  ```http
  Authorization: Bearer <jwt_token>
  ```
- **Standard Response Envelope**:
  ```json
  {
    "success": true,
    "message": "Operation description",
    "data": {}
  }
  ```
- **Error Response Envelope**:
  ```json
  {
    "success": false,
    "message": "Detailed error message",
    "error": "Error stack in non-production"
  }
  ```

---

## 2. System Endpoints

### Health Check
- **Route**: `GET /`
- **Access**: Public
- **Description**: Verifies that the Express API server is active and responding.
- **Response `200 OK`**:
  ```json
  {
    "message": "AiKMS API Server is running smoothly"
  }
  ```

---

## 3. Authentication & Account Routes (`/api/auth`)

### 3.1 Register User
- **Route**: `POST /api/auth/register`
- **Access**: Public
- **Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123"
  }
  ```
- **Validation**:
  - Name is required.
  - Email must be valid email format.
  - Password must be at least 8 characters with at least one uppercase, lowercase, and digit.
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "67301...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "student"
    }
  }
  ```

### 3.2 Login User
- **Route**: `POST /api/auth/login`
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "67301...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "student"
    }
  }
  ```

### 3.3 Google OAuth 2.0 Sign-In & Registration
- **Route**: `POST /api/auth/google`
- **Access**: Public
- **Description**: Authenticates users using a Google Identity Services ID token. Verifies the token against Google's tokeninfo API, ensures email verification and client ID match, and either links an existing user account or creates a new Google student account, returning an AiKMS JWT session token.
- **Body**:
  ```json
  {
    "credential": "<Google_ID_Token_JWT>"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "_id": "67301...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "profileImage": "https://lh3.googleusercontent.com/a/...",
    "role": "student",
    "authProvider": "google",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing credential or unverified Google email.
  - `401 Unauthorized`: Invalid or expired Google token, or Google client ID mismatch.

### 3.4 Forgot Password (Request Reset Email)
- **Route**: `POST /api/auth/forgot-password`
- **Access**: Public
- **Body**: `{ "email": "jane@example.com" }`
- **Description**: Generates a 30-minute cryptographic token and sends an HTML reset email via Nodemailer.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Password reset email sent successfully"
  }
  ```

### 3.4 Reset Password (Token)
- **Route**: `POST /api/auth/reset-password/:token`
- **Access**: Public
- **URL Param**: `:token` (Hex string received in email)
- **Body**: `{ "password": "NewPassword123" }`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Password reset successfully. You can now login."
  }
  ```

### 3.5 Reset Password (OTP Fallback)
- **Route**: `POST /api/auth/reset-password-otp`
- **Access**: Public
- **Body**: `{ "email": "jane@example.com", "otp": "492810", "password": "NewPassword123" }`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Password reset successfully using OTP"
  }
  ```

### 3.6 Get Current User Profile
- **Route**: `GET /api/auth/me`
- **Access**: Protected (JWT)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "user": {
      "_id": "67301...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "student"
    }
  }
  ```

---

## 4. User Profile & Security Routes (`/api/users`)

### 4.1 Update Profile
- **Route**: `PUT /api/users/profile`
- **Access**: Protected (JWT)
- **Body**: `{ "name": "Jane Smith", "avatarUrl": "..." }`
- **Response `200 OK`**: Returns updated user object.

### 4.2 Change Password
- **Route**: `PUT /api/users/change-password`
- **Access**: Protected (JWT)
- **Body**:
  ```json
  {
    "currentPassword": "OldPassword123",
    "newPassword": "NewPassword456"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

---

## 5. Document Routes (`/api/documents`)

### 5.1 Upload Document
- **Route**: `POST /api/documents/upload`
- **Access**: Protected (JWT)
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file` (Binary File: `.pdf`, `.ppt`, `.pptx`, `.doc`, `.docx`, `.txt`, `.md`, max 20MB)
  - `title` (String, required)
  - `subject` (String, required)
  - `topic` (String, optional)
  - `folder` (String, optional)
- **Description**: Stores file in `Backend/uploads/`, validates text content (min 3 chars), creates Document record, triggers automatic chapter & subtopic extraction, and updates Progress.
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "document": {
      "_id": "67302...",
      "title": "DBMS Unit 1",
      "filePath": "uploads/173121-doc.pdf",
      "subject": "DBMS",
      "fileSize": 1048576,
      "mimeType": "application/pdf"
    }
  }
  ```

### 5.2 Get User Documents
- **Route**: `GET /api/documents/my-documents`
- **Access**: Protected (JWT)
- **Query Params**: `?subject=&topic=&folder=`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 4,
    "documents": [ ... ]
  }
  ```

### 5.3 Get Document Stats
- **Route**: `GET /api/documents/:id/stats`
- **Access**: Protected (JWT)
- **Response `200 OK`**: Returns character count, page count, and reading time metrics.

### 5.4 Delete Document
- **Route**: `DELETE /api/documents/:id`
- **Access**: Protected (JWT)
- **Description**: Verifies ownership, removes file from disk, deletes ChromaDB vector chunks, and deletes database record.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Document deleted successfully"
  }
  ```

---

## 6. Knowledge & RAG Routes (`/api/knowledge`)

### 6.1 Process Document Vectorization
- **Route**: `POST /api/knowledge/process/:documentId`
- **Access**: Protected (JWT)
- **Description**: Parses document text, creates semantic chunks, generates vector embeddings, and registers in ChromaDB collection.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Document processed and indexed into vector database",
    "chunksCount": 18
  }
  ```

### 6.2 Semantic Vector Search
- **Route**: `POST /api/knowledge/search`
- **Access**: Protected (JWT)
- **Body**:
  ```json
  {
    "query": "What is 2-tier database architecture?",
    "documentId": "67302...",
    "limit": 5
  }
  ```
- **Response `200 OK`**: Returns ranked array of matching chunk text excerpts and metadata.

### 6.3 Grounded RAG Chat
- **Route**: `POST /api/knowledge/chat`
- **Access**: Protected (JWT)
- **Body**:
  ```json
  {
    "message": "Explain ACID properties with an example",
    "documentId": null,
    "subject": "Operating Systems"
  }
  ```
  *(Note: `subject` is optional. When specified, RAG vector retrieval & keyword grounding filter strictly to documents associated with that subject).*
- **Description**: Performs vector retrieval in ChromaDB with subject isolation, builds grounded context, queries Google Gemini 2.5 Flash, and returns response with citations.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "answer": "ACID stands for Atomicity, Consistency, Isolation, and Durability...",
    "sources": [
      { "documentTitle": "DBMS Unit 1", "chunkId": "chunk-12" }
    ]
  }
  ```

### 6.4 Delete Document Vectors
- **Route**: `DELETE /api/knowledge/:documentId`
- **Access**: Protected (JWT)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Knowledge vectors removed from ChromaDB"
  }
  ```

---

## 7. Curriculum & Progress Routes (`/api/progress`)

### 7.1 Get Dashboard Overview Data
- **Route**: `GET /api/progress/dashboard`
- **Access**: Protected (JWT)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "stats": {
      "totalSubjects": 2,
      "totalTopics": 14,
      "completedTopics": 5,
      "overallProgress": 36,
      "totalDocuments": 3
    },
    "subjects": [ ... ],
    "recentActivities": [ ... ]
  }
  ```

### 7.2 Toggle Topic / Subtopic Completion
- **Route**: `PUT /api/progress/toggle-topic`
- **Access**: Protected (JWT)
- **Body**:
  ```json
  {
    "subjectId": "sub-1731...",
    "topicId": "top-1",
    "subtopicId": "subtop-1-2",
    "completed": true
  }
  ```
- **Response `200 OK`**: Returns updated `stats` and modified `subjects` array.

### 7.3 Create Custom Subject Vault
- **Route**: `POST /api/progress/subject`
- **Access**: Protected (JWT)
- **Body**:
  ```json
  {
    "name": "Artificial Intelligence",
    "code": "CS-402",
    "description": "Heuristic search and agent systems",
    "color": "#10b981",
    "topics": ["1. Search Algorithms", "2. Knowledge Representation"]
  }
  ```
- **Response `201 Created`**: Returns newly created subject object.

### 7.4 Update / Rename Subject
- **Route**: `PUT /api/progress/subject/:subjectId`
- **Access**: Protected (JWT)
- **Body**: `{ "name": "Advanced DBMS", "code": "CS-401" }`
- **Response `200 OK`**: Returns updated subject and updates linked documents.

### 7.5 Delete Subject (Cascade Wipe)
- **Route**: `DELETE /api/progress/subject/:subjectId`
- **Access**: Protected (JWT)
- **Description**: Completely cascade wipes the subject vault:
  1. Deletes all associated uploaded files from disk.
  2. Clears ChromaDB vector embeddings.
  3. Deletes records from `Document`, `Flashcard`, and `Quiz` collections.
  4. Removes subject from `Progress` and recalculates remaining statistics.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Subject and all related study materials deleted successfully",
    "deletedSubjectId": "sub-1731...",
    "deletedSubjectName": "DBMS",
    "deletedDocsCount": 2,
    "stats": { ... }
  }
  ```

### 7.6 Add Custom Topic to Subject
- **Route**: `POST /api/progress/subject/:subjectId/topic`
- **Access**: Protected (JWT)
- **Body**:
  ```json
  {
    "name": "B+ Trees",
    "parentTopicId": "top-1"
  }
  ```
- **Response `200 OK`**: Returns updated subject with appended topic.

### 7.7 Reset Default Subjects
- **Route**: `POST /api/progress/reset-defaults`
- **Access**: Protected (JWT)
- **Response `200 OK`**: Cleans inactive placeholders and re-syncs active documents.

---

## 8. Flashcards & Spaced Revision Routes (`/api/flashcards`)

### 8.1 Get Flashcards Deck
- **Route**: `GET /api/flashcards`
- **Access**: Protected (JWT)
- **Query Params**: `?subject=&topic=&filter=mastered|learning&search=`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "flashcards": [ ... ],
    "stats": {
      "total": 24,
      "mastered": 14,
      "needsPractice": 10,
      "masteryPercentage": 58
    },
    "topics": [ "Indexing", "Normalization" ]
  }
  ```

### 8.2 AI Generate Flashcards
- **Route**: `POST /api/flashcards/generate`
- **Access**: Protected (JWT)
- **Body**:
  ```json
  {
    "subject": "DBMS",
    "topic": "All Completed Topics",
    "count": 5
  }
  ```
- **Description**: Uses Gemini LLM to extract key concepts from completed topics and uploaded notes, returning generated Q&A flashcards saved directly to the user's deck.
- **Response `201 Created`**: Returns array of created flashcard objects.

### 8.3 Create Manual Flashcard
- **Route**: `POST /api/flashcards`
- **Access**: Protected (JWT)
- **Body**:
  ```json
  {
    "subject": "DBMS",
    "topic": "Indexing",
    "front": "What is the primary difference between Clustered and Non-Clustered index?",
    "back": "A clustered index alters the physical order of rows in the table; non-clustered does not.",
    "hint": "Think physical vs logical ordering",
    "difficulty": "medium"
  }
  ```
- **Response `201 Created`**: Returns created flashcard.

### 8.4 Toggle Flashcard Mastery
- **Route**: `PATCH /api/flashcards/:id/master`
- **Access**: Protected (JWT)
- **Body**: `{ "isMastered": true }`
- **Response `200 OK`**: Returns updated flashcard with incremented review counter.

### 8.5 Delete Flashcard
- **Route**: `DELETE /api/flashcards/:id`
- **Access**: Protected (JWT)
- **Response `200 OK`**: Returns `{ "success": true, "message": "Flashcard deleted" }`.

### 8.6 Reset Deck Mastery
- **Route**: `POST /api/flashcards/reset-mastery`
- **Access**: Protected (JWT)
- **Body**: `{ "subject": "DBMS" }`
- **Response `200 OK`**: Resets all cards in deck to `isMastered: false` for spaced re-practice.

---

## 9. AI Quizzes & Assessment Routes (`/api/quizzes`)

### 9.1 Get User Quizzes
- **Route**: `GET /api/quizzes`
- **Access**: Protected (JWT)
- **Query Params**: `?subject=`
- **Response `200 OK`**: Returns list of quizzes and aggregate user performance statistics.

### 9.2 AI Generate Quiz
- **Route**: `POST /api/quizzes/generate`
- **Access**: Protected (JWT)
- **Body**:
  ```json
  {
    "subject": "DBMS",
    "topic": "Database Architecture",
    "questionCount": 5,
    "difficulty": "medium"
  }
  ```
- **Response `201 Created`**: Returns generated quiz with 4-option MCQs and explanations.

### 9.3 Get Single Quiz
- **Route**: `GET /api/quizzes/:id`
- **Access**: Protected (JWT)
- **Response `200 OK`**: Returns quiz questions, duration, and user attempt history.

### 9.4 Submit Quiz Answers
- **Route**: `POST /api/quizzes/:id/submit`
- **Access**: Protected (JWT)
- **Body**:
  ```json
  {
    "answers": {
      "0": 1,
      "1": 3,
      "2": 0
    },
    "timeSpentSeconds": 142
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "score": 3,
    "totalQuestions": 3,
    "percentage": 100,
    "passed": true,
    "detailedResults": [ ... ]
  }
  ```

### 9.5 Delete Quiz
- **Route**: `DELETE /api/quizzes/:id`
- **Access**: Protected (JWT)
- **Response `200 OK`**: Returns `{ "success": true, "message": "Quiz deleted successfully" }`.

---

## 10. Planned Endpoints (Not Yet Implemented)

The following endpoints are defined for upcoming phases and are **not yet implemented**:

| Route | Method | Target Milestone | Description |
|---|---|---|---|
| `/api/graph/nodes` | GET | Phase 3 | Fetch concept nodes and cross-document relationships for visual graph |
| `/api/graph/extract` | POST | Phase 3 | Trigger entity & relationship extraction on processed documents |
| `/api/analytics/gaps` | GET | Phase 4 | Analyze quiz mistakes and detect missing conceptual topics |

