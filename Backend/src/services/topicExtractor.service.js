import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';

/**
 * Clean and normalize a topic or subtopic name string
 */
export const sanitizeTopicName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return null;

  // Remove leading numbers, bullet points, brackets, e.g. "1. ", "1.2 ", "- ", "• "
  let clean = rawName
    .replace(/^[\d\.\-\)\:\•\*\#\s]+/, '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim();

  if (!clean || clean.length < 3 || clean.length > 75) return null;

  // Filter out noise / data records / table rows:
  const isSpecialCsTermWithDigit = /\b(1-Tier|2-Tier|3-Tier|2-PL|1NF|2NF|3NF|BCNF|4NF|5NF|IPv4|IPv6)\b/i.test(clean);
  if (/\b\d+\s+\d+\b/.test(clean)) return null;
  if (/\b\d+\b/.test(clean) && !isSpecialCsTermWithDigit) return null;
  if (/\d{3,}/.test(clean)) return null;

  // Common Indian cities / data row artifacts
  if (/\b(delhi|kolkata|durgapur|bihar|rajasthan|haryana|punjab|gurgaon|rohtak|hisar|ranchi|suresh|ramesh|harsh|pratik|riyanka|deep|saptarhi)\b/i.test(clean)) return null;

  // Code / SQL operations / query steps
  if (/^(read|write|lock|unlock|commit|insert|delete|select|drop|create)\b/i.test(clean) && /[\(\)\-]/.test(clean)) return null;
  if (/^(figure|table|page)\s*\d+/i.test(clean)) return null;
  if (/\b(seconds of|volume \d+%|all rights reserved|copyright|leaf nodes|linked list|now whenever|o\(log\s*n\)|search o\(|insert o\(|delete o\()\b/i.test(clean)) return null;

  // Department abbreviations from student table rows
  if (/\b(CSE|ECE|IT|ME|CE)\b/.test(clean) && !clean.toLowerCase().includes('database')) return null;

  // Sample data identifiers like "C1", "C2"
  if (/^c\d+\b/i.test(clean)) return null;

  // Single names in uppercase
  if (/^[A-Z\s]{4,}$/.test(clean) && !clean.includes('DBMS') && !clean.includes('SQL') && !clean.includes('ACID') && !clean.includes('ER') && !clean.includes('RDBMS')) return null;

  // Sentence check: must not end with a dangling preposition / conjunction
  if (/\b(a|an|the|of|in|to|with|and|or|for|is|are|on)$/i.test(clean)) return null;

  // Word count check
  const words = clean.split(/\s+/);
  const recognizedSingleWords = /^(indexing|normalization|transactions|concurrency|deadlocks|schemas|views|databases|storage|hashing|serialization)$/i;
  if (words.length < 2 && !recognizedSingleWords.test(clean)) {
    return null;
  }

  // Capitalize properly
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

/**
 * Extract hierarchical parent topics and child subtopics from raw text
 * (Supports PDF textbooks/notes, Markdown documents with # and ##, and TXT files)
 */
export const extractHierarchicalTopicsFromRawText = (text, defaultTopic = '', docTitle = '') => {
  const parents = [];
  const seenParents = new Set();

  if (!text || typeof text !== 'string') return parents;

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Check if text is Markdown formatted (# Chapter, ## Subheading)
  const hasMarkdownHeadings = lines.some((l) => /^#{1,3}\s+/.test(l));

  if (hasMarkdownHeadings) {
    let currentParent = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // H1 (# ) or H2 (## ) as Parent
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

      // H2 or H3 as Subtopic
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

  // Numbered chapters / sections in textbook or syllabus PDFs:
  // e.g. "1. All about DBMS", "2. Database Architecture", "7. Introduction to ER-Model"
  const mainChapterRegex = /^(\d+)\.\s+([A-Za-z][A-Za-z0-9\s,\-&/()]+)$/;
  const subtopicNumRegex = /^(\d+\.\d+)\s*[\.\:\-]?\s+([A-Za-z][A-Za-z0-9\s,\-&/()]+)$/;

  let currentParent = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for main chapter heading: "1. All about DBMS"
    const mainMatch = line.match(mainChapterRegex);
    if (mainMatch) {
      const num = parseInt(mainMatch[1], 10);
      const rawTitle = mainMatch[2].trim();
      const cleanTitle = sanitizeTopicName(rawTitle);

      // Recognize numbered chapters up to 30
      if (
        num >= 1 &&
        num <= 30 &&
        cleanTitle &&
        !cleanTitle.toLowerCase().startsWith('now whenever') &&
        !cleanTitle.toLowerCase().startsWith('insert o(') &&
        !cleanTitle.toLowerCase().startsWith('delete o(')
      ) {
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
      // 1. Numbered subtopics like "7.1", "7.2"
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

      // 2. Standalone conceptual subheadings within the chapter
      if (
        line.length >= 8 &&
        line.length <= 55 &&
        !line.endsWith('.') &&
        !line.endsWith(',') &&
        !line.includes(':') &&
        /^[A-Z][A-Za-z0-9\s\-&()]+$/.test(line) &&
        /\b(Features|Architecture|Languages|Advantages|Disadvantages|Types|Model|Calculus|Algebra|Normal|Commands|Objects|Views|Indexes|Properties|Techniques|Levels|Protocol|Locking|Recovery|Security|Abstraction|Independence|Concepts|Decomposition|Serializability|Process|Threads?|Scheduling|Deadlocks?|Memory|Paging|Virtual|Storage|Routing|Layer|Congestion|Algorithm|Analysis|Tree|Graph|Sorting|Design|Testing|Lifecycle|Pattern|Paradigm|Component|Operations?|Functions?|Structures?|Fundamentals?|Principles?|Overview)\b/i.test(
          line
        )
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

  // If no numbered chapters were found, fallback to section headings or default topic
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
