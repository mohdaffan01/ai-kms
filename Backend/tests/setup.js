import { vi, beforeEach, afterEach } from 'vitest';

// Configure test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.JWT_SECRET = 'aikms-super-secret-test-jwt-key-2026';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/aikms_test';
process.env.OLLAMA_HOST = 'http://localhost:11434';
process.env.EMBEDDING_MODEL = 'nomic-embed-text';
process.env.CHROMA_URL = 'http://localhost:8000';
process.env.GEMINI_API_KEY = 'test-mock-gemini-api-key';

// Suppress console outputs during test execution unless debugging
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
