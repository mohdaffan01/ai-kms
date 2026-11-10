# AI-KMS (AI Knowledge Management System)

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%205-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose%209-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/LLM-Gemini%202.5%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![ChromaDB](https://img.shields.io/badge/Vector%20Store-ChromaDB-FF6600)](https://www.trychroma.com/)

> **An AI-powered academic knowledge management system that transforms course materials into an interactive learning environment with context-grounded Semantic Search (RAG), dynamic syllabus topic extraction, 3D spaced revision flashcards, and self-assessment quizzes.**

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Technology Stack](#2-technology-stack)
- [3. Project Folder Structure](#3-project-folder-structure)
- [4. Prerequisites & Setup](#4-prerequisites--setup)
- [5. Environment Variables Configuration](#5-environment-variables-configuration)
- [6. How to Run the Project](#6-how-to-run-the-project)
- [7. AI and RAG Workflow](#7-ai-and-rag-workflow)
- [8. Database and Document Processing](#8-database-and-document-processing)
- [9. Testing Instructions](#9-testing-instructions)
- [10. Future Enhancements](#10-future-enhancements)
- [11. Documentation Links](#11-documentation-links)

---

## 1. Project Overview

Students and researchers often struggle with **scattered study materials** (PDFs, PPTs, notes across different folders), **passive reading** with no interactive query support, and **difficulty tracking syllabus progress** or preparing for exams.

**AI-KMS** solves this by converting static study materials into an active, intelligent learning workspace:

- **Problem & Solution**: Instead of manually organizing files and memorizing disconnected notes, AI-KMS automatically ingests course materials, extracts hierarchical chapters and subtopics, and indexes text for grounded AI assistance.
- **Core Objectives**:
  - Automate document parsing and dynamic syllabus hierarchy extraction.
  - Provide accurate, hallucination-free Q&A grounded exclusively in uploaded course materials via Retrieval-Augmented Generation (RAG).
  - Track curriculum completion through real-time chapter and subtopic checklists.
  - Reinforce active recall through interactive 3D flashcards and automated 4-option MCQ assessments.
- **Key Features**:
  - **Secure Authentication**: JWT-based session security, Bcrypt password hashing, and user profile management.
  - **Multi-Format Document Upload**: Support for `.pdf`, `.ppt`, `.pptx`, `.doc`, `.docx`, `.txt`, `.md` with an in-browser PDF viewer.
  - **Dynamic Curriculum Progress**: Automated parent chapter and child subtopic extraction with progress bars and completion checklists.
  - **Context-Grounded RAG Chat**: Conversational AI powered by Google Gemini 2.5 Flash, scoped to specific documents or global search, with on-demand Text-to-Speech (TTS).
  - **3D Spaced Flashcards**: Interactive 3D flip cards generated from completed topics with keyboard shortcuts (`Space`, arrows, `1`/`2`) and direct question navigation.
  - **AI Assessment Quizzes**: Dynamic 4-option MCQs with live timers, instant answer evaluation, explanations, and historical performance tracking.

---

## 2. Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 8, React Router DOM 7, Axios, Lucide React | Modern SPA with modular dark-mode glassmorphic styling |
| **Backend** | Node.js, Express.js 5, Mongoose 9, Multer, Bcrypt, JWT | RESTful API server, file uploads, and session management |
| **AI & LLM** | Google Gemini 2.5 Flash | Grounded Q&A (RAG), curriculum extraction, flashcards, & quizzes |
| **Vector Engine** | ChromaDB, Ollama (`nomic-embed-text`) | High-dimensional vector store (cosine similarity) with fallback |
| **Database** | MongoDB | Stores users, document metadata, curriculum progress, flashcards, & quizzes |

---

## 3. Project Folder Structure

```
ai-kms/
├── .agents/                 # AI agent rules & development workflows
│   ├── rules/               # Project rules, coding standards, doc rules
│   └── workflows/           # Feature development, bug fixing, refactoring
├── Backend/                 # Express 5 REST API Server
│   ├── src/
│   │   ├── config/          # MongoDB connection handler
│   │   ├── controllers/     # Route logic (auth, docs, progress, RAG, flashcards, quizzes)
│   │   ├── middleware/      # Auth guard, upload handler, error handling
│   │   ├── models/          # Mongoose schemas (User, Document, Progress, Flashcard, Quiz)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Document processor, chunker, cleaner, embeddings, ChromaDB
│   │   └── index.js         # Server entry point
│   ├── uploads/             # Stored document files
│   ├── .env.example         # Environment template
│   └── package.json
├── Frontend/                # React 19 Client Application (Vite)
│   ├── src/
│   │   ├── api/             # Axios API integration modules
│   │   ├── components/      # UI components (auth, dashboard, flashcards, quiz, modals)
│   │   ├── context/         # AuthContext state provider
│   │   ├── pages/           # Dashboard, Login, Register, Profile
│   │   ├── styles/          # Modular CSS files (dashboard, flashcards, quiz)
│   │   ├── App.jsx          # Route declarations
│   │   └── main.jsx         # Application root
│   ├── package.json
│   └── vite.config.js
├── docs/                    # Authoritative technical, design & product documentation
│   ├── 01_Product/          # PRD & Roadmap
│   ├── 02_Architecture/     # System architecture & App flow
│   ├── 03_Design/           # UI/UX specifications
│   ├── 04_Technical/        # Tech stack, database schema & API reference
│   ├── 05_Development/      # Implementation plan
│   ├── 06_Project_Management/ # Project status & master tracker
│   └── 07_Decisions/ADR/    # Architecture Decision Records
├── AGENTS.md                # Central AI agent instruction entry point
└── README.md
```

---

## 4. Prerequisites & Setup

### Prerequisites
- **Node.js**: v18.x or v20.x LTS
- **MongoDB**: Community Server running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI
- **Google Gemini API Key**: Free key from [Google AI Studio](https://aistudio.google.com/)
- *(Optional)*: ChromaDB (port 8000) & Ollama (`nomic-embed-text` on port 11434) for local vector embeddings.

### Quick Setup

```bash
# 1. Clone repository
git clone https://github.com/mohdaffan01/ai-kms.git
cd ai-kms

# 2. Install Backend dependencies
cd Backend
npm install

# 3. Install Frontend dependencies
cd ../Frontend
npm install
```

---

## 5. Environment Variables Configuration

Create a `.env` file in the `Backend/` directory:

```bash
cd Backend
cp .env.example .env
```

Configure the following variables in `Backend/.env`:

```ini
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/aikms
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere

# Optional: Vector Store & Local Embeddings
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=knowledge_chunks
OLLAMA_HOST=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
```

---

## 6. How to Run the Project

Run both Backend and Frontend in separate terminals:

```bash
# Terminal 1 - Backend (http://localhost:3000)
cd Backend
npm run dev

# Terminal 2 - Frontend (http://localhost:5173)
cd Frontend
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 7. AI and RAG Workflow

```
[ Uploaded Document ] ──► [ pdf-parse Text Extraction ]
                                    │
                                    ▼
                          [ Text Normalizer & Cleaner ]
                                    │
                                    ▼
                          [ Semantic Sliding Window Chunker ]
                                    │
                                    ▼
                          [ Vector Embeddings Generation ]
                                    │
                                    ▼
                          [ ChromaDB Vector Store ]
                                    │
[ User Question ] ────────► [ Similarity Vector Search ]
                                    │
                                    ▼
[ Augmented Context ] ────► [ Google Gemini 2.5 Flash ] ──► [ Grounded Answer ]
```

- **Curriculum Extractor**: Automatically parses uploaded materials into authentic units, chapters, and nested subtopics, filtering out MCQs and noise.
- **RAG Engine**: Retrieves top-k cosine similarity chunks from ChromaDB and augments prompts to Google Gemini for factual, document-grounded responses.

---

## 8. Database and Document Processing

### MongoDB Collections Summary

| Collection | Schema File | Key Attributes | Description |
|---|---|---|---|
| **`users`** | `user.model.js` | `name`, `email`, `password`, `profileImage` | User authentication & profile records |
| **`documents`** | `document.model.js` | `title`, `filePath`, `mimeType`, `fileSize`, `subject` | Uploaded document metadata |
| **`progress`** | `progress.model.js` | `userId`, `subjects` (chapters & subtopics), `recentActivities` | Curriculum checklist & completion % |
| **`flashcards`** | `flashcard.model.js` | `userId`, `subject`, `front`, `back`, `difficulty`, `isMastered` | 3D revision cards & review counts |
| **`quizzes`** | `quiz.model.js` | `userId`, `subject`, `questions`, `attempts`, `bestPercentage` | Multiple-choice assessments & scores |

---

## 9. Testing Instructions

```bash
# Test backend service pipeline (Cleaner, Chunker, Ollama, ChromaDB)
cd Backend
node testServices.js

# Test topic hierarchy extraction
node scripts/test_hierarchy.js

# Validate Frontend build
cd ../Frontend
npm run build
```

---

## 10. Future Enhancements

- **Knowledge Graph Visualization (Phase 3)**: Extract entity triplets `(Subject, Relation, Object)` and render interactive node-link relationship graphs.
- **Knowledge Gap Detection (Phase 4)**: Automatically analyze recurring quiz errors and uncompleted topics to recommend focused remedial study materials.
- **Multi-Modal Document Ingestion**: Add OCR support for handwritten lecture notes and diagram-heavy materials.

---

## 11. Documentation Links

Comprehensive technical specifications, design patterns, and agent instructions are organized inside the [`docs/`](docs/) directory and [`AGENTS.md`](AGENTS.md):

- **Product Specifications**:
  - [Product Requirements Document (PRD)](docs/01_Product/PRD.md)
  - [Product Roadmap & Milestones](docs/01_Product/ROADMAP.md)
- **Architecture & System Design**:
  - [System Architecture](docs/02_Architecture/SYSTEM_ARCHITECTURE.md)
  - [Application Flow & User Journeys](docs/02_Architecture/APP_FLOW.md)
- **Design & UI**:
  - [UI/UX Specifications](docs/03_Design/UI_UX.md)
- **Technical & API Reference**:
  - [Technology Stack & Constraints](docs/04_Technical/TECH_STACK.md)
  - [Database Schema & Mongoose Models](docs/04_Technical/DATABASE_SCHEMA.md)
  - [Complete REST API Reference](docs/04_Technical/API_REFERENCE.md)
- **Development & Project Management**:
  - [Implementation Plan](docs/05_Development/IMPLEMENTATION_PLAN.md)
  - [Living Project Status & Master Tracker](docs/06_Project_Management/PROJECT_STATUS.md)
- **Architecture Decisions**:
  - [Architecture Decision Records (ADRs)](docs/07_Decisions/ADR/README.md)
- **AI Agent Guidelines & Workflows**:
  - [Central Agent Instructions (AGENTS.md)](AGENTS.md)
  - [Agent Rules (.agents/rules/)](.agents/rules/)
  - [Agent Workflows (.agents/workflows/)](.agents/workflows/)
