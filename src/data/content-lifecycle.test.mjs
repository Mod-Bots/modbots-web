import assert from "node:assert/strict";
import test from "node:test";
import { projectContentLifecycle } from "./content-lifecycle.ts";

const event = (sequence, type, payload, actorId = "human") => ({
  sequence: String(sequence),
  type,
  actorId,
  payload,
  occurredAt: `2026-08-07T12:0${sequence}:00.000Z`,
});

test("projects an edit onto the original message", () => {
  const posted = event(1, "message_posted", {
    contentItemId: "content-1",
    content: "Before",
  });
  const edited = event(2, "content_edited", {
    contentItemId: "content-1",
    revision: 2,
    parts: [{ partId: "part-1", kind: "text", text: "After" }],
  });

  assert.deepEqual(projectContentLifecycle([posted, edited]), [
    {
      ...posted,
      payload: {
        contentItemId: "content-1",
        parts: [{ partId: "part-1", kind: "text", text: "After" }],
        revision: 2,
        editedAt: edited.occurredAt,
      },
    },
  ]);
});

test("removes content from the visible chatroom without removing other events", () => {
  const posted = event(1, "content_posted", {
    contentItemId: "content-1",
    parts: [{ partId: "asset-1", kind: "image", mediaAssetId: "media-1" }],
  });
  const joined = event(2, "actor_joined", {}, "other");
  const removed = event(3, "content_removed", {
    contentItemId: "content-1",
  });

  assert.deepEqual(projectContentLifecycle([posted, joined, removed]), [
    joined,
  ]);
});

test("keeps the text when an attachment is removed by an edit", () => {
  const posted = event(1, "content_posted", {
    contentItemId: "content-1",
    parts: [
      { partId: "text-1", kind: "text", text: "Keep this" },
      { partId: "asset-1", kind: "image", mediaAssetId: "media-1" },
    ],
  });
  const edited = event(2, "content_edited", {
    contentItemId: "content-1",
    revision: 2,
    parts: [{ partId: "text-1", kind: "text", text: "Keep this" }],
  });

  const [projected] = projectContentLifecycle([posted, edited]);
  assert.deepEqual(projected.payload.parts, edited.payload.parts);
});
