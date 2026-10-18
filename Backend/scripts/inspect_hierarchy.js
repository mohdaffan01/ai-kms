import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';

async function testHierarchy() {
  const filePath = path.resolve('uploads/1791915293189-621272573.pdf');
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const text = result.text;

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const mainChapterRegex = /^(\d+)\.\s+([A-Za-z][A-Za-z0-9\s,\-&/()]+)$/;
  const subtopicRegex = /^(\d+\.\d+)\s*[\.\:\-]?\s+([A-Za-z][A-Za-z0-9\s,\-&/()]+)$/;

  let currentChapter = null;
  const chapters = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const mainMatch = line.match(mainChapterRegex);
    if (mainMatch) {
      const num = parseInt(mainMatch[1], 10);
      const title = mainMatch[2].trim();
      // Real chapter numbers between 1 and 25
      if (
        num >= 1 &&
        num <= 25 &&
        !/\d{3,}/.test(title) &&
        !/\b(delhi|kolkata|suresh|ramesh|harsh|search)\b/i.test(title)
      ) {
        currentChapter = { number: num, title, subtopics: [] };
        chapters.push(currentChapter);
        continue;
      }
    }

    if (currentChapter) {
      const subMatch = line.match(subtopicRegex);
      if (subMatch) {
        const subTitle = subMatch[2].trim();
        if (!/\d{3,}/.test(subTitle) && !/\b(delhi|kolkata)\b/i.test(subTitle)) {
          if (!currentChapter.subtopics.some((s) => s.toLowerCase() === subTitle.toLowerCase())) {
            currentChapter.subtopics.push(subTitle);
          }
        }
      } else if (
        line.length >= 8 &&
        line.length <= 48 &&
        !line.endsWith('.') &&
        !line.endsWith(',') &&
        !line.includes(':') &&
        /^[A-Z][A-Za-z0-9\s\-&()]+$/.test(line) &&
        /\b(Features|Architecture|Languages|Advantages|Disadvantages|Types|Model|Calculus|Algebra|Normal|Commands|Objects|Views|Indexes|Properties|Techniques|Levels|Protocol|Locking)\b/i.test(
          line
        )
      ) {
        if (!currentChapter.subtopics.some((s) => s.toLowerCase() === line.toLowerCase())) {
          currentChapter.subtopics.push(line);
        }
      }
    }
  }

  console.log(`Detected ${chapters.length} Chapters:`);
  chapters.forEach((c) => {
    console.log(`\nParent ${c.number}. ${c.title} (${c.subtopics.length} subtopics):`);
    c.subtopics.forEach((s) => console.log(`   └─ ${s}`));
  });
}

testHierarchy().catch(console.error);
