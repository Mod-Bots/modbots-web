import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyRoomEvent,
  eventsAfterSequence,
} from "./room-notifications.ts";

const human = { id: "human", display: "Mina#1234", type: "human" };
const bot = { id: "bot", display: "Felix", type: "chat_bot" };
const mod = { id: "mod", display: "Iris", type: "mod_bot" };
const actors = new Map([human, bot, mod].map((actor) => [actor.id, actor]));
const at = (minute) =>
  `2026-08-07T12:${String(minute).padStart(2, "0")}:00.000Z`;
const message = (sequence, actorId, content, extra = {}) => ({
  sequence: String(sequence),
  type: "message_posted",
  actorId,
  occurredAt: at(sequence),
  payload: {
    content,
    contentItemId: `content-${sequence}`,
    ...extra,
  },
});

test("notifies a participant about replies but not ordinary bot chat", () => {
  const question = message(1, "human", "Does anyone like carnivals?");
  const reply = message(2, "bot", "I enjoy the music.", {
    replyTo: { contentItemId: "content-1" },
  });
  const ordinary = message(3, "bot", "Carnivals preserve heritage.");
  const events = [question, reply, ordinary];

  assert.equal(
    classifyRoomEvent(reply, events, actors, "human")?.category,
    "direct",
  );
  assert.equal(classifyRoomEvent(ordinary, events, actors, "human"), null);
});

test("recognizes a researched answer to the participant's current question", () => {
  const question = message(1, "human", "What is the latest news today?");
  const reply = message(2, "bot", "Here are today's main stories.", {
    replyTo: { contentItemId: "content-1" },
  });
  const result = classifyRoomEvent(reply, [question, reply], actors, "human");

  assert.equal(result?.category, "research");
  assert.match(result?.title ?? "", /answered your research request/);
});

test("treats a direct mod bot message as moderation-purpose contact", () => {
  const direct = message(2, "mod", "Please keep this discussion on topic.", {
    addressedTo: [{ targetType: "actor", actorId: "human" }],
  });
  const result = classifyRoomEvent(direct, [direct], actors, "human");

  assert.equal(result?.category, "moderation");
  assert.match(result?.title ?? "", /Iris contacted you/);
});

test("notifies only the affected participant about moderation enforcement", () => {
  const muted = {
    sequence: "4",
    type: "actor_muted",
    actorId: "human",
    occurredAt: at(4),
    payload: { reason: "moderation" },
  };

  assert.equal(
    classifyRoomEvent(muted, [muted], actors, "human")?.category,
    "moderation",
  );
  assert.equal(classifyRoomEvent(muted, [muted], actors, "other"), null);
});

test("notifies when a conversation resumes after meaningful silence", () => {
  const participant = message(1, "human", "I wonder how that works.");
  const resumed = {
    ...message(2, "bot", "There is another part worth considering."),
    occurredAt: "2026-08-07T12:45:00.000Z",
  };
  const result = classifyRoomEvent(
    resumed,
    [participant, resumed],
    actors,
    "human",
  );

  assert.equal(result?.category, "conversation");
});

test("filters replayed events from the persisted notification cursor", () => {
  const events = [
    message(10, "human", "one"),
    message(11, "bot", "two"),
    message(12, "bot", "three"),
  ];

  assert.deepEqual(
    eventsAfterSequence(events, "10").map((event) => event.sequence),
    ["11", "12"],
  );
});
