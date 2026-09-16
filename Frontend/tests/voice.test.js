import test from 'node:test';
import assert from 'node:assert/strict';

import {
  supportsVoiceInput,
  supportsTextToSpeech,
  getVoiceRecognitionCtor,
  speakText,
  extractVoiceTranscript,
} from '../src/utils/voice.js';

test('detects browser speech recognition support', () => {
  const fakeWindow = {
    SpeechRecognition: function DummySpeechRecognition() {},
  };

  assert.equal(supportsVoiceInput(fakeWindow), true);
  assert.equal(getVoiceRecognitionCtor(fakeWindow), fakeWindow.SpeechRecognition);
});

test('detects browser text-to-speech support', () => {
  const fakeWindow = {
    speechSynthesis: {
      speak: () => {},
    },
  };

  assert.equal(supportsTextToSpeech(fakeWindow), true);
});

test('falls back safely when speech synthesis is unavailable', () => {
  const fakeWindow = {};

  assert.doesNotThrow(() => speakText(fakeWindow, 'Hello there'));
  assert.equal(supportsVoiceInput(fakeWindow), false);
  assert.equal(supportsTextToSpeech(fakeWindow), false);
});

test('uses the current speech result instead of repeating earlier partial phrases', () => {
  const fakeEvent = {
    resultIndex: 2,
    results: [
      [{ transcript: 'What' }],
      [{ transcript: 'What can' }],
      [{ transcript: 'What can you do for me' }],
    ],
  };

  assert.equal(extractVoiceTranscript(fakeEvent), 'What can you do for me');
});
