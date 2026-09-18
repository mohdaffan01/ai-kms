export const getBrowserWindow = () => (typeof window !== 'undefined' ? window : null);

export const supportsVoiceInput = (browserWindow = getBrowserWindow()) => {
  if (!browserWindow) return false;
  return !!(browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition);
};

export const getVoiceRecognitionCtor = (browserWindow = getBrowserWindow()) => {
  if (!browserWindow) return null;

  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition || null;
};

export const supportsTextToSpeech = (browserWindow = getBrowserWindow()) => {
  if (!browserWindow || !browserWindow.speechSynthesis) return false;
  return typeof browserWindow.speechSynthesis.speak === 'function';
};

export const extractVoiceTranscript = (event) => {
  if (!event || !event.results || !event.results.length) {
    return '';
  }

  const results = Array.from(event.results);
  const currentResult = typeof event.resultIndex === 'number' ? results[event.resultIndex] : null;
  const latestResult = currentResult || results[results.length - 1] || results[0];
  const transcript = latestResult && latestResult[0] ? latestResult[0].transcript : '';

  return (transcript || '').trim();
};

export const speakText = (browserWindow = getBrowserWindow(), text = '', onEndCallback) => {
  if (!text || !supportsTextToSpeech(browserWindow)) return false;

  if (!browserWindow.SpeechSynthesisUtterance) {
    return false;
  }

  browserWindow.speechSynthesis.cancel();
  const utterance = new browserWindow.SpeechSynthesisUtterance(text);
  
  if (typeof onEndCallback === 'function') {
    utterance.onend = onEndCallback;
    utterance.onerror = onEndCallback;
  }

  browserWindow.speechSynthesis.speak(utterance);
  return true;
};

export const stopSpeaking = (browserWindow = getBrowserWindow()) => {
  if (browserWindow && browserWindow.speechSynthesis) {
    browserWindow.speechSynthesis.cancel();
  }
};
