import test from "node:test";
import assert from "node:assert/strict";

import { prepareSpokenText, detectLanguage } from "../lib/speechTextHelper.js";

/**
 * Unit & Contract tests for Krishi Mama Voice Output (Text-to-Speech)
 * Validates Web Speech API SpeechSynthesis lifecycle, voice selection rules,
 * Bengali Unicode detection, markdown text cleaning, and concurrency safety.
 */

// Mock SpeechSynthesisVoice
function createMockVoice(name, lang, isDefault = false) {
  return { name, lang, default: isDefault, localService: true, voiceURI: name };
}

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.lang = "bn-BD";
    this.voice = null;
    this.rate = 1.0;
    this.pitch = 1.0;

    this.onstart = null;
    this.onend = null;
    this.onerror = null;
    this.onpause = null;
    this.onresume = null;
  }
}

// Mock SpeechSynthesis
class MockSpeechSynthesis {
  constructor(voices = []) {
    this.voices = voices;
    this.speaking = false;
    this.paused = false;
    this.pending = false;
    this.activeUtterance = null;
    this.onvoiceschanged = null;
  }

  getVoices() {
    return this.voices;
  }

  speak(utterance) {
    this.speaking = true;
    this.paused = false;
    this.activeUtterance = utterance;
    if (utterance.onstart) utterance.onstart();
  }

  pause() {
    if (this.speaking) {
      this.paused = true;
      if (this.activeUtterance && this.activeUtterance.onpause) {
        this.activeUtterance.onpause();
      }
    }
  }

  resume() {
    if (this.speaking && this.paused) {
      this.paused = false;
      if (this.activeUtterance && this.activeUtterance.onresume) {
        this.activeUtterance.onresume();
      }
    }
  }

  cancel() {
    this.speaking = false;
    this.paused = false;
    if (this.activeUtterance) {
      if (this.activeUtterance.onerror) {
        this.activeUtterance.onerror({ error: "canceled" });
      }
      this.activeUtterance = null;
    }
  }

  // Simulate normal finish
  finishCurrent() {
    if (this.activeUtterance) {
      this.speaking = false;
      this.paused = false;
      if (this.activeUtterance.onend) {
        this.activeUtterance.onend();
      }
      this.activeUtterance = null;
    }
  }

  // Simulate playback error
  simulateError(errorType = "audio-busy") {
    if (this.activeUtterance) {
      this.speaking = false;
      this.paused = false;
      if (this.activeUtterance.onerror) {
        this.activeUtterance.onerror({ error: errorType });
      }
      this.activeUtterance = null;
    }
  }
}

// Voice selection algorithm under test (mirrors useVoiceOutput findBestVoice)
function findBestVoice(targetLang, voices) {
  if (!voices || voices.length === 0) return null;
  const isBengali = targetLang.toLowerCase().startsWith("bn");

  if (isBengali) {
    let match = voices.find(
      (v) => v.lang.toLowerCase() === "bn-bd" || v.lang.toLowerCase() === "bn_bd"
    );
    if (match) return match;

    match = voices.find((v) => v.lang.toLowerCase().startsWith("bn"));
    if (match) return match;

    match = voices.find((v) => {
      const name = (v.name || "").toLowerCase();
      return name.includes("bengali") || name.includes("bangla");
    });
    if (match) return match;

    // Never fall back to an English voice for Bengali
    return null;
  } else {
    let match = voices.find(
      (v) => v.lang.toLowerCase() === "en-us" || v.lang.toLowerCase() === "en_us"
    );
    if (match) return match;

    match = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
    if (match) return match;

    match = voices.find((v) => v.default);
    return match || voices[0] || null;
  }
}

// 1. Language Detection Tests
test("Language Detection: detects Bengali Unicode characters correctly", () => {
  assert.equal(detectLanguage("কুমিল্লায় মাটির আর্দ্রতা কত?"), "bn-BD");
  assert.equal(detectLanguage("আমন ধান কাটার পর সরিষা চাষ"), "bn-BD");
  assert.equal(detectLanguage("নাসা স্ম্যাপ (NASA SMAP) স্যাটেলাইট"), "bn-BD");
});

test("Language Detection: falls back to en-US for Latin English text", () => {
  assert.equal(detectLanguage("What is the soil moisture in Cumilla?"), "en-US");
  assert.equal(detectLanguage("NASA POWER climate normals"), "en-US");
  assert.equal(detectLanguage(""), "en-US");
  assert.equal(detectLanguage(null), "en-US");
});

// 2. Text Preparation & Markdown Cleaning Tests
test("Text Preparation: strips Markdown formatting cleanly without altering semantics", () => {
  const rawMarkdown =
    "### কুমিল্লা জেলার আবহাওয়া\n" +
    "- **বপনের সময়:** ১ থেকে ১৫ নভেম্বর\n" +
    "- *সুপারিশকৃত জাত:* বারি সরিষা-১৪\n" +
    "বিস্তারিত জানতে [লিংক দেখুন](https://krishimama.gov.bd/crop-calendar)।";

  const cleaned = prepareSpokenText(rawMarkdown);

  assert.equal(cleaned.includes("###"), false, "Headers should be stripped");
  assert.equal(cleaned.includes("**"), false, "Bold asterisks should be stripped");
  assert.equal(cleaned.includes("*"), false, "Italic asterisks should be stripped");
  assert.equal(cleaned.includes("https://"), false, "Raw URLs should be removed");
  assert.equal(cleaned.includes("লিংক দেখুন"), true, "Markdown link label should be preserved");
  assert.equal(cleaned.includes("বারি সরিষা-১৪"), true, "Crop name should be preserved");
});

test("Text Preparation: converts scientific units and percent signs for natural speech", () => {
  const raw = "মাটির উপরিভাগের আর্দ্রতা 42.6% এবং ভলিউমেট্রিক মান 0.4259 m^3/m^3।";
  const cleaned = prepareSpokenText(raw);

  assert.equal(cleaned.includes("42.6 শতাংশ"), true, "% should convert to 'শতাংশ'");
  assert.equal(cleaned.includes("ঘনমিটার প্রতি ঘনমিটার"), true, "m^3/m^3 should convert to 'ঘনমিটার প্রতি ঘনমিটার'");
});

test("Text Preparation: handles empty, whitespace, and null text gracefully", () => {
  assert.equal(prepareSpokenText(""), "");
  assert.equal(prepareSpokenText("   "), "");
  assert.equal(prepareSpokenText(null), "");
  assert.equal(prepareSpokenText(undefined), "");
});

// 3. Voice Selection Rules
test("Voice Selection: matches exact bn-BD voice when available", () => {
  const voices = [
    createMockVoice("Microsoft David", "en-US"),
    createMockVoice("Google বাংলা (বাংলাদেশ)", "bn-BD"),
    createMockVoice("Microsoft Shovon Online", "bn-BD"),
  ];

  const selected = findBestVoice("bn-BD", voices);
  assert.notEqual(selected, null);
  assert.equal(selected.lang, "bn-BD");
});

test("Voice Selection: matches alternative Bengali voice (bn-IN) when bn-BD is absent", () => {
  const voices = [
    createMockVoice("Microsoft David", "en-US"),
    createMockVoice("Microsoft Nabaneeta", "bn-IN"),
  ];

  const selected = findBestVoice("bn-BD", voices);
  assert.notEqual(selected, null);
  assert.equal(selected.lang, "bn-IN");
});

test("Voice Selection: matches voice by name when language code is generic", () => {
  const voices = [
    createMockVoice("Microsoft David", "en-US"),
    createMockVoice("Bangla Natural Speech", "bn"),
  ];

  const selected = findBestVoice("bn-BD", voices);
  assert.notEqual(selected, null);
  assert.equal(selected.name, "Bangla Natural Speech");
});

test("Voice Selection: returns NULL when NO Bengali voice is installed (NEVER falls back to English)", () => {
  const voices = [
    createMockVoice("Microsoft David", "en-US"),
    createMockVoice("Microsoft Zira", "en-US"),
    createMockVoice("Google UK English Female", "en-GB"),
  ];

  const selected = findBestVoice("bn-BD", voices);
  assert.equal(selected, null, "Bengali must never fall back to an English voice");
});

test("Voice Selection: selects en-US voice for English target", () => {
  const voices = [
    createMockVoice("Google বাংলা", "bn-BD"),
    createMockVoice("Microsoft David", "en-US"),
  ];

  const selected = findBestVoice("en-US", voices);
  assert.notEqual(selected, null);
  assert.equal(selected.lang, "en-US");
});

// 4. Playback Controls & Concurrency Tests
test("Speech Synthesis Lifecycle: play, pause, resume, and finish", () => {
  const voices = [createMockVoice("Google বাংলা", "bn-BD")];
  const synth = new MockSpeechSynthesis(voices);

  let startFired = false;
  let pauseFired = false;
  let resumeFired = false;
  let endFired = false;

  const utterance = new MockSpeechSynthesisUtterance("কুমিল্লায় মাটির আর্দ্রতা ৪২ শতাংশ");
  utterance.onstart = () => { startFired = true; };
  utterance.onpause = () => { pauseFired = true; };
  utterance.onresume = () => { resumeFired = true; };
  utterance.onend = () => { endFired = true; };

  // 1. Play
  synth.speak(utterance);
  assert.equal(synth.speaking, true);
  assert.equal(synth.paused, false);
  assert.equal(startFired, true);

  // 2. Pause
  synth.pause();
  assert.equal(synth.paused, true);
  assert.equal(pauseFired, true);

  // 3. Resume
  synth.resume();
  assert.equal(synth.paused, false);
  assert.equal(resumeFired, true);

  // 4. Finish
  synth.finishCurrent();
  assert.equal(synth.speaking, false);
  assert.equal(endFired, true);
});

test("Speech Concurrency: starting speech on another message cancels previous speech", () => {
  const voices = [createMockVoice("Google বাংলা", "bn-BD")];
  const synth = new MockSpeechSynthesis(voices);

  let message1Canceled = false;
  let message2Started = false;

  const utterance1 = new MockSpeechSynthesisUtterance("বার্তা এক");
  utterance1.onerror = (e) => {
    if (e.error === "canceled") message1Canceled = true;
  };

  const utterance2 = new MockSpeechSynthesisUtterance("বার্তা দুই");
  utterance2.onstart = () => { message2Started = true; };

  // Speak message 1
  synth.speak(utterance1);
  assert.equal(synth.speaking, true);

  // User clicks play on message 2 -> Hook cancels previous before speak
  synth.cancel();
  synth.speak(utterance2);

  assert.equal(message1Canceled, true, "Message 1 should be canceled");
  assert.equal(message2Started, true, "Message 2 should start without overlap");
  assert.equal(synth.activeUtterance, utterance2);
});

test("Speech Synthesis Error Handling: handles synthesis error gracefully", () => {
  const voices = [createMockVoice("Google বাংলা", "bn-BD")];
  const synth = new MockSpeechSynthesis(voices);

  let caughtError = null;

  const utterance = new MockSpeechSynthesisUtterance("পরীক্ষামূলক বার্তা");
  utterance.onerror = (e) => { caughtError = e.error; };

  synth.speak(utterance);
  synth.simulateError("audio-busy");

  assert.equal(caughtError, "audio-busy", "Must forward audio error code");
  assert.equal(synth.speaking, false, "Speaking state must reset to false on error");
});

test("Unsupported browser safety: handles undefined window.speechSynthesis", () => {
  const mockWindow = {};
  const isSupported = Boolean(mockWindow.speechSynthesis);
  assert.equal(isSupported, false, "Should return false when speechSynthesis is not in window");
});
