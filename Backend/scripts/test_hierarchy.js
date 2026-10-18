import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';

export function extractHierarchicalTopics(text, defaultTopic = '') {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Main chapter patterns: e.g. "1. All about DBMS", "2. Database Architecture", "7. Introduction to ER-Model"
  const mainChapterRegex = /^(\d+)\.\s+([A-Za-z][A-Za-z0-9\s,\-&/()]+)$/;
  const subtopicNumRegex = /^(\d+\.\d+)\s*[\.\:\-]?\s+([A-Za-z][A-Za-z0-9\s,\-&/()]+)$/;

  const parents = [];
  let currentParent = null;

  const sanitizeName = (raw) => {
    let clean = raw.replace(/^[\d\.\-\)\:\•\*\#\s]+/, '').replace(/[\r\n\t]+/g, ' ').trim();
    if (!clean || clean.length < 3 || clean.length > 75) return null;
    if (/\b\d+\s+\d+\b/.test(clean)) return null;
    if (/\d{3,}/.test(clean)) return null;
    if (/\b(delhi|kolkata|durgapur|bihar|rajasthan|haryana|punjab|gurgaon|rohtak|hisar|ranchi|suresh|ramesh|harsh|pratik|riyanka|deep|saptarhi)\b/i.test(clean)) return null;
    if (/^(figure|table|page)\s*\d+/i.test(clean)) return null;
    if (/\b(seconds of|volume \d+%|all rights reserved|copyright|leaf nodes|linked list|now whenever|o\(log\s*n\)|search o\(|insert o\(|delete o\()\b/i.test(clean)) return null;
    if (/\b(CSE|ECE|IT|ME|CE)\b/.test(clean) && !clean.toLowerCase().includes('database')) return null;
    if (/^c\d+\b/i.test(clean)) return null;
    if (/^[A-Z\s]{4,}$/.test(clean) && !clean.includes('DBMS') && !clean.includes('SQL') && !clean.includes('ACID') && !clean.includes('ER') && !clean.includes('RDBMS')) return null;
    if (/\b(a|an|the|of|in|to|with|and|or|for|is|are|on)$/i.test(clean)) return null;

    const words = clean.split(/\s+/);
    const recognizedSingleWords = /^(indexing|normalization|transactions|concurrency|deadlocks|schemas|views|databases|storage|hashing|serialization)$/i;
    if (words.length < 2 && !recognizedSingleWords.test(clean)) return null;

    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line is a numbered parent chapter (1. , 2. , 3. ... up to 25)
    const mainMatch = line.match(mainChapterRegex);
    if (mainMatch) {
      const num = parseInt(mainMatch[1], 10);
      const rawTitle = mainMatch[2].trim();
      const cleanTitle = sanitizeName(rawTitle);

      if (num >= 1 && num <= 25 && cleanTitle && !cleanTitle.toLowerCase().startsWith('now whenever') && !cleanTitle.toLowerCase().startsWith('insert o(') && !cleanTitle.toLowerCase().startsWith('delete o(')) {
        currentParent = {
          number: num,
          name: cleanTitle,
          subtopics: [],
        };
        parents.push(currentParent);
        continue;
      }
    }

    // Check if line is a subtopic under the current parent
    if (currentParent) {
      // 1. Numbered subtopic (e.g. 7.1, 7.2)
      const subNumMatch = line.match(subtopicNumRegex);
      if (subNumMatch) {
        const cleanSub = sanitizeName(subNumMatch[2]);
        if (cleanSub && !currentParent.subtopics.some(s => s.toLowerCase() === cleanSub.toLowerCase()) && cleanSub.toLowerCase() !== currentParent.name.toLowerCase()) {
          currentParent.subtopics.push(cleanSub);
        }
        continue;
      }

      // 2. Heading phrases inside the chapter
      if (
        line.length >= 8 && line.length <= 55 &&
        !line.endsWith('.') && !line.endsWith(',') && !line.includes(':') &&
        /^[A-Z][A-Za-z0-9\s\-&()]+$/.test(line) &&
        /\b(Features|Architecture|Languages|Advantages|Disadvantages|Types|Model|Calculus|Algebra|Normal|Commands|Objects|Views|Indexes|Properties|Techniques|Levels|Protocol|Locking|Recovery|Security|Abstraction|Independence|Concepts|Decomposition|Serializability)\b/i.test(line)
      ) {
        const cleanSub = sanitizeName(line);
        if (cleanSub && !currentParent.subtopics.some(s => s.toLowerCase() === cleanSub.toLowerCase()) && cleanSub.toLowerCase() !== currentParent.name.toLowerCase()) {
          currentParent.subtopics.push(cleanSub);
        }
      }
    }
  }

  // De-duplicate parent chapters if any duplicates (e.g. same chapter title)
  const uniqueParents = [];
  const seenParentNames = new Set();
  for (const p of parents) {
    if (!seenParentNames.has(p.name.toLowerCase())) {
      seenParentNames.add(p.name.toLowerCase());
      uniqueParents.push(p);
    }
  }

  return uniqueParents;
}

async function run() {
  const filePath = path.resolve('uploads/1791915293189-621272573.pdf');
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  
  const hierarchy = extractHierarchicalTopics(result.text, 'Database Management System');
  console.log(`Extracted ${hierarchy.length} Parent Chapters:`);
  hierarchy.forEach((p, idx) => {
    console.log(`\n${idx + 1}. [Parent] ${p.name} (${p.subtopics.length} child subtopics)`);
    p.subtopics.forEach((s, sIdx) => {
      console.log(`    ├── ${s}`);
    });
  });
}

run().catch(console.error);
