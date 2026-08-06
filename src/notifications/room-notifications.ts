import type {
  NotificationCategory,
  NotificationTone,
} from "./NotificationProvider";

export interface NotificationActor {
  display: string;
  id: string;
  type: "human" | "chat_bot" | "mod_bot";
}

export interface NotificationRoomEvent {
  actorId: string | null;
  occurredAt: string;
  payload: Record<string, unknown>;
  sequence: string;
  type: string;
}

export interface RoomNotification {
  category: NotificationCategory;
  dedupeKey: string;
  eventSequence: string;
  message?: string;
  title: string;
  tone: NotificationTone;
}

const messageTypes = new Set(["message_posted", "content_posted"]);
const conversationReturnAfterMs = 30 * 60_000;
const researchRequestPattern =
  /\b(?:latest|current|today|tonight|now|news|headlines?|weather|forecast|scores?|standings?|prices?|exchange rates?|schedules?|election results?|release dates?|what time|time in)\b/i;

const record = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

const payloadString = (
  event: NotificationRoomEvent,
  key: string,
): string | null => {
  const value = event.payload[key];
  return typeof value === "string" ? value : null;
};

const eventText = (event: NotificationRoomEvent): string => {
  const content = payloadString(event, "content");

  if (content !== null) {
    return content;
  }

  const parts = event.payload.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => record(part))
    .filter((part): part is Record<string, unknown> => part !== null)
    .filter((part) => part.kind === "text" && typeof part.text === "string")
    .map((part) => String(part.text))
    .join(" ")
    .trim();
};

const excerpt = (value: string): string => {
  const flattened = value.replace(/\s+/g, " ").trim();

  if (flattened.length <= 140) {
    return flattened;
  }

  return `${flattened.slice(0, 137).trimEnd()}...`;
};

const contentItemId = (event: NotificationRoomEvent): string | null =>
  payloadString(event, "contentItemId");

const repliedContentItemId = (event: NotificationRoomEvent): string | null => {
  const reply = record(event.payload.replyTo);
  return reply !== null && typeof reply.contentItemId === "string"
    ? reply.contentItemId
    : null;
};

const addressesActor = (
  event: NotificationRoomEvent,
  actorId: string,
): boolean =>
  Array.isArray(event.payload.addressedTo) &&
  event.payload.addressedTo.some((value) => {
    const address = record(value);
    return address?.targetType === "actor" && address.actorId === actorId;
  });

const originalContent = (
  event: NotificationRoomEvent,
  events: readonly NotificationRoomEvent[],
): NotificationRoomEvent | null => {
  const replyTo = repliedContentItemId(event);

  if (replyTo === null) {
    return null;
  }

  return (
    events.find((candidate) => contentItemId(candidate) === replyTo) ?? null
  );
};

const targetAffectsActor = (
  event: NotificationRoomEvent,
  events: readonly NotificationRoomEvent[],
  actorId: string,
): boolean => {
  const target = record(event.payload.target);

  if (target?.targetType === "actor") {
    return target.actorId === actorId;
  }

  if (
    (target?.targetType === "content_item" ||
      target?.targetType === "content_part") &&
    typeof target.contentItemId === "string"
  ) {
    return events.some(
      (candidate) =>
        candidate.actorId === actorId &&
        contentItemId(candidate) === target.contentItemId,
    );
  }

  return false;
};

const actorName = (
  actorId: string | null,
  actors: ReadonlyMap<string, NotificationActor>,
): string =>
  actorId === null ? "Someone" : (actors.get(actorId)?.display ?? "Someone");

const notification = (
  event: NotificationRoomEvent,
  category: NotificationCategory,
  title: string,
  tone: NotificationTone,
  message?: string,
): RoomNotification => ({
  category,
  dedupeKey: `room-event:${event.sequence}`,
  eventSequence: event.sequence,
  ...(message === undefined || message.length === 0 ? {} : { message }),
  title,
  tone,
});

const moderationNotification = (
  event: NotificationRoomEvent,
  events: readonly NotificationRoomEvent[],
  localActorId: string,
): RoomNotification | null => {
  if (event.actorId === localActorId && event.type === "actor_muted") {
    return notification(
      event,
      "moderation",
      "You were muted in this room",
      "warning",
      "Open the room for the related action and context.",
    );
  }

  if (event.actorId === localActorId && event.type === "actor_unmuted") {
    return notification(event, "moderation", "You were unmuted", "success");
  }

  if (
    event.actorId === localActorId &&
    event.type === "actor_left" &&
    event.payload.reason === "moderation"
  ) {
    return notification(
      event,
      "moderation",
      "You were removed from this room",
      "error",
    );
  }

  if (
    event.type === "content_removed" &&
    event.payload.reason === "moderation"
  ) {
    const removedId = payloadString(event, "contentItemId");
    const owned = events.some(
      (candidate) =>
        candidate.actorId === localActorId &&
        contentItemId(candidate) === removedId,
    );

    return owned
      ? notification(
          event,
          "moderation",
          "One of your messages was removed",
          "warning",
        )
      : null;
  }

  if (
    event.type === "moderation_action_applied" &&
    targetAffectsActor(event, events, localActorId)
  ) {
    const proposalId = payloadString(event, "proposalId");
    const enforcementExists =
      proposalId !== null &&
      events.some(
        (candidate) =>
          BigInt(candidate.sequence) > BigInt(event.sequence) &&
          payloadString(candidate, "proposalId") === proposalId &&
          (candidate.type === "actor_muted" ||
            candidate.type === "actor_unmuted" ||
            candidate.type === "actor_left" ||
            candidate.type === "content_removed"),
      );

    if (!enforcementExists) {
      const action = payloadString(event, "action")?.replace(/_/g, " ");
      return notification(
        event,
        "moderation",
        "A mod bot action affected you",
        "warning",
        action === null || action === undefined ? undefined : action,
      );
    }
  }

  return null;
};

export const classifyRoomEvent = (
  event: NotificationRoomEvent,
  events: readonly NotificationRoomEvent[],
  actors: ReadonlyMap<string, NotificationActor>,
  localActorId: string,
): RoomNotification | null => {
  const moderation = moderationNotification(event, events, localActorId);

  if (moderation !== null) {
    return moderation;
  }

  if (event.type === "research_answer_ready") {
    const targetActorId = payloadString(event, "actorId");
    return targetActorId === localActorId
      ? notification(
          event,
          "research",
          "Your research answer is ready",
          "success",
          excerpt(payloadString(event, "summary") ?? ""),
        )
      : null;
  }

  if (
    event.type === "research_session_started" ||
    event.type === "research_session_ended" ||
    event.type === "research_consent_updated" ||
    event.type === "research_participant_action_required"
  ) {
    return notification(
      event,
      "study",
      event.type === "research_session_started"
        ? "Research session started"
        : event.type === "research_session_ended"
          ? "Research session ended"
          : event.type === "research_consent_updated"
            ? "Research consent changed"
            : "Research study action required",
      event.type === "research_participant_action_required"
        ? "warning"
        : "info",
    );
  }

  if (
    event.type === "room_settings_changed" ||
    event.type === "room_rules_updated"
  ) {
    return notification(
      event,
      "room",
      event.type === "room_rules_updated"
        ? "Room rules changed"
        : "Room settings changed",
      "info",
    );
  }

  if (event.type === "room_invitation_created") {
    return payloadString(event, "actorId") === localActorId
      ? notification(event, "room", "You were invited to a room", "info")
      : null;
  }

  if (event.type === "actor_role_changed") {
    const targetActorId = payloadString(event, "actorId") ?? event.actorId;
    return targetActorId === localActorId
      ? notification(
          event,
          "room",
          "Your room role changed",
          "info",
          payloadString(event, "role") ?? undefined,
        )
      : null;
  }

  if (
    !messageTypes.has(event.type) ||
    event.actorId === null ||
    event.actorId === localActorId
  ) {
    return null;
  }

  const sender = actors.get(event.actorId);
  const senderName = actorName(event.actorId, actors);
  const original = originalContent(event, events);
  const repliesToLocal = original?.actorId === localActorId;
  const directlyAddressed = addressesActor(event, localActorId);

  if (repliesToLocal || directlyAddressed) {
    const message = excerpt(eventText(event));

    if (sender?.type === "mod_bot") {
      return notification(
        event,
        "moderation",
        `${senderName} contacted you about the room`,
        "warning",
        message,
      );
    }

    if (
      repliesToLocal &&
      sender?.type === "chat_bot" &&
      original !== null &&
      researchRequestPattern.test(eventText(original))
    ) {
      return notification(
        event,
        "research",
        `${senderName} answered your research request`,
        "success",
        message,
      );
    }

    return notification(
      event,
      "direct",
      repliesToLocal
        ? `${senderName} replied to you`
        : `${senderName} mentioned you`,
      "info",
      message,
    );
  }

  const eventIndex = events.findIndex(
    (candidate) => candidate.sequence === event.sequence,
  );
  const previousMessage = events
    .slice(0, Math.max(0, eventIndex))
    .reverse()
    .find((candidate) => messageTypes.has(candidate.type));

  if (
    previousMessage?.actorId === localActorId &&
    Date.parse(event.occurredAt) - Date.parse(previousMessage.occurredAt) >=
      conversationReturnAfterMs
  ) {
    return notification(
      event,
      "conversation",
      "A conversation you joined resumed",
      "info",
      `${senderName}: ${excerpt(eventText(event))}`,
    );
  }

  return null;
};

export const eventsAfterSequence = (
  events: readonly NotificationRoomEvent[],
  sequence: string,
): NotificationRoomEvent[] => {
  const cursor = BigInt(sequence);
  return events.filter((event) => BigInt(event.sequence) > cursor);
};
