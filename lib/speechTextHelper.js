/**
 * Speech Text Helper for Krishi Mama Voice Output (Text-to-Speech).
 * 
 * Prepares raw assistant markdown text for natural, clean speech synthesis:
 * - Strips Markdown syntax (bold, italic, headers, bullet points).
 * - Converts markdown links [label](url) to their clean human-readable label.
 * - Strips raw URLs.
 * - Converts scientific units and percent signs to spoken Bengali/English terms.
 * - Preserves all crucial safety warnings, dates, numbers, and limitations.
 * - Detects Bengali Unicode characters to select the proper language model.
 */

/**
 * Strips formatting while preserving essential semantic content.
 * Does NOT alter the original text rendered in the chat UI.
 * 
 * @param {string} rawText 
 * @returns {string} Cleaned plain text ready for SpeechSynthesisUtterance.
 */
export function prepareSpokenText(rawText) {
  if (!rawText || typeof rawText !== "string") return "";

  let text = rawText;

  // 1. Remove markdown links: [label](url) -> label
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 2. Remove raw HTTP/HTTPS URLs
  text = text.replace(/https?:\/\/\S+/g, "");

  // 3. Remove Markdown headers (#, ##, ###)
  text = text.replace(/^#{1,6}\s+/gm, "");

  // 4. Remove bold & italic formatting: **text**, *text*, __text__, _text_
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");

  // 5. Remove bullet list markers: * item, - item, • item
  text = text.replace(/^[-*•]\s+/gm, "");

  // 6. Natural spoken unit replacements (Bengali-aware)
  text = text.replace(/m\^3\/m\^3/g, "ঘনমিটার প্রতি ঘনমিটার");
  text = text.replace(/m³\/m³/g, "ঘনমিটার প্রতি ঘনমিটার");
  text = text.replace(/(\d+(\.\d+)?)%/g, "$1 শতাংশ");

  // 7. Remove code block backticks `code`
  text = text.replace(/`([^`]+)`/g, "$1");

  // 8. Collapse excessive linebreaks into natural sentence pauses
  text = text.replace(/\n+/g, " ");
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Detects whether the text is predominantly Bengali or English based on Unicode codepoints.
 * 
 * Bengali Unicode Range: U+0980 to U+09FF
 * 
 * @param {string} text 
 * @returns {"bn-BD" | "en-US"}
 */
export function detectLanguage(text) {
  if (!text || typeof text !== "string") return "en-US";
  const hasBengali = /[\u0980-\u09FF]/.test(text);
  return hasBengali ? "bn-BD" : "en-US";
}
