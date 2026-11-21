/**
 * Service: Office Document Extractor (PPTX / DOCX)
 * Pure native zero-dependency extractor using Node.js built-in zlib
 * for reading Open XML slides and document structures.
 */

import fs from 'fs';
import zlib from 'zlib';

/**
 * Decode basic XML entities
 * @param {string} str
 * @returns {string}
 */
const decodeXml = (str) => {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
};

/**
 * Parse local file headers and extract entries from a ZIP archive (PPTX / DOCX)
 * @param {string|Buffer} source - File path or Buffer
 * @returns {Array<{ name: string, xml: string }>}
 */
export const readZipEntries = (source) => {
  const buffer = typeof source === 'string' ? fs.readFileSync(source) : source;
  if (!buffer || buffer.length < 30) return [];

  // Check for ZIP local file header signature 0x04034b50 ('PK\x03\x04')
  if (buffer.readUInt32LE(0) !== 0x04034b50) {
    return [];
  }

  let offset = 0;
  const entries = [];

  while (offset <= buffer.length - 30) {
    if (buffer.readUInt32LE(offset) === 0x04034b50) {
      const method = buffer.readUInt16LE(offset + 8);
      const compSize = buffer.readUInt32LE(offset + 18);
      const nameLen = buffer.readUInt16LE(offset + 26);
      const extraLen = buffer.readUInt16LE(offset + 28);

      const nameStart = offset + 30;
      const nameEnd = nameStart + nameLen;
      if (nameEnd > buffer.length) break;

      const name = buffer.toString('utf8', nameStart, nameEnd);
      const dataStart = nameEnd + extraLen;
      const dataEnd = dataStart + compSize;

      if (dataEnd <= buffer.length && compSize > 0) {
        const compData = buffer.slice(dataStart, dataEnd);
        let xml = '';
        try {
          if (method === 8) {
            // Deflate compression
            xml = zlib.inflateRawSync(compData).toString('utf8');
          } else if (method === 0) {
            // Uncompressed store
            xml = compData.toString('utf8');
          }
        } catch {
          // Ignore individual decompress failures
        }

        if (xml) {
          entries.push({ name, xml });
        }
      }

      offset = dataStart + compSize;
    } else {
      offset++;
    }
  }

  return entries;
};

/**
 * Extract clean textual content from a PowerPoint (.pptx) file
 * @param {string} filePath - Absolute or relative path to .pptx file
 * @returns {string} Formatted text grouped by slide
 */
export const extractTextFromPptx = (filePath) => {
  if (!fs.existsSync(filePath)) return '';

  const entries = readZipEntries(filePath);
  if (entries.length === 0) return '';

  // Filter slide XML files: ppt/slides/slide1.xml, ppt/slides/slide2.xml, etc.
  const slideEntries = entries.filter((e) => /^ppt\/slides\/slide\d+\.xml$/i.test(e.name));

  if (slideEntries.length === 0) return '';

  // Sort slides in natural numeric sequence
  slideEntries.sort((a, b) => {
    const numA = parseInt(a.name.match(/\d+/)[0], 10);
    const numB = parseInt(b.name.match(/\d+/)[0], 10);
    return numA - numB;
  });

  const slideTexts = slideEntries.map((slide, idx) => {
    const slideNumber = idx + 1;
    const texts = [];

    // Match DrawingML text tokens <a:t>...</a:t>
    const regex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
    let match;
    while ((match = regex.exec(slide.xml)) !== null) {
      const cleaned = decodeXml(match[1]).trim();
      if (cleaned) {
        texts.push(cleaned);
      }
    }

    if (texts.length === 0) {
      return `[Slide ${slideNumber}]`;
    }

    return `[Slide ${slideNumber}]\n${texts.join(' ')}`;
  });

  return slideTexts.join('\n\n');
};

/**
 * Extract clean textual content from a Word (.docx) file
 * @param {string} filePath - Path to .docx file
 * @returns {string} Formatted document text
 */
export const extractTextFromDocx = (filePath) => {
  if (!fs.existsSync(filePath)) return '';

  const entries = readZipEntries(filePath);
  const docEntry = entries.find((e) => e.name === 'word/document.xml');
  if (!docEntry || !docEntry.xml) return '';

  const paragraphs = [];
  const pRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
  let pMatch;

  while ((pMatch = pRegex.exec(docEntry.xml)) !== null) {
    const pContent = pMatch[1];
    const textTokens = [];
    const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      textTokens.push(decodeXml(tMatch[1]));
    }

    const paragraphText = textTokens.join('').trim();
    if (paragraphText) {
      paragraphs.push(paragraphText);
    }
  }

  return paragraphs.join('\n\n');
};

/**
 * Universal Office extractor: inspects extension and file signature
 * @param {string} filePath - Disk file path
 * @param {string} [mimeType=''] - Optional mimeType hint
 * @returns {string} Extracted text or empty string if not an Office XML format
 */
export const extractOfficeDocumentText = (filePath, mimeType = '') => {
  if (!filePath || !fs.existsSync(filePath)) return '';

  const lowerPath = filePath.toLowerCase();
  const lowerMime = (mimeType || '').toLowerCase();

  const isPptx =
    lowerPath.endsWith('.pptx') ||
    lowerPath.endsWith('.ppt') ||
    lowerMime.includes('presentation') ||
    lowerMime.includes('powerpoint');

  if (isPptx) {
    const text = extractTextFromPptx(filePath);
    if (text) return text;
  }

  const isDocx =
    lowerPath.endsWith('.docx') ||
    lowerPath.endsWith('.doc') ||
    lowerMime.includes('wordprocessingml') ||
    lowerMime.includes('msword');

  if (isDocx) {
    const text = extractTextFromDocx(filePath);
    if (text) return text;
  }

  return '';
};
