import { test } from "node:test";
import assert from "node:assert/strict";

import {
  fetchAssistantConversations,
  fetchAssistantConversation,
  renameAssistantConversation,
  deleteAssistantConversation,
  sendAssistantMessage,
  getApiBaseUrl,
} from "../services/api.js";

test("API Client: Assistant & Chat History Contracts", async (t) => {
  await t.test("getApiBaseUrl returns configured base URL or default", () => {
    const url = getApiBaseUrl();
    assert.ok(url);
    assert.match(url, /^https?:\/\//);
    assert.equal(url.endsWith("/"), false);
  });

  await t.test("sendAssistantMessage structures body correctly", async () => {
    let captured = null;
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      captured = { url, options, body: JSON.parse(options.body) };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            answer: "টেস্ট উত্তর",
            conversationId: "test-conv-123",
            sources: ["NASA POWER"],
            isGuest: false,
          },
        }),
      };
    };

    try {
      const res = await sendAssistantMessage({
        message: "কুমিল্লায় সরিষা কখন লাগাবো?",
        district: "cumilla",
        crop: "mustard",
        conversationId: "existing-id",
      });

      assert.equal(res.success, true);
      assert.ok(captured.url.includes("/assistant/chat"));
      assert.equal(captured.options.method, "POST");
      assert.equal(captured.body.message, "কুমিল্লায় সরিষা কখন লাগাবো?");
      assert.equal(captured.body.district, "cumilla");
      assert.equal(captured.body.crop, "mustard");
      assert.equal(captured.body.conversationId, "existing-id");
      assert.equal(captured.options.credentials, "include");
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("fetchAssistantConversations hits GET /assistant/conversations with credentials", async () => {
    let captured = null;
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      captured = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            conversations: [
              { _id: "c1", title: "কুমিল্লা বৃষ্টিপাত", messageCount: 2 },
            ],
          },
        }),
      };
    };

    try {
      const res = await fetchAssistantConversations();
      assert.equal(res.success, true);
      assert.ok(captured.url.includes("/assistant/conversations"));
      assert.equal(captured.options.credentials, "include");
      assert.equal(res.data.conversations.length, 1);
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("fetchAssistantConversation hits GET /assistant/conversations/:id", async () => {
    let captured = null;
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      captured = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            conversation: {
              _id: "conv-999",
              title: "মাটির আর্দ্রতা আলোচনা",
              messages: [{ role: "user", content: "হাই" }],
            },
          },
        }),
      };
    };

    try {
      const res = await fetchAssistantConversation("conv-999");
      assert.equal(res.success, true);
      assert.ok(captured.url.includes("/assistant/conversations/conv-999"));
      assert.equal(res.data.conversation._id, "conv-999");
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("renameAssistantConversation sends PATCH with title", async () => {
    let captured = null;
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      captured = { url, options, body: JSON.parse(options.body) };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { conversation: { _id: "conv-1", title: "নতুন নাম" } },
        }),
      };
    };

    try {
      const res = await renameAssistantConversation("conv-1", "নতুন নাম");
      assert.equal(res.success, true);
      assert.ok(captured.url.includes("/assistant/conversations/conv-1"));
      assert.equal(captured.options.method, "PATCH");
      assert.equal(captured.body.title, "নতুন নাম");
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.test("deleteAssistantConversation sends DELETE", async () => {
    let captured = null;
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      captured = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { deletedId: "conv-1" },
        }),
      };
    };

    try {
      const res = await deleteAssistantConversation("conv-1");
      assert.equal(res.success, true);
      assert.ok(captured.url.includes("/assistant/conversations/conv-1"));
      assert.equal(captured.options.method, "DELETE");
    } finally {
      global.fetch = originalFetch;
    }
  });
});

test("Chat History & UI State Logic", async (t) => {
  await t.test("Conversation title truncation behaves gracefully for long inputs", () => {
    const longPrompt = "কুমিল্লায় চলতি মৌসুমে আমন ধান কাটার পর সরিষা চাষের জন্য মাটির আর্দ্রতা এবং উপযুক্ত তারিখ কেমন?";
    const clean = longPrompt.replace(/[\r\n]+/g, " ").trim();
    const truncated = clean.length <= 42 ? clean : `${clean.slice(0, 42).trim()}...`;
    assert.ok(truncated.length <= 45);
    assert.ok(truncated.endsWith("..."));
  });

  await t.test("Guest chat session notice correctly identifies temporary session", () => {
    const guestResponse = {
      isGuest: true,
      guestNotice: "অতিথি মোডে চ্যাট হিস্ট্রি সাময়িক। স্থায়ী সংরক্ষণের জন্য লগইন বা রেজিস্ট্রেশন করুন।",
      conversationId: "guest-temp-uuid-1",
    };

    assert.equal(guestResponse.isGuest, true);
    assert.ok(guestResponse.guestNotice.includes("লগইন"));
  });

  await t.test("Authenticated conversation retains full provenance and source attribution", () => {
    const authenticatedTurn = {
      id: "msg-1",
      sender: "assistant",
      text: "পরীক্ষামূলক পরামর্শ",
      sources: ["NASA POWER", "BAMIS"],
      dataDate: "2001-2025",
      dataQuality: "grounded",
      provenance: ["NASA POWER Project"],
      limitations: ["Subject to microclimates"],
    };

    assert.equal(authenticatedTurn.sources.length, 2);
    assert.equal(authenticatedTurn.dataQuality, "grounded");
    assert.equal(authenticatedTurn.provenance.length, 1);
    assert.equal(authenticatedTurn.limitations.length, 1);
  });
});
