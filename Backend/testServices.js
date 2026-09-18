import { cleanText } from './src/services/textCleaner.js';
import { chunkText } from './src/services/textChunker.js';

console.log('==================================================');
console.log('   AI-KMS STEP 1 SERVICE PIPELINE TEST HARNESS    ');
console.log('==================================================\n');

// 1. TEST TEXT CLEANER
console.log('--- [1/4] TESTING TEXT CLEANER ---');
const rawSampleText = `
  Page 1 of 12

  Artificial   Intelligence in Knowledge   Management Systems...  
  
  -- 1 --
  
  This is a sample document containing redundant \r\n line breaks,   
  unnecessary   spaces, and page numbers.
`;

const cleaned = cleanText(rawSampleText);
console.log('Original Text Length:', rawSampleText.length);
console.log('Cleaned Text Length:', cleaned.length);
console.log('Cleaned Result:\n"' + cleaned + '"');
console.log('✅ Text Cleaner Status: PASSED\n');

// 2. TEST TEXT CHUNKER
console.log('--- [2/4] TESTING TEXT CHUNKER ---');
const sampleLongDoc = `
Artificial Intelligence (AI) has revolutionized how organizations manage, retrieve, and process knowledge. Traditional Knowledge Management Systems (KMS) relied heavily on manually tagged documents, rigid folder hierarchies, and keyword-based search queries that often missed relevant context.

With the advent of Retrieval-Augmented Generation (RAG) and Vector Databases, modern AI-KMS platforms store document content as high-dimensional numerical vectors (embeddings). When a user asks a question, the system searches for semantically similar chunks rather than exact string matches.

This system splits long documents into overlapping text chunks (typically 500 to 1000 characters) so that precise document passages can be retrieved and fed into a Large Language Model (LLM) for context-grounded response generation.
`.repeat(3);

const chunks = chunkText(sampleLongDoc, { chunkSize: 400, chunkOverlap: 50 });
console.log(`Generated Chunks Count: ${chunks.length}`);
chunks.forEach((chunk, i) => {
  console.log(`  Chunk #${chunk.chunkIndex} [${chunk.charCount} chars]: "${chunk.text.substring(0, 60)}..."`);
});
console.log('✅ Text Chunker Status: PASSED\n');

// 3. CHECK OLLAMA CONNECTIVITY
console.log('--- [3/4] TESTING OLLAMA EMBEDDING SERVICE STATUS ---');
try {
  const ollamaRes = await fetch('http://localhost:11434/api/tags');
  if (ollamaRes.ok) {
    const data = await ollamaRes.json();
    console.log('✅ Ollama status: RUNNING (Local models available: ' + (data.models ? data.models.map(m => m.name).join(', ') : 'None') + ')');
  } else {
    console.log('⚠️ Ollama status: OFFLINE or Not Responding (HTTP ' + ollamaRes.status + ')');
  }
} catch (err) {
  console.log('⚠️ Ollama status: OFFLINE (Could not connect to http://localhost:11434)');
  console.log('   -> To enable embeddings: install & run Ollama (ollama run nomic-embed-text)');
}
console.log('');

// 4. CHECK CHROMADB CONNECTIVITY
console.log('--- [4/4] TESTING CHROMADB VECTOR STORE STATUS ---');
try {
  const chromaRes = await fetch('http://localhost:8000/api/v1/heartbeat');
  if (chromaRes.ok) {
    const data = await chromaRes.json();
    console.log('✅ ChromaDB status: RUNNING (' + JSON.stringify(data) + ')');
  } else {
    console.log('⚠️ ChromaDB status: OFFLINE or Not Responding (HTTP ' + chromaRes.status + ')');
  }
} catch (err) {
  console.log('⚠️ ChromaDB status: OFFLINE (Could not connect to http://localhost:8000)');
  console.log('   -> To enable vector storage: run ChromaDB (chroma run --path ./chroma_db or via Docker)');
}

console.log('\n==================================================');
