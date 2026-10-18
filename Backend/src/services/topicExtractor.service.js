import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';

/**
 * Clean and normalize a topic or subtopic name string
 */
/**
 * Clean and normalize a topic or subtopic name string universally for any academic subject
 */
export const sanitizeTopicName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return null;

  // Remove leading numbers, bullet points, brackets, e.g. "1. ", "1.2 ", "- ", "• ", "# "
  let clean = rawName
    .replace(/^[\d\.\-\)\:\•\*\#\s]+/, '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim();

  // Length constraints for a genuine academic heading
  if (!clean || clean.length < 3 || clean.length > 75) return null;

  // Reject URLs, emails, or file paths
  if (/\b(https?:\/\/|www\.|\.com|\.org|\.edu|\.net|@)\b/i.test(clean)) return null;

  // Reject pure numbers or noisy numeric codes (e.g. "12345", "1 2 3")
  if (/^\d+$/.test(clean) || /\b\d{3,}\b/.test(clean)) return null;

  // Reject document meta artifacts (Page numbers, figures, tables, copyright)
  if (/^(page|fig|figure|table|slide|sheet)\s*[\d\.\:\-]/i.test(clean)) return null;
  if (/\b(all rights reserved|copyright|volume \d+|edition|issn|isbn|courtesy of)\b/i.test(clean)) return null;

  // Reject questions, MCQs, and practice exercises
  if (/\?/.test(clean)) return null;
  if (/_{2,}/.test(clean) || /\.{3,}/.test(clean)) return null; // Fill-in-the-blank blanks: "____" or "...."
  if (/\b(which of the following|what is|pick the odd|fill in the|choose the|state whether|consider the following|explain why|calculate the|find the|true or false|select the correct)\b/i.test(clean)) return null;
  if (/\b(is known as|is called as|is defined as|can be defined|picks? the|are known as|odd man out)\b/i.test(clean)) return null;
  if (/^(the action of|any type|if there is|write the|check for|compute the|based on the|various steps|step \d+|in the above|consider the|add augment|for example|let us consider)\b/i.test(clean)) return null;

  // Sentence check: A heading must not end with a dangling preposition, article, or conjunction
  if (/\b(a|an|the|of|in|to|with|and|or|for|is|are|on|at|by|from)$/i.test(clean)) return null;

  // Ensure reasonable word count
  const words = clean.split(/\s+/);
  if (words.length > 12) return null; // Paragraphs / sentences disguised as headings

  // Capitalize first letter
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

/**
 * Universal Heuristic Fallback: Extract hierarchical parent topics and child subtopics from raw text
 * (Supports Markdown # / ##, academic Unit/Chapter/Module keywords, and numbered outlines)
 */
export const extractHierarchicalTopicsFromRawText = (text, defaultTopic = '', docTitle = '') => {
  const parents = [];
  const seenParents = new Set();

  if (!text || typeof text !== 'string') return parents;

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Markdown documents with # (Parent) and ## (Subtopic)
  const hasMarkdownHeadings = lines.some((l) => /^#{1,3}\s+/.test(l));
  if (hasMarkdownHeadings) {
    let currentParent = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match) {
        const title = sanitizeTopicName(h1Match[1]);
        if (title && !seenParents.has(title.toLowerCase())) {
          seenParents.add(title.toLowerCase());
          currentParent = { name: title, subtopics: [] };
          parents.push(currentParent);
          continue;
        }
      }

      const subMatch = line.match(/^#{2,3}\s+(.+)$/);
      if (subMatch) {
        const subTitle = sanitizeTopicName(subMatch[1]);
        if (subTitle) {
          if (!currentParent) {
            currentParent = {
              name: defaultTopic || docTitle || 'Core Concepts',
              subtopics: [],
            };
            parents.push(currentParent);
          }
          if (!currentParent.subtopics.some((s) => s.toLowerCase() === subTitle.toLowerCase())) {
            currentParent.subtopics.push(subTitle);
          }
        }
      }
    }

    if (parents.length > 0) return parents;
  }

  // 2. Academic Unit / Chapter / Module patterns (e.g. "UNIT-I", "Chapter 1: ...", "MODULE 2")
  const unitRegex = /^(UNIT|MODULE|CHAPTER|PART|SECTION)\s*[-:\s]?\s*([0-9IVXLCDM]+)[\.\:\-]?\s*(.*)$/i;
  const mainChapterRegex = /^(\d{1,2})\.\s+([A-Z][A-Za-z0-9\s,\-&/()]+)$/;
  const subtopicNumRegex = /^(\d+\.\d+)\s*[\.\:\-]?\s+([A-Za-z][A-Za-z0-9\s,\-&/()]+)$/;

  let currentParent = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for "UNIT I", "Chapter 1: ...", "MODULE 3"
    const unitMatch = line.match(unitRegex);
    if (unitMatch) {
      const unitType = unitMatch[1].toUpperCase();
      const unitNum = unitMatch[2].toUpperCase();
      const rawTitle = unitMatch[3] ? unitMatch[3].trim() : '';
      const cleanSubTitle = sanitizeTopicName(rawTitle);
      const parentName = cleanSubTitle ? `${unitType}-${unitNum}: ${cleanSubTitle}` : `${unitType}-${unitNum}`;

      if (!seenParents.has(parentName.toLowerCase())) {
        seenParents.add(parentName.toLowerCase());
        currentParent = { name: parentName, subtopics: [] };
        parents.push(currentParent);
        continue;
      }
    }

    // Check for numbered chapter heading: "1. Introduction to ..."
    const mainMatch = line.match(mainChapterRegex);
    if (mainMatch) {
      const num = parseInt(mainMatch[1], 10);
      const rawTitle = mainMatch[2].trim();
      const cleanTitle = sanitizeTopicName(rawTitle);

      if (num >= 1 && num <= 30 && cleanTitle) {
        if (!seenParents.has(cleanTitle.toLowerCase())) {
          seenParents.add(cleanTitle.toLowerCase());
          currentParent = {
            number: num,
            name: cleanTitle,
            subtopics: [],
          };
          parents.push(currentParent);
          continue;
        }
      }
    }

    // Check for subtopics under current parent
    if (currentParent) {
      // A. Numbered subtopics like "1.1", "1.2"
      const subNumMatch = line.match(subtopicNumRegex);
      if (subNumMatch) {
        const cleanSub = sanitizeTopicName(subNumMatch[2]);
        if (
          cleanSub &&
          !currentParent.subtopics.some((s) => s.toLowerCase() === cleanSub.toLowerCase()) &&
          cleanSub.toLowerCase() !== currentParent.name.toLowerCase()
        ) {
          currentParent.subtopics.push(cleanSub);
        }
        continue;
      }

      // B. Concise Title-Case subheadings within a chapter
      if (
        line.length >= 6 &&
        line.length <= 60 &&
        !line.endsWith('.') &&
        !line.endsWith(',') &&
        !line.includes(':') &&
        /^[A-Z][A-Za-z0-9\s\-&()]+$/.test(line)
      ) {
        const cleanSub = sanitizeTopicName(line);
        if (
          cleanSub &&
          !currentParent.subtopics.some((s) => s.toLowerCase() === cleanSub.toLowerCase()) &&
          cleanSub.toLowerCase() !== currentParent.name.toLowerCase()
        ) {
          currentParent.subtopics.push(cleanSub);
        }
      }
    }
  }

  // 3. Fallback if no structured units were matched
  if (parents.length === 0) {
    const standaloneTopics = [];
    const seen = new Set();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(\d+(\.\d+)?)\s*[\.\:\-]?\s+([A-Za-z][A-Za-z0-9\s,\-&/()]+)$/);
      if (match) {
        const clean = sanitizeTopicName(match[3]);
        if (clean && !seen.has(clean.toLowerCase())) {
          seen.add(clean.toLowerCase());
          standaloneTopics.push(clean);
        }
      }
    }

    if (standaloneTopics.length > 0) {
      parents.push({
        name: defaultTopic || docTitle || 'Key Study Topics',
        subtopics: standaloneTopics,
      });
    }
  }

  return parents;
};

/**
 * AI-Powered Topic Extraction using Gemini
 * Extracts real academic chapters and conceptual subtopics while strictly ignoring MCQs, practice questions, and paragraph text.
 */
export const extractHierarchicalTopicsWithAI = async (rawText, docTitle = '', subjectName = '') => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !rawText || rawText.trim().length < 50) return null;

    // Grab first 35,000 characters which contains syllabus, table of contents, and major unit headings
    const snippet = rawText.substring(0, 35000);

    const prompt = `You are an expert academic curriculum analyzer for an AI Knowledge Management System (AI-KMS).
Analyze the following text extracted from an academic study document / textbook / lecture notes (${docTitle || subjectName || 'Study Material'}) and extract the real academic chapters or units and their conceptual subtopics.

STRICT RULES:
1. ONLY extract genuine academic topics, chapters/units, and conceptual subtopics.
2. COMPLETELY IGNORE multiple-choice questions (MCQs), questions starting with "Which of the following", practice exercises, numbered exam questions, exam instructions, author names, college headers, and page numbers.
3. Return a clean JSON array with this exact structure:
[
  {
    "name": "Chapter or Unit Name (e.g. Unit-I: Language Translation & Lexical Analysis)",
    "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"]
  }
]
4. Return ONLY valid raw JSON (no markdown formatting, no other explanation).

DOCUMENT TEXT:
${snippet}`;

    const models = [
      process.env.GEMINI_MODEL,
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-pro',
      'gemini-pro-latest',
    ].filter(Boolean);

    for (const model of models) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const cleanJson = text.replace(/^```json/m, '').replace(/```$/m, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const formatted = parsed
                .filter((c) => c && c.name && typeof c.name === 'string')
                .map((c) => ({
                  name: c.name.trim(),
                  subtopics: Array.isArray(c.subtopics)
                    ? c.subtopics
                        .filter((s) => s && typeof s === 'string' && s.trim().length > 2)
                        .map((s) => s.trim())
                    : []
                }));
              if (formatted.length > 0) {
                console.log(`[TopicExtractor AI] Successfully extracted ${formatted.length} chapters using ${model}`);
                return formatted;
              }
            }
          }
        } else {
          console.warn(`[TopicExtractor AI] ${model} HTTP ${response.status}`);
        }
      } catch (err) {
        console.warn(`[TopicExtractor AI] Error with model ${model}:`, err.message);
      }
    }
  } catch (error) {
    console.warn('[TopicExtractor AI] Extraction error, falling back to regex:', error.message);
  }
  return null;
};

/**
 * Extract hierarchical topics from a document on disk or in DB
 */
export const extractTopicsFromDocument = async (doc) => {
  try {
    if (!doc) return [];

    let rawText = '';

    // If personal note
    if (doc.contentType === 'note' && doc.noteContent) {
      rawText = doc.noteContent;
    } else if (doc.filePath) {
      // Resolve path on disk
      const fullPath = path.isAbsolute(doc.filePath) && fs.existsSync(doc.filePath)
        ? doc.filePath
        : fs.existsSync(path.resolve(process.cwd(), doc.filePath))
        ? path.resolve(process.cwd(), doc.filePath)
        : path.resolve(process.cwd(), 'Backend', doc.filePath);

      if (fs.existsSync(fullPath)) {
        const isPdf = (doc.mimeType && doc.mimeType.includes('pdf')) || fullPath.endsWith('.pdf');
        if (isPdf) {
          const buffer = fs.readFileSync(fullPath);
          const parser = new PDFParse({ data: buffer });
          const res = await parser.getText();
          rawText = res.text || '';
          if (typeof parser.destroy === 'function') {
            await parser.destroy();
          }
        } else {
          // TXT, MD
          rawText = fs.readFileSync(fullPath, 'utf-8');
        }
      } else {
        console.warn(`[TopicExtractor] File not found on disk: ${doc.filePath}`);
      }
    }

    // 1. Try AI-powered curriculum extraction with Gemini (Filters out MCQs, exercises, noise)
    const aiExtracted = await extractHierarchicalTopicsWithAI(rawText, doc.title, doc.subject);
    if (Array.isArray(aiExtracted) && aiExtracted.length > 0) {
      return aiExtracted;
    }

    // 2. Fallback to heuristic parser
    const hierarchical = extractHierarchicalTopicsFromRawText(rawText, doc.topic, doc.title);
    return hierarchical;
  } catch (error) {
    console.error(`[TopicExtractor] Error extracting topics from doc ${doc._id || doc.title}:`, error.message);
    const fallback = [];
    if (doc.topic) {
      fallback.push({ name: doc.topic, subtopics: [] });
    }
    return fallback;
  }
};
