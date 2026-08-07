import type { RoomEvent } from "./contracts";

const contentItemId = (event: RoomEvent): string | null => {
  const value = event.payload.contentItemId;
  return typeof value === "string" ? value : null;
};

export const projectContentLifecycle = (events: RoomEvent[]): RoomEvent[] => {
  const projected: Array<RoomEvent | null> = [];
  const contentIndexes = new Map<string, number>();

  for (const event of events) {
    const itemId = contentItemId(event);

    if (event.type === "message_posted" || event.type === "content_posted") {
      projected.push(event);

      if (itemId !== null) {
        contentIndexes.set(itemId, projected.length - 1);
      }

      continue;
    }

    if (event.type === "content_edited") {
      const index = itemId === null ? undefined : contentIndexes.get(itemId);
      const original = index === undefined ? null : projected[index];

      if (index !== undefined && original !== null) {
        const {
          content: _content,
          sourceLanguage: _sourceLanguage,
          sourceText: _sourceText,
          ...originalPayload
        } = original.payload;

        projected[index] = {
          ...original,
          payload: {
            ...originalPayload,
            parts: event.payload.parts,
            revision: event.payload.revision,
            editedAt: event.occurredAt,
          },
        };
      }

      continue;
    }

    if (event.type === "content_removed") {
      const index = itemId === null ? undefined : contentIndexes.get(itemId);

      if (index !== undefined) {
        projected[index] = null;
      }

      continue;
    }

    projected.push(event);
  }

  return projected.filter((event): event is RoomEvent => event !== null);
};
