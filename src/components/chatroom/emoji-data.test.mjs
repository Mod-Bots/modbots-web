import assert from "node:assert/strict";
import test from "node:test";
import { emojiOnlyGraphemes } from "./emoji-data.ts";

test("recognizes one to three emoji graphemes", () => {
  assert.deepEqual(emojiOnlyGraphemes("👋"), ["👋"]);
  assert.deepEqual(emojiOnlyGraphemes("  👩‍💻 🎉  "), ["👩‍💻", "🎉"]);
  assert.deepEqual(emojiOnlyGraphemes("❤️ 👍 🥳"), ["❤️", "👍", "🥳"]);
});

test("keeps text and larger emoji runs in the normal message style", () => {
  assert.equal(emojiOnlyGraphemes("Hello 👋"), null);
  assert.equal(emojiOnlyGraphemes("😀 😃 😄 😁"), null);
  assert.equal(emojiOnlyGraphemes(""), null);
});
