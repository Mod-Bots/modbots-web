import type { RoomSummary } from "./contracts";

export const mediaStatusCapability = "media_status";

export const supportsMediaStatus = (
  room: Pick<RoomSummary, "capabilities"> | undefined,
): boolean => room?.capabilities.includes(mediaStatusCapability) ?? false;
