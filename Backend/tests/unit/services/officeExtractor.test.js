import { describe, it, expect } from 'vitest';
import {
  extractTextFromPptx,
  extractTextFromDocx,
  extractOfficeDocumentText,
  readZipEntries,
} from '../../../src/services/officeExtractor.js';
import zlib from 'zlib';

describe('Service: officeExtractor', () => {
  it('should return empty string for non-existent file path or non-zip buffer', () => {
    expect(extractOfficeDocumentText('')).toBe('');
    expect(extractOfficeDocumentText('non_existent_file.pptx')).toBe('');
    expect(readZipEntries(Buffer.from('not a zip file'))).toEqual([]);
  });

  it('should extract text from PPTX buffer entries correctly', () => {
    // Construct a minimal in-memory zip structure with slide1.xml
    const slide1Xml = `<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p>
            <a:r><a:t>Lessons for Entrepreneurs</a:t></a:r>
          </a:p>
          <a:p>
            <a:r><a:t>Solve a real problem &amp; win.</a:t></a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

    const fileName = 'ppt/slides/slide1.xml';
    const nameBuffer = Buffer.from(fileName, 'utf8');
    const compData = zlib.deflateRawSync(Buffer.from(slide1Xml, 'utf8'));

    // Local file header: 30 bytes + nameLen + data
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); // Signature
    header.writeUInt16LE(20, 4); // Min version
    header.writeUInt16LE(0, 6); // Flags
    header.writeUInt16LE(8, 8); // Method: Deflate
    header.writeUInt32LE(0, 10); // Time/Date
    header.writeUInt32LE(0, 14); // CRC
    header.writeUInt32LE(compData.length, 18); // Comp size
    header.writeUInt32LE(slide1Xml.length, 22); // Uncomp size
    header.writeUInt16LE(nameBuffer.length, 26); // Name length
    header.writeUInt16LE(0, 28); // Extra length

    const zipBuffer = Buffer.concat([header, nameBuffer, compData]);
    const entries = readZipEntries(zipBuffer);

    expect(entries.length).toBe(1);
    expect(entries[0].name).toBe('ppt/slides/slide1.xml');
    expect(entries[0].xml).toContain('Lessons for Entrepreneurs');
  });

  it('should extract text from DOCX document.xml entry', () => {
    const docXml = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>Introduction to Startups</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Key concept: product market fit.</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

    const fileName = 'word/document.xml';
    const nameBuffer = Buffer.from(fileName, 'utf8');
    const compData = zlib.deflateRawSync(Buffer.from(docXml, 'utf8'));

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(8, 8);
    header.writeUInt32LE(compData.length, 18);
    header.writeUInt32LE(docXml.length, 22);
    header.writeUInt16LE(nameBuffer.length, 26);
    header.writeUInt16LE(0, 28);

    const zipBuffer = Buffer.concat([header, nameBuffer, compData]);
    const entries = readZipEntries(zipBuffer);

    expect(entries.length).toBe(1);
    expect(entries[0].name).toBe('word/document.xml');
    expect(entries[0].xml).toContain('Introduction to Startups');
  });
});
