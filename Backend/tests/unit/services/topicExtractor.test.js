import { describe, it, expect } from 'vitest';
import { sanitizeTopicName } from '../../../src/services/topicExtractor.service.js';

describe('Service: topicExtractor (sanitizeTopicName)', () => {
  it('should clean and normalize genuine academic topic names', () => {
    expect(sanitizeTopicName('1. Process Synchronization')).toBe('Process Synchronization');
    expect(sanitizeTopicName('• Deadlock Prevention Strategies')).toBe('Deadlock Prevention Strategies');
    expect(sanitizeTopicName('Chapter 3: Virtual Memory and Paging')).toBe('Chapter 3: Virtual Memory and Paging');
    expect(sanitizeTopicName('3.1 - Demand Paging')).toBe('Demand Paging');
  });

  it('should reject questions, MCQs, and practice prompts', () => {
    expect(sanitizeTopicName('What is CPU scheduling?')).toBeNull();
    expect(sanitizeTopicName('Which of the following is true?')).toBeNull();
    expect(sanitizeTopicName('Select the correct answer: ____')).toBeNull();
  });

  it('should reject URLs, page numbers, and copyright noise', () => {
    expect(sanitizeTopicName('https://geeksforgeeks.org/os')).toBeNull();
    expect(sanitizeTopicName('Page 14')).toBeNull();
    expect(sanitizeTopicName('All Rights Reserved 2026')).toBeNull();
    expect(sanitizeTopicName('12345')).toBeNull();
  });

  it('should reject names that are too short (< 3 chars) or too long (> 75 chars)', () => {
    expect(sanitizeTopicName('ab')).toBeNull();
    expect(sanitizeTopicName('A'.repeat(80))).toBeNull();
  });
});
