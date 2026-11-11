import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const assistantPath = new URL("../app/(app)/assistant/page.js", import.meta.url);
const sidebarPath = new URL("../components/layout/AppSidebar.js", import.meta.url);

test("Assistant UI preserves factual metadata and recoverable request state", async (t) => {
  const [assistant, sidebar] = await Promise.all([
    readFile(assistantPath, "utf8"),
    readFile(sidebarPath, "utf8"),
  ]);

  await t.test("retry resends the failed question without duplicating its user bubble", () => {
    assert.match(assistant, /handleSendMessage\(failedPrompt, \{ retry: true \}\)/);
    assert.match(assistant, /if \(!retry\)\s*\{\s*const userMessage/);
    assert.match(assistant, /sendInFlightRef\.current/);
  });

  await t.test("only an explicit observation date is presented as an observation date", () => {
    assert.match(assistant, /msg\.observationDate &&/);
    assert.doesNotMatch(assistant, /msg\.dataDate[\s\S]{0,400}Historical Observation/);
  });

  await t.test("composer is localized and discoverable without submitting a sample prompt", () => {
    assert.match(assistant, /placeholder=\{t\("assistant\.composerPlaceholder"\)\}/);
    assert.match(assistant, /aria-label=\{t\("assistant\.composerPlaceholder"\)\}/);
  });

  await t.test("conversation history exposes a retry when loading fails", () => {
    assert.match(sidebar, /historyError/);
    assert.match(sidebar, /onClick=\{\(\) => loadConversations\(\)\}/);
  });

  await t.test("speech output stays explicitly user-triggered", () => {
    assert.match(assistant, /const handleSpeakMessage = \(msg\) =>/);
    assert.match(assistant, /onClick=\{\(\) => handleSpeakMessage\(msg\)\}/);
  });

  await t.test("farm switching starts a new thread and restores saved farm context", () => {
    assert.match(assistant, /handleNewConversation\(nextFarmId\)/);
    assert.match(assistant, /setFarmSelection\(\{ queryFarmId: urlFarmId, farmId: savedFarmId \}\)/);
    assert.match(assistant, /farmQuery = selectedFarmId/);
  });

  await t.test("farm controls cannot change while a response is in flight", () => {
    assert.match(assistant, /onChange=\{\(e\) => handleFarmSelection\(e\.target\.value\)\}[\s\S]{0,100}disabled=\{isLoading\}/);
    assert.match(assistant, /onChange=\{\(e\) => setSelectedDistrict\(e\.target\.value\)\}[\s\S]{0,100}disabled=\{isLoading\}/);
  });
});
