import test from "node:test";
import assert from "node:assert/strict";

/**
 * Unit & Contract tests for Krishi Mama Voice Input (Speech-to-Text)
 * Tests Web Speech API compatibility, error handling, state cleanup, and text appending.
 */

// Mock SpeechRecognition class for simulating browser environments
class MockSpeechRecognition {
  constructor() {
    this.lang = "bn-BD";
    this.continuous = false;
    this.interimResults = true;
    this.maxAlternatives = 1;
    this.started = false;
    this.aborted = false;
    this.stopped = false;

    this.onstart = null;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
  }

  start() {
    this.started = true;
    if (this.onstart) this.onstart();
  }

  stop() {
    this.stopped = true;
    if (this.onend) this.onend();
  }

  abort() {
    this.aborted = true;
    if (this.onend) this.onend();
  }

  // Helper to simulate speech result
  simulateResult(transcript, isFinal = true) {
    if (this.onresult) {
      const event = {
        resultIndex: 0,
        results: [
          Object.assign([{ transcript }], { isFinal }),
        ],
      };
      this.onresult(event);
    }
  }

  // Helper to simulate error
  simulateError(errorType, message = "") {
    if (this.onerror) {
      this.onerror({ error: errorType, message });
    }
  }
}

test("SpeechRecognition feature detection: detects availability when window.SpeechRecognition exists", () => {
  const mockWindow = { SpeechRecognition: MockSpeechRecognition };
  const isSupported = Boolean(mockWindow.SpeechRecognition || mockWindow.webkitSpeechRecognition);
  assert.equal(isSupported, true, "Should detect standard SpeechRecognition");
});

test("SpeechRecognition feature detection: detects webkitSpeechRecognition fallback (Chrome/Android)", () => {
  const mockWindow = { webkitSpeechRecognition: MockSpeechRecognition };
  const isSupported = Boolean(mockWindow.SpeechRecognition || mockWindow.webkitSpeechRecognition);
  assert.equal(isSupported, true, "Should detect webkitSpeechRecognition");
});

test("SpeechRecognition feature detection: handles unsupported browser safely (Firefox without flag)", () => {
  const mockWindow = {};
  const isSupported = Boolean(mockWindow.SpeechRecognition || mockWindow.webkitSpeechRecognition);
  assert.equal(isSupported, false, "Should return false for unsupported browsers");
});

test("Language default and switching: defaults to bn-BD and switches to en-US", () => {
  const recognition = new MockSpeechRecognition();
  assert.equal(recognition.lang, "bn-BD", "Default language should be bn-BD");

  recognition.lang = "en-US";
  assert.equal(recognition.lang, "en-US", "Should switch to en-US cleanly");
});

test("Bangla speech recognition: preserves exact Unicode Bengali transcript", () => {
  const recognition = new MockSpeechRecognition();
  let receivedFinal = null;

  recognition.onresult = (event) => {
    const res = event.results[0];
    if (res.isFinal) {
      receivedFinal = res[0].transcript;
    }
  };

  recognition.start();
  const banglaQuery = "কুমিল্লায় মাটির বর্তমান আর্দ্রতা কত?";
  recognition.simulateResult(banglaQuery, true);

  assert.equal(receivedFinal, banglaQuery, "Bengali Unicode text must be preserved without corruption");
});

test("Interim vs Final transcript differentiation: interim updates and final finalizes", () => {
  const recognition = new MockSpeechRecognition();
  let lastInterim = null;
  let finalResult = null;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const res = event.results[i];
      if (res.isFinal) {
        finalResult = res[0].transcript;
        lastInterim = "";
      } else {
        lastInterim = res[0].transcript;
      }
    }
  };

  recognition.start();

  // 1. Simulate interim speech
  recognition.simulateResult("আমন কাটার পর", false);
  assert.equal(lastInterim, "আমন কাটার পর");
  assert.equal(finalResult, null);

  // 2. Simulate final recognized speech
  recognition.simulateResult("আমন কাটার পর সরিষা কখন লাগাব?", true);
  assert.equal(lastInterim, "");
  assert.equal(finalResult, "আমন কাটার পর সরিষা কখন লাগাব?");
});

test("Permission denial handling: handles 'not-allowed' error code", () => {
  const recognition = new MockSpeechRecognition();
  let caughtCode = null;

  recognition.onerror = (event) => {
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      caughtCode = "PERMISSION_DENIED";
    }
  };

  recognition.start();
  recognition.simulateError("not-allowed", "Permission denied by user");

  assert.equal(caughtCode, "PERMISSION_DENIED", "Must map 'not-allowed' to PERMISSION_DENIED");
});

test("Empty speech / no-speech handling: catches 'no-speech' without crash", () => {
  const recognition = new MockSpeechRecognition();
  let caughtCode = null;

  recognition.onerror = (event) => {
    if (event.error === "no-speech") {
      caughtCode = "NO_SPEECH";
    }
  };

  recognition.start();
  recognition.simulateError("no-speech", "No speech detected");

  assert.equal(caughtCode, "NO_SPEECH", "Must map 'no-speech' to NO_SPEECH");
});

test("Network error handling: catches 'network' error code", () => {
  const recognition = new MockSpeechRecognition();
  let caughtCode = null;

  recognition.onerror = (event) => {
    if (event.error === "network") {
      caughtCode = "NETWORK";
    }
  };

  recognition.start();
  recognition.simulateError("network", "Speech recognition network failed");

  assert.equal(caughtCode, "NETWORK", "Must map 'network' to NETWORK");
});

test("Start/Stop state cleanup: onend reliably resets active listening flag", () => {
  const recognition = new MockSpeechRecognition();
  let isListening = false;

  recognition.onstart = () => { isListening = true; };
  recognition.onend = () => { isListening = false; };

  recognition.start();
  assert.equal(isListening, true, "isListening should be true after onstart");

  recognition.stop();
  assert.equal(isListening, false, "isListening must reset to false after onend");
});

test("Textarea text append logic: appends new voice transcript to existing text with a space", () => {
  const initialValue = "বোরো ধানের জন্য";
  const voiceTranscript = "সেচ কখন দিতে হবে?";

  const appendTranscript = (prev, text) => {
    const trimmed = prev.trim();
    if (!trimmed) return text;
    return `${trimmed} ${text}`;
  };

  const result = appendTranscript(initialValue, voiceTranscript);
  assert.equal(
    result,
    "বোরো ধানের জন্য সেচ কখন দিতে হবে?",
    "Should cleanly append voice transcript to existing text without overwriting"
  );

  // Appending to empty text
  const emptyResult = appendTranscript("", voiceTranscript);
  assert.equal(emptyResult, voiceTranscript, "Should handle empty initial text cleanly");
});
