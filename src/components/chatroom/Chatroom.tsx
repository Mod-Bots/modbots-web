"use client";

import html2canvas from "html2canvas-pro";
import {
  AtSign,
  Bell,
  Bot,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  CornerUpLeft,
  DoorOpen,
  FileAudio,
  FileText,
  Film,
  Gamepad2,
  Image,
  Info,
  Link as LinkIcon,
  LoaderCircle,
  LogOut,
  MapPin,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Quote,
  Reply,
  Search,
  Send,
  Shield,
  SmilePlus,
  Square,
  Trash2,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import type {
  CSSProperties,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
} from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import appLogo from "@/assets/logo.svg";
import startScreenBg from "@/assets/start-screen-bg.png";
import { projectContentLifecycle } from "@/data/content-lifecycle";
import type {
  Actor,
  ActorType,
  ChatLanguage,
  ContentAddress,
  ContentPartInput,
  RoomEvent,
  RoomSummary,
} from "@/data/contracts";
import { accountBaseUrl, consumeEnterAfterLogin } from "@/data/oauth";
import { isMutedError, mediaAssetDataUrl } from "@/data/platform";
import { actorLabel, actorRole } from "@/data/room-state";
import { useRoomActivity } from "@/hooks/useRoomActivity";
import { useUiLanguage } from "@/i18n/UiLanguageProvider";
import {
  type AppNotification,
  type NotificationCategory,
  type NotificationTone,
  useNotifications,
} from "@/notifications/NotificationProvider";
import {
  classifyRoomEvent,
  eventsAfterSequence,
} from "@/notifications/room-notifications";
import { releasedVersion } from "@/released-version";
import { AutomaticUpdateChecker } from "./AutomaticUpdateChecker";
import { ChatAudioPlayer } from "./ChatAudioPlayer";
import { ComposerAttachmentMenu } from "./ComposerAttachmentMenu";
import { ComposerEmojiPicker } from "./ComposerEmojiPicker";
import { DesktopContextMenu } from "./DesktopContextMenu";
import { emojiOnlyGraphemes } from "./emoji-data";
import { GameLobby } from "./GameLobby";
import { MenuBar } from "./MenuBar";
import { ReportProblemDialog } from "./ReportProblemDialog";
import { RequestFeatureDialog } from "./RequestFeatureDialog";
import {
  type AccountSettingsSummary,
  SettingsDialog,
  type SettingsSection,
} from "./SettingsDialog";

const defaultRoomId = "global-lobby";
const appVersion = releasedVersion;

type RoomView = "chat" | "games";

const groupWindowMs = 45 * 1000;
const participantActiveWindowMs = 5 * 60 * 1000;
const conversationPageSize = 100;
const preferredVoiceMimeTypes = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];
const profileStatusPresets = ["Available", "Away"] as const;

const participantsPanel = { min: 200, max: 360, initial: 260 };
const aboutPanel = { min: 230, max: 400, initial: 280 };
const panelResizeStep = 16;

const clampWidth = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const recordingExtension = (mimeType: string): string => {
  if (mimeType.includes("mp4")) {
    return "m4a";
  }

  if (mimeType.includes("ogg")) {
    return "ogg";
  }

  return "webm";
};

const recordingDurationLabel = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
};

const profilePictureShades = [
  "#202020",
  "#272727",
  "#2f2f2f",
  "#383838",
  "#414141",
  "#1c1c1c",
  "#4a4a4a",
  "#242424",
];

const roleLabels: Record<ActorType, string> = {
  human: "Humans",
  chat_bot: "Chat bots",
  mod_bot: "Mod bots",
};

const roleOrder: ActorType[] = ["mod_bot", "chat_bot", "human"];

const payloadString = (event: RoomEvent, key: string): string | null => {
  const value = event.payload[key];
  return typeof value === "string" ? value : null;
};

const mediaCaptionTrackUrl = (caption: string | null): string => {
  const text = caption?.trim();
  const track =
    text === undefined || text.length === 0
      ? "WEBVTT\n\n"
      : `WEBVTT\n\n00:00:00.000 --> 99:59:59.999\n${text}\n`;

  return `data:text/vtt;charset=utf-8,${encodeURIComponent(track)}`;
};

interface EventAssetPart {
  partId: string;
  kind: "image" | "audio" | "video" | "file";
  mediaAssetId: string;
  caption: string | null;
  altText: string | null;
}

type EventContentPart =
  | {
      partId: string;
      kind: "text";
      text: string;
      language: string | null;
      sourceText: string | null;
      sourceLanguage: string | null;
    }
  | EventAssetPart;

const contentParts = (event: RoomEvent): EventContentPart[] => {
  const raw = event.payload.parts;

  if (!Array.isArray(raw)) {
    return [];
  }

  const parts: EventContentPart[] = [];

  for (const value of raw) {
    if (typeof value !== "object" || value === null) {
      continue;
    }

    const part = value as Record<string, unknown>;

    if (typeof part.partId !== "string" || typeof part.kind !== "string") {
      continue;
    }

    if (part.kind === "text" && typeof part.text === "string") {
      parts.push({
        partId: part.partId,
        kind: "text",
        text: part.text,
        language: typeof part.language === "string" ? part.language : null,
        sourceText:
          typeof part.sourceText === "string" ? part.sourceText : null,
        sourceLanguage:
          typeof part.sourceLanguage === "string" ? part.sourceLanguage : null,
      });
      continue;
    }

    if (
      (part.kind === "image" ||
        part.kind === "audio" ||
        part.kind === "video" ||
        part.kind === "file") &&
      typeof part.mediaAssetId === "string"
    ) {
      parts.push({
        partId: part.partId,
        kind: part.kind,
        mediaAssetId: part.mediaAssetId,
        caption: typeof part.caption === "string" ? part.caption : null,
        altText: typeof part.altText === "string" ? part.altText : null,
      });
    }
  }

  return parts;
};

const contentPartInputs = (event: RoomEvent): ContentPartInput[] => {
  const parsed = contentParts(event);

  if (parsed.length === 0) {
    const text = payloadString(event, "content");
    const sourceText = payloadString(event, "sourceText");
    const sourceLanguage = payloadString(event, "sourceLanguage");

    return text === null
      ? []
      : [
          {
            kind: "text",
            text,
            language: "en",
            ...(sourceText === null || sourceLanguage === null
              ? {}
              : { sourceText, sourceLanguage }),
          },
        ];
  }

  return parsed.map((part) => {
    if (part.kind === "text") {
      return {
        partId: part.partId,
        kind: part.kind,
        text: part.text,
        ...(part.language === null ? {} : { language: part.language }),
        ...(part.sourceText === null || part.sourceLanguage === null
          ? {}
          : {
              sourceText: part.sourceText,
              sourceLanguage: part.sourceLanguage,
            }),
      };
    }

    return {
      partId: part.partId,
      kind: part.kind,
      mediaAssetId: part.mediaAssetId,
      ...(part.caption === null ? {} : { caption: part.caption }),
      ...(part.kind !== "image" || part.altText === null
        ? {}
        : { altText: part.altText }),
    };
  });
};

const eventText = (event: RoomEvent): string => {
  const legacy = payloadString(event, "content");

  if (legacy !== null) {
    return legacy;
  }

  const parts = contentParts(event);
  return parts
    .filter((part) => part.kind === "text")
    .map((part) => part.text)
    .join("\n");
};

const eventContent = (event: RoomEvent): string => {
  const text = eventText(event);

  if (text.length > 0) {
    return text;
  }

  return contentParts(event)
    .filter((part): part is EventAssetPart => part.kind !== "text")
    .map((part) => part.caption ?? `Shared ${part.kind}`)
    .join("\n");
};

const eventSource = (
  event: RoomEvent,
): { text: string; language: string } | null => {
  const legacyText = payloadString(event, "sourceText");
  const legacyLanguage = payloadString(event, "sourceLanguage");

  if (legacyText !== null && legacyLanguage !== null) {
    return { text: legacyText, language: legacyLanguage };
  }

  const textParts = contentParts(event).filter(
    (part): part is Extract<EventContentPart, { kind: "text" }> =>
      part.kind === "text",
  );

  if (
    textParts.length === 0 ||
    textParts.some(
      (part) => part.sourceText === null || part.sourceLanguage === null,
    )
  ) {
    return null;
  }

  const language = textParts[0].sourceLanguage;

  if (
    language === null ||
    textParts.some((part) => part.sourceLanguage !== language)
  ) {
    return null;
  }

  return {
    text: textParts.map((part) => part.sourceText).join("\n"),
    language,
  };
};

const displayedEventText = (
  event: RoomEvent,
  language: ChatLanguage,
  translations: ReadonlyMap<string, string>,
): string => {
  if (language === "en") {
    return eventText(event);
  }

  const source = eventSource(event);

  if (source?.language === language) {
    return source.text;
  }

  return translations.get(event.sequence) ?? eventText(event);
};

const originalEventText = (event: RoomEvent): string =>
  eventSource(event)?.text ?? eventText(event);

const payloadReply = (event: RoomEvent): { contentItemId: string } | null => {
  const value = event.payload.replyTo;

  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { contentItemId?: unknown }).contentItemId === "string"
  ) {
    return {
      contentItemId: (value as { contentItemId: string }).contentItemId,
    };
  }

  return null;
};

// The keywords that address the whole room, matching the runtime's own
// parsing so a human and a bot mean the same thing by "@everyone".
const roomAddressWords = ["room", "everyone", "everybody", "all"];
const roomAddressPattern = new RegExp(
  `@(${roomAddressWords.join("|")})\\b`,
  "i",
);

// A label the message renderer can turn into an inline mention pill: a room
// keyword, or a participant matched by the exact `@display` a human or bot
// would have typed, carrying the clean name to show.
type MentionLabel =
  | { text: string; kind: "room" }
  | { text: string; kind: "actor"; actorId: string; label: string };

const buildMentionLabels = (actors: Map<string, Actor>): MentionLabel[] => {
  const labels: MentionLabel[] = roomAddressWords.map((text) => ({
    text,
    kind: "room",
  }));

  for (const actor of actors.values()) {
    labels.push({
      text: actor.display,
      kind: "actor",
      actorId: actor.id,
      label: actor.displayName,
    });
  }

  // Longest first so "@everybody" beats "@every…" and a full name beats a
  // shorter one that is a prefix of it.
  return labels.sort((left, right) => right.text.length - left.text.length);
};

// Render a message body with `@mentions` styled inline as pills, the way
// every chat app shows addressing. Only real `@` tokens (opening a word and
// matching a known participant or room keyword) become pills; anything else,
// including an email's "@", stays plain text. A mention of the local user is
// emphasized.
const renderMessageBody = (
  content: string,
  labels: MentionLabel[],
  localActorId: string | undefined,
): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let text = "";
  let index = 0;
  let key = 0;

  const flush = () => {
    if (text.length > 0) {
      nodes.push(text);
      text = "";
    }
  };

  while (index < content.length) {
    const char = content[index];
    const boundary = index === 0 || /\s/.test(content[index - 1]);

    if (char === "@" && boundary) {
      const rest = content.slice(index + 1);
      const lower = rest.toLowerCase();
      const match = labels.find((label) => {
        if (!lower.startsWith(label.text.toLowerCase())) {
          return false;
        }

        const next = rest[label.text.length];
        return next === undefined || !/[\w#-]/.test(next);
      });

      if (match !== undefined) {
        flush();
        const isYou = match.kind === "actor" && match.actorId === localActorId;
        const raw = content.slice(index, index + 1 + match.text.length);
        const pillText = match.kind === "room" ? raw : `@${match.label}`;

        nodes.push(
          <span
            key={`mention-${key}`}
            className={
              isYou
                ? "rounded bg-white/20 px-1 font-medium text-white"
                : "rounded bg-white/[0.08] px-1 font-medium text-zinc-100"
            }
          >
            {pillText}
          </span>,
        );
        key += 1;
        index += 1 + match.text.length;
        continue;
      }
    }

    text += char;
    index += 1;
  }

  flush();
  return nodes;
};

// Derive the structural targets from the composed text, using the roster as
// the dictionary. The text is the single source of truth, exactly as the
// runtime derives a bot's addressing from what it says. A room mention wins
// and stands alone, otherwise each named participant becomes an actor target.
const deriveAddressedTo = (
  text: string,
  participants: Actor[],
): ContentAddress[] => {
  if (roomAddressPattern.test(text)) {
    return [{ targetType: "room" }];
  }

  const targets: ContentAddress[] = [];

  for (const actor of participants) {
    const escaped = actor.display.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // The `@` must open a word, as in the composer picker, so an email or
    // handle like "bob@Arwen" never addresses anyone; the trailing boundary
    // keeps "@Ru" from matching inside "@Rufus".
    const pattern = new RegExp(`(?:^|\\s)@${escaped}(?![\\w#-])`, "i");

    if (pattern.test(text)) {
      targets.push({ targetType: "actor", actorId: actor.id });
    }

    if (targets.length >= 16) {
      break;
    }
  }

  return targets;
};

// The `@mention` token the caret currently sits inside, if any: an `@`
// that opens a word (start of line or after whitespace) with no whitespace
// between it and the caret. Drives the composer's participant picker.
const mentionAt = (
  text: string,
  caret: number,
): { start: number; query: string } | null => {
  let index = caret - 1;

  while (index >= 0) {
    const char = text[index];

    if (char === "@") {
      const before = index === 0 ? "" : text[index - 1];

      if (before === "" || /\s/.test(before)) {
        return { start: index, query: text.slice(index + 1, caret) };
      }

      return null;
    }

    if (/\s/.test(char)) {
      return null;
    }

    index -= 1;
  }

  return null;
};

type MentionOption = { kind: "room" } | { kind: "actor"; actor: Actor };

const formatTime = (value: string): string =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const memberSince = (value: string): string =>
  new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const dayLabel = (date: Date): string => {
  const diff = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / 86_400_000,
  );

  if (diff === 0) {
    return "Today";
  }

  if (diff === 1) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
};

const formatRole = (actor: Actor): string => actor.type.replace("_", " ");

const isVisibleParticipant = (actor: Actor): boolean =>
  actor.type !== "human" || actor.policyAcceptedAt !== null;

type ActivityScope = "7d" | "30d" | "all";

type ParticipantStatus = "active" | "idle" | "offline";

const participantStatusStyles: Record<
  ParticipantStatus,
  { dot: string; label: string; text: string }
> = {
  active: {
    dot: "bg-emerald-400",
    label: "Active",
    text: "text-emerald-300",
  },
  idle: {
    dot: "bg-amber-400",
    label: "Idle",
    text: "text-amber-300",
  },
  offline: {
    dot: "bg-zinc-500",
    label: "Offline",
    text: "text-zinc-500",
  },
};

const activityScopes: Array<{ id: ActivityScope; label: string }> = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "all", label: "All" },
];

const settingsStorageKeys = {
  sendWithEnter: "modbots.web.send-with-enter",
  chatLanguage: "modbots.web.chat-language",
  translationEnabled: "modbots.web.translation-enabled",
  translationLanguage: "modbots.web.translation-language",
};

const readStoredBoolean = (key: string, fallback: boolean): boolean => {
  const stored = window.localStorage.getItem(key);

  if (stored === "true") {
    return true;
  }

  if (stored === "false") {
    return false;
  }

  return fallback;
};

const writeStoredBoolean = (key: string, value: boolean): void => {
  window.localStorage.setItem(key, String(value));
};

const readStoredChatLanguage = (): ChatLanguage => {
  const stored = window.localStorage.getItem(settingsStorageKeys.chatLanguage);
  return stored === "zh-CN" ? "zh-CN" : "en";
};

const moderationActionLabels: Record<string, string> = {
  delete_message: "Messages deleted",
  mute_actor: "Participants muted",
  unmute_actor: "Participants unmuted",
  remove_actor: "Participants removed",
};

const actorTypeRowLabels: Record<ActorType | "unknown", string> = {
  human: "Humans",
  chat_bot: "Chat bots",
  mod_bot: "Mod bots",
  unknown: "Others",
};

const shortDate = (ms: number): string =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(ms));

const bucketShade = (count: number, max: number): string =>
  `rgba(255, 255, 255, ${count === 0 ? 0.04 : 0.1 + 0.6 * (count / max)})`;

const monogram = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const shadeFor = (actorId: string | null): string => {
  if (actorId === null) {
    return "#202020";
  }

  let hash = 0;

  for (let index = 0; index < actorId.length; index += 1) {
    hash = (hash * 31 + actorId.charCodeAt(index)) >>> 0;
  }

  return profilePictureShades[hash % profilePictureShades.length];
};

const actorProfilePictureUrl = (actor: Actor | undefined): string | null =>
  actor?.profilePictureUrl ?? null;

const roleBadgeIcon = (type: ActorType) => {
  if (type === "mod_bot") {
    return <Shield className="h-2.5 w-2.5" />;
  }

  if (type === "chat_bot") {
    return <Bot className="h-2.5 w-2.5" />;
  }

  return null;
};

const moderationEventText = (
  event: RoomEvent,
  actors: Map<string, Actor>,
  ruleTitles: Map<string, string>,
): string | null => {
  if (event.type !== "moderation_action_applied") {
    return null;
  }

  const action =
    payloadString(event, "action")?.replace(/_/g, " ") ?? "a moderation action";
  const target = payloadString(event, "targetEventSequence");
  const ruleId = payloadString(event, "ruleId");
  const ruleTitle = ruleId === null ? undefined : ruleTitles.get(ruleId);

  return `${actorLabel(event.actorId, actors)} applied ${action}${
    target === null ? "" : ` to message ${target}`
  }${ruleTitle === undefined ? "" : ` · rule: ${ruleTitle}`}`;
};

type TimelineItem =
  | { kind: "day"; key: string; label: string }
  | { kind: "message"; key: string; event: RoomEvent; grouped: boolean }
  | { kind: "moderation"; key: string; event: RoomEvent };

const buildTimeline = (events: RoomEvent[]): TimelineItem[] => {
  const items: TimelineItem[] = [];
  let previousMessage: RoomEvent | null = null;
  let previousDayKey: string | null = null;

  for (const event of events) {
    const occurredAt = new Date(event.occurredAt);
    const dayKey = startOfDay(occurredAt).toString();

    if (dayKey !== previousDayKey) {
      items.push({
        kind: "day",
        key: `day-${event.sequence}`,
        label: dayLabel(occurredAt),
      });
      previousDayKey = dayKey;
      previousMessage = null;
    }

    if (event.type === "moderation_action_applied") {
      items.push({ kind: "moderation", key: event.sequence, event });
      previousMessage = null;
      continue;
    }

    // A reply always shows its author and its reference, so it never folds
    // into the previous author's group.
    const grouped =
      previousMessage !== null &&
      previousMessage.actorId === event.actorId &&
      payloadReply(event) === null &&
      occurredAt.getTime() - new Date(previousMessage.occurredAt).getTime() <
        groupWindowMs;

    items.push({ kind: "message", key: event.sequence, event, grouped });
    previousMessage = event;
  }

  return items;
};

// Panel widths survive restarts the way the window's own frame does:
// window-state remembers the frame, this remembers the panels.
const usePanelWidth = (
  storageKey: string,
  limits: { min: number; max: number; initial: number },
): [number, (width: number) => void] => {
  const [width, setWidth] = useState(limits.initial);

  // The stored width is applied after mount rather than in the initializer:
  // there is no localStorage during the server render, and starting both
  // sides from the same value keeps hydration matched.
  useEffect(() => {
    const stored = Number(window.localStorage.getItem(storageKey));

    if (Number.isFinite(stored) && stored > 0) {
      setWidth(clampWidth(stored, limits.min, limits.max));
    }
  }, [storageKey, limits.min, limits.max]);

  const update = (next: number) => {
    const clamped = clampWidth(next, limits.min, limits.max);
    setWidth(clamped);
    window.localStorage.setItem(storageKey, String(Math.round(clamped)));
  };

  return [width, update];
};

// The draggable seam between a side panel and the conversation. The visible
// line stays hairline-thin; the hit area straddles the panel border so it is
// easy to grab. grow says which pointer direction widens the panel.
function PanelResizeHandle({
  label,
  width,
  limits,
  onWidthChange,
  grow,
}: {
  label: string;
  width: number;
  limits: { min: number; max: number; initial: number };
  onWidthChange: (width: number) => void;
  grow: 1 | -1;
}) {
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const endDrag = (event: ReactPointerEvent<HTMLHRElement>) => {
    if (drag.current?.pointerId !== event.pointerId) {
      return;
    }

    drag.current = null;
    setDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <hr
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={limits.min}
      aria-valuemax={limits.max}
      aria-valuenow={Math.round(width)}
      tabIndex={0}
      onPointerDown={(event) => {
        event.preventDefault();
        drag.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startWidth: width,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      }}
      onPointerMove={(event) => {
        if (drag.current?.pointerId === event.pointerId) {
          onWidthChange(
            drag.current.startWidth +
              grow * (event.clientX - drag.current.startX),
          );
        }
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const direction = event.key === "ArrowRight" ? 1 : -1;
          onWidthChange(width + grow * direction * panelResizeStep);
        }
      }}
      className={`group relative z-10 -mx-1 hidden w-2 shrink-0 cursor-col-resize touch-none border-0 after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:transition-colors focus-visible:outline-none lg:block ${
        dragging
          ? "after:bg-white/40"
          : "after:bg-transparent hover:after:bg-white/25 focus-visible:after:bg-white/40"
      }`}
    />
  );
}

function ActorProfilePicture({
  actor,
  actorId,
  name,
  size = "md",
}: {
  actor: Actor | undefined;
  actorId: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimensions =
    size === "sm"
      ? "h-8 w-8 rounded-xl text-[10px]"
      : size === "lg"
        ? "h-16 w-16 rounded-2xl text-[15px]"
        : "h-10 w-10 rounded-xl text-[11px]";
  const imageUrl = actorProfilePictureUrl(actor);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  return (
    <div className="relative shrink-0">
      <div
        className={`modbots-profile-picture relative flex ${dimensions} items-center justify-center overflow-hidden border border-white/10 font-semibold text-zinc-100`}
        style={{ backgroundColor: shadeFor(actorId) }}
      >
        {imageUrl !== null && imageUrl !== failedImageUrl ? (
          <NextImage
            src={imageUrl}
            alt={name}
            fill
            sizes={size === "lg" ? "64px" : size === "sm" ? "32px" : "40px"}
            unoptimized
            className="rounded-inherit object-cover"
            onError={() => setFailedImageUrl(imageUrl)}
          />
        ) : (
          monogram(name)
        )}
      </div>
      {actor !== undefined && actor.type !== "human" ? (
        <span className="modbots-profile-type-badge absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-modbots-avatar-edge bg-modbots-panel text-zinc-300">
          {roleBadgeIcon(actor.type)}
        </span>
      ) : null}
    </div>
  );
}

const notificationToneIcon = (tone: NotificationTone) => {
  if (tone === "success") {
    return CheckCircle2;
  }

  if (tone === "warning") {
    return TriangleAlert;
  }

  if (tone === "error") {
    return CircleAlert;
  }

  return Info;
};

const notificationCategoryLabels: Record<NotificationCategory, string> = {
  direct: "Direct interaction",
  moderation: "Mod bot action",
  room: "Room event",
  conversation: "Conversation return",
  research: "Research answer",
  system: "System",
  study: "Research study",
};

function NotificationRow({
  notification,
  onDismiss,
}: {
  notification: AppNotification;
  onDismiss: () => void;
}) {
  const { t } = useUiLanguage();
  const ToneIcon = notificationToneIcon(notification.tone);

  return (
    <li className="flex items-start gap-2.5 border-t border-white/[0.07] px-3 py-2.5 first:border-t-0">
      <ToneIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
          {t(notificationCategoryLabels[notification.category])}
        </p>
        <p className="text-[12px] font-medium leading-4 text-zinc-200">
          {t(notification.title)}
        </p>
        {notification.message !== undefined ? (
          <p className="mt-0.5 text-[11px] leading-4 text-zinc-500">
            {t(notification.message)}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-600 hover:bg-white/[0.07] hover:text-zinc-300"
        aria-label={t("Dismiss notification")}
        title={t("Dismiss notification")}
      >
        <X className="h-3 w-3" />
      </button>
    </li>
  );
}

function StatusBar({
  connectionLabel,
  sending,
  muted,
  searchMatches,
}: {
  connectionLabel: string;
  sending: boolean;
  muted: boolean;
  searchMatches: number | null;
}) {
  const { t } = useUiLanguage();
  const {
    clearNotifications,
    dismissNotification,
    markAllNotificationsRead,
    notifications,
    unreadCount,
  } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const latestNotification = notifications.at(-1);
  const LatestToneIcon =
    latestNotification === undefined
      ? null
      : notificationToneIcon(latestNotification.tone);

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }

    markAllNotificationsRead();
    const closeNotifications = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        setNotificationsOpen(false);
        return;
      }

      if (
        event instanceof MouseEvent &&
        event.target instanceof Node &&
        !notificationsRef.current?.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeNotifications);
    document.addEventListener("keydown", closeNotifications);
    return () => {
      document.removeEventListener("mousedown", closeNotifications);
      document.removeEventListener("keydown", closeNotifications);
    };
  }, [markAllNotificationsRead, notificationsOpen]);

  return (
    <footer className="modbots-print-hidden relative flex h-7 shrink-0 items-center gap-3 border-t border-white/[0.08] bg-modbots-chrome px-3 text-[11px] text-zinc-500">
      <div className="flex shrink-0 items-center gap-3">
        <span className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              connectionLabel === "Connected"
                ? "bg-zinc-200"
                : connectionLabel === "Offline"
                  ? "border border-zinc-500"
                  : "animate-pulse bg-zinc-500"
            }`}
          />
          <span className="text-zinc-400">{t(connectionLabel)}</span>
        </span>
        {sending ? <span>{t("Sending...")}</span> : null}
        {muted ? (
          <span
            className="flex items-center gap-1.5 text-zinc-300"
            title={t("Moderation has muted you in this room")}
          >
            <MicOff className="h-3 w-3" />
            {t("Muted")}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center px-2">
        {latestNotification !== undefined && LatestToneIcon !== null ? (
          <div
            role={
              latestNotification.tone === "error" ||
              latestNotification.tone === "warning"
                ? "alert"
                : "status"
            }
            className="flex min-w-0 max-w-full items-center gap-1.5 text-zinc-400"
          >
            <LatestToneIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">
              <span className="font-medium text-zinc-300">
                {t(latestNotification.title)}
              </span>
              {latestNotification.message !== undefined
                ? ` · ${t(latestNotification.message)}`
                : ""}
            </span>
            <button
              type="button"
              onClick={() => dismissNotification(latestNotification.id)}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-600 hover:bg-white/[0.07] hover:text-zinc-300"
              aria-label={t("Dismiss notification")}
              title={t("Dismiss notification")}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {searchMatches !== null ? (
          <span className="tabular-nums">
            {searchMatches} {searchMatches === 1 ? "match" : "matches"}
          </span>
        ) : null}

        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((current) => !current)}
            className="relative flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-white/[0.07] hover:text-zinc-200"
            aria-label={`${t("Notifications")}${
              unreadCount > 0 ? `, ${unreadCount} ${t("unread")}` : ""
            }`}
            aria-haspopup="dialog"
            aria-expanded={notificationsOpen}
            title={t("Notifications")}
          >
            <Bell className="h-3.5 w-3.5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-zinc-200 px-0.5 text-[8px] font-bold leading-none text-black">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>

          {notificationsOpen ? (
            <section
              role="dialog"
              aria-label={t("Notifications")}
              className="absolute bottom-[calc(100%+5px)] right-0 z-50 w-[340px] max-w-[calc(100vw-16px)] overflow-hidden rounded-window border border-white/10 bg-modbots-popover shadow-[0_16px_50px_rgba(0,0,0,0.55)]"
            >
              <header className="flex h-10 items-center justify-between border-b border-white/[0.08] px-3">
                <h3 className="text-[12px] font-semibold text-zinc-200">
                  {t("Notifications")}
                </h3>
                {notifications.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearNotifications}
                    className="rounded px-1.5 py-1 text-[10px] text-zinc-500 hover:bg-white/[0.07] hover:text-zinc-300"
                  >
                    {t("Clear all")}
                  </button>
                ) : null}
              </header>
              {notifications.length > 0 ? (
                <ul className="modbots-scroll max-h-72 overflow-y-auto">
                  {[...notifications].reverse().map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      onDismiss={() => dismissNotification(notification.id)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-5 text-center text-[11px] text-zinc-500">
                  {t("No notifications")}
                </p>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

interface AttachmentMessageAction {
  partId: string;
  label: string;
}

function MessageActions({
  attachments,
  onDeleteAttachment,
  onDeleteMessage,
  onEdit,
  onReply,
  quote,
}: {
  attachments: AttachmentMessageAction[];
  onDeleteAttachment?: (partId: string) => Promise<void>;
  onDeleteMessage?: () => Promise<void>;
  onEdit?: () => void;
  onReply?: () => void;
  quote: boolean;
}) {
  const { t } = useUiLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<
    { kind: "message" } | { kind: "attachment"; partId: string } | null
  >(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasOwnerActions =
    onEdit !== undefined ||
    onDeleteMessage !== undefined ||
    (onDeleteAttachment !== undefined && attachments.length > 0);
  const confirmDelete = async () => {
    if (confirmation === null) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      if (confirmation.kind === "message") {
        await onDeleteMessage?.();
      } else {
        await onDeleteAttachment?.(confirmation.partId);
      }

      setConfirmation(null);
      setMenuOpen(false);
    } catch {
      setError(t("The item could not be deleted."));
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className={`modbots-print-hidden absolute right-4 top-0 z-20 flex items-center rounded-window border border-white/10 bg-modbots-popover p-0.5 shadow-xl lg:right-6 ${
        menuOpen
          ? "pointer-events-auto opacity-100"
          : "opacity-80 lg:pointer-events-none lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100 lg:group-focus-within:pointer-events-auto lg:group-focus-within:opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={onReply}
        disabled={onReply === undefined}
        className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.07] hover:text-white disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-zinc-500"
        aria-label={t(quote ? "Quote message" : "Reply to message")}
        title={t(quote ? "Quote" : "Reply")}
      >
        {quote ? (
          <Quote className="h-3.5 w-3.5" />
        ) : (
          <Reply className="h-3.5 w-3.5" />
        )}
      </button>
      <button
        type="button"
        className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.07] hover:text-white"
        aria-label={t("Add reaction")}
        title={t("Add reaction")}
      >
        <SmilePlus className="h-3.5 w-3.5" />
      </button>
      {hasOwnerActions ? (
        <>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => !open);
              setConfirmation(null);
              setError(null);
            }}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.07] hover:text-white"
            aria-label={t("More message actions")}
            title={t("More actions")}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-white/10 bg-modbots-popover p-1.5 shadow-2xl"
            >
              {confirmation === null ? (
                <>
                  {onEdit !== undefined ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onEdit();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-white/[0.07]"
                    >
                      <Pencil className="h-3.5 w-3.5 text-zinc-500" />
                      {t("Edit message")}
                    </button>
                  ) : null}
                  {onDeleteMessage !== undefined ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setConfirmation({ kind: "message" })}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("Delete message")}
                    </button>
                  ) : null}
                  {onDeleteAttachment === undefined
                    ? null
                    : attachments.map((attachment) => (
                        <button
                          key={attachment.partId}
                          type="button"
                          role="menuitem"
                          title={attachment.label}
                          onClick={() =>
                            setConfirmation({
                              kind: "attachment",
                              partId: attachment.partId,
                            })
                          }
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {attachments.length === 1
                              ? t("Delete attachment")
                              : attachment.label}
                          </span>
                        </button>
                      ))}
                </>
              ) : (
                <div className="p-1.5">
                  <p className="text-xs font-medium text-zinc-100">
                    {confirmation.kind === "message"
                      ? t("Delete this message?")
                      : t("Delete this attachment?")}
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-zinc-500">
                    {t("It will be removed from the chatroom.")}
                  </p>
                  {error === null ? null : (
                    <p className="mt-2 text-[11px] text-red-300">{error}</p>
                  )}
                  <div className="mt-3 flex justify-end gap-1.5">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setConfirmation(null)}
                      className="rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-400 hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
                    >
                      {t("Cancel")}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void confirmDelete()}
                      className="rounded-lg bg-red-500/15 px-2.5 py-1.5 text-[11px] font-medium text-red-200 hover:bg-red-500/25 disabled:opacity-50"
                    >
                      {pending ? t("Deleting...") : t("Delete")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ChatVideoPlayer({
  assetId,
  caption,
  src,
  onPlaybackChange,
}: {
  assetId: string;
  caption: string | null;
  src: string;
  onPlaybackChange: (assetId: string, playing: boolean) => void;
}) {
  useEffect(
    () => () => {
      onPlaybackChange(assetId, false);
    },
    [assetId, onPlaybackChange],
  );

  return (
    <video
      controls
      preload="metadata"
      src={src}
      className="h-full w-full object-contain"
      onPlay={() => onPlaybackChange(assetId, true)}
      onPause={() => onPlaybackChange(assetId, false)}
      onEnded={() => onPlaybackChange(assetId, false)}
    >
      <track
        default
        kind="captions"
        src={mediaCaptionTrackUrl(caption)}
        srcLang="und"
        label="Message caption"
      />
    </video>
  );
}

function MessageMedia({
  event,
  roomId,
  onPlaybackChange,
}: {
  event: RoomEvent;
  roomId: string;
  onPlaybackChange: (assetId: string, playing: boolean) => void;
}) {
  const { t } = useUiLanguage();
  const parts = contentParts(event).filter(
    (part): part is EventAssetPart => part.kind !== "text",
  );

  if (parts.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex w-full max-w-[400px] flex-col gap-2">
      {parts.map((part) => {
        const url = mediaAssetDataUrl(roomId, part.mediaAssetId);

        if (part.kind === "image") {
          return (
            <figure
              key={part.partId}
              className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            >
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group/media relative block aspect-[16/10] bg-black/25"
                aria-label={t("Open full-size image")}
              >
                <NextImage
                  src={url}
                  alt={part.caption ?? "Shared image"}
                  fill
                  sizes="(max-width: 480px) 100vw, 400px"
                  unoptimized
                  className="object-contain"
                />
                <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black/55 text-zinc-300 opacity-0 backdrop-blur-sm transition group-hover/media:opacity-100 group-focus-visible/media:opacity-100">
                  <Maximize2 className="h-3.5 w-3.5" />
                </span>
              </a>
              <figcaption
                className="flex items-center gap-2 border-t border-white/[0.07] px-3 py-2 text-[11px] text-zinc-500"
                title={part.caption ?? undefined}
              >
                <Image className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 truncate">
                  {part.caption ?? t("Image attachment")}
                </span>
              </figcaption>
            </figure>
          );
        }

        if (part.kind === "video") {
          return (
            <figure
              key={part.partId}
              className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            >
              <div className="aspect-[16/10] bg-black/25">
                <ChatVideoPlayer
                  assetId={part.mediaAssetId}
                  caption={part.caption}
                  src={url}
                  onPlaybackChange={onPlaybackChange}
                />
              </div>
              <figcaption
                className="flex items-center gap-2 border-t border-white/[0.07] px-3 py-2 text-[11px] text-zinc-500"
                title={part.caption ?? undefined}
              >
                <Film className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 truncate">
                  {part.caption ?? t("Video attachment")}
                </span>
              </figcaption>
            </figure>
          );
        }

        if (part.kind === "audio") {
          return (
            <ChatAudioPlayer
              key={part.partId}
              assetId={part.mediaAssetId}
              caption={part.caption}
              captionTrackUrl={mediaCaptionTrackUrl(part.caption)}
              src={url}
              onPlaybackChange={onPlaybackChange}
            />
          );
        }

        return (
          <a
            key={part.partId}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-zinc-300 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:bg-white/[0.07] hover:text-white"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/20 text-zinc-400">
              <FileText className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate">
              {part.caption ?? t("Open shared file")}
            </span>
          </a>
        );
      })}
    </div>
  );
}

function ChatMessage({
  actors,
  event,
  grouped,
  roomId,
  localActorId,
  mentionLabels,
  repliedEvent,
  displayText,
  originalText,
  repliedDisplayText,
  editRequested,
  onDeleteAttachment,
  onDeleteMessage,
  onEditRequestHandled,
  onEditMessage,
  onReply,
  onPlaybackChange,
}: {
  actors: Map<string, Actor>;
  event: RoomEvent;
  grouped: boolean;
  roomId: string;
  localActorId: string | undefined;
  mentionLabels: MentionLabel[];
  repliedEvent: RoomEvent | null;
  displayText: string;
  originalText: string;
  repliedDisplayText: string | null;
  editRequested: boolean;
  onDeleteAttachment: (event: RoomEvent, partId: string) => Promise<void>;
  onDeleteMessage: (event: RoomEvent) => Promise<void>;
  onEditRequestHandled: () => void;
  onEditMessage: (event: RoomEvent, text: string) => Promise<void>;
  onReply?: () => void;
  onPlaybackChange: (assetId: string, playing: boolean) => void;
}) {
  const { t } = useUiLanguage();
  const actor = event.actorId === null ? undefined : actors.get(event.actorId);
  const ownMessage = event.actorId === localActorId;
  const name = actorLabel(event.actorId, actors);
  const [showOriginal, setShowOriginal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const editInput = useRef<HTMLTextAreaElement>(null);
  const hasTranslation = displayText !== originalText;
  const content = showOriginal && hasTranslation ? originalText : displayText;
  const isReply = payloadReply(event) !== null;
  const emojiGraphemes = emojiOnlyGraphemes(content);
  const body =
    emojiGraphemes === null
      ? renderMessageBody(content, mentionLabels, localActorId)
      : emojiGraphemes.map((emoji, index) => (
          <span
            key={`${emoji}-${emojiGraphemes.slice(0, index).join("")}`}
            className="modbots-animated-emoji inline-block"
            style={{ "--modbots-emoji-index": index } as CSSProperties}
          >
            {emoji}
          </span>
        ));
  const bodyClassName =
    emojiGraphemes === null
      ? "max-w-[76ch] whitespace-pre-wrap break-words text-[13px] leading-[22px] text-zinc-200"
      : "flex min-h-12 items-center gap-1 text-[36px] leading-none";
  const itemId = payloadString(event, "contentItemId");
  const parts = contentPartInputs(event);
  const hasText = parts.some((part) => part.kind === "text");
  const attachments = contentParts(event)
    .filter((part): part is EventAssetPart => part.kind !== "text")
    .map((part) => ({
      partId: part.partId,
      label: part.caption ?? t(`${part.kind} attachment`),
    }));
  const canManage = ownMessage && itemId !== null;
  useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => editInput.current?.focus());
    }
  }, [editing]);
  const startEditing = () => {
    const source = eventSource(event);
    setEditDraft(source?.text ?? eventText(event));
    setEditError(null);
    setEditing(true);
  };
  useEffect(() => {
    if (!editRequested) {
      return;
    }

    const source = eventSource(event);
    setEditDraft(source?.text ?? eventText(event));
    setEditError(null);
    setEditing(true);
    onEditRequestHandled();
  }, [editRequested, event, onEditRequestHandled]);
  const saveEdit = async () => {
    const nextText = editDraft.trim();

    if (nextText.length === 0 || nextText.length > 4_000) {
      setEditError(t("Messages must contain 1 to 4,000 characters."));
      return;
    }

    setEditPending(true);
    setEditError(null);

    try {
      await onEditMessage(event, nextText);
      setEditing(false);
    } catch {
      setEditError(t("The message could not be edited."));
    } finally {
      setEditPending(false);
    }
  };
  const messageBody = editing ? (
    <div className="mt-1.5 max-w-[64ch] rounded-xl border border-white/10 bg-white/[0.035] p-2.5">
      <textarea
        ref={editInput}
        value={editDraft}
        maxLength={4_000}
        onChange={(changeEvent) =>
          setEditDraft(changeEvent.currentTarget.value)
        }
        onKeyDown={(keyEvent) => {
          if (keyEvent.key === "Escape") {
            setEditing(false);
          }

          if (keyEvent.key === "Enter" && !keyEvent.shiftKey) {
            keyEvent.preventDefault();
            void saveEdit();
          }
        }}
        className="modbots-scroll min-h-20 w-full resize-y bg-transparent text-[13px] leading-[22px] text-zinc-100 outline-none placeholder:text-zinc-600"
        aria-label={t("Edit message")}
      />
      {editError === null ? null : (
        <p className="mt-1 text-[11px] text-red-300">{editError}</p>
      )}
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          disabled={editPending}
          onClick={() => setEditing(false)}
          className="rounded-lg px-3 py-1.5 text-[11px] text-zinc-400 hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
        >
          {t("Cancel")}
        </button>
        <button
          type="button"
          disabled={editPending || editDraft.trim().length === 0}
          onClick={() => void saveEdit()}
          className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
        >
          {editPending ? t("Saving...") : t("Save")}
        </button>
      </div>
    </div>
  ) : (
    <>
      {content.length > 0 ? <p className={bodyClassName}>{body}</p> : null}
      {hasTranslation ? (
        <button
          type="button"
          onClick={() => setShowOriginal((current) => !current)}
          className="modbots-print-hidden mt-1 text-[11px] text-zinc-500 hover:text-zinc-300"
        >
          {showOriginal ? t("View translation") : t("View original")}
        </button>
      ) : null}
    </>
  );
  const actions = (
    <MessageActions
      attachments={canManage ? attachments : []}
      onEdit={canManage && hasText ? startEditing : undefined}
      onDeleteMessage={
        canManage && hasText ? () => onDeleteMessage(event) : undefined
      }
      onDeleteAttachment={
        canManage && attachments.length > 0
          ? (partId) => onDeleteAttachment(event, partId)
          : undefined
      }
      onReply={onReply}
      quote={ownMessage}
    />
  );

  if (grouped) {
    return (
      <article
        data-room-message-sequence={event.sequence}
        data-room-message-owned={canManage}
        data-room-message-editable={canManage && hasText}
        data-room-message-copy-text={
          content.length > 0 ? content : eventContent(event)
        }
        className="group relative flex gap-3 px-4 py-1 hover:bg-white/[0.03] sm:px-6"
      >
        <div className="flex w-8 shrink-0 justify-center">
          <time className="mt-1 hidden text-[10px] tabular-nums text-zinc-600 group-hover:block">
            {formatTime(event.occurredAt)}
          </time>
        </div>
        <div className="min-w-0 flex-1 pr-20">
          {messageBody}
          <MessageMedia
            event={event}
            roomId={roomId}
            onPlaybackChange={onPlaybackChange}
          />
        </div>
        {actions}
      </article>
    );
  }

  return (
    <article
      data-room-message-sequence={event.sequence}
      data-room-message-owned={canManage}
      data-room-message-editable={canManage && hasText}
      data-room-message-copy-text={
        content.length > 0 ? content : eventContent(event)
      }
      className="group relative mt-5 flex gap-3 px-4 py-1 hover:bg-white/[0.03] sm:px-6"
    >
      <div className="w-8 shrink-0">
        <ActorProfilePicture
          actor={actor}
          actorId={event.actorId}
          name={name}
          size="sm"
        />
      </div>

      <div className="min-w-0 flex-1 pr-20">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[12px] font-semibold text-zinc-100">
            {name}
          </span>
          {actor?.type !== "human" && actor !== undefined ? (
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-400">
              {t(formatRole(actor))}
            </span>
          ) : null}
          {ownMessage ? (
            <span className="text-[11px] text-zinc-500">{t("You")}</span>
          ) : null}
          <time className="text-[10px] tabular-nums text-zinc-500">
            {formatTime(event.occurredAt)}
          </time>
        </div>
        {isReply ? (
          <div className="mt-2 flex min-w-0 max-w-[64ch] items-stretch overflow-hidden rounded-xl border border-white/[0.08] bg-modbots-panel-raised shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            <span className="w-1 shrink-0 bg-zinc-400/80" />
            <div className="min-w-0 px-3 py-2">
              {repliedEvent === null ? (
                <p className="text-[11px] italic text-zinc-500">
                  Earlier message
                </p>
              ) : (
                <>
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                    <CornerUpLeft className="h-3 w-3 shrink-0 text-zinc-500" />
                    {event.actorId === repliedEvent.actorId
                      ? "Quoted"
                      : "Replying to"}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-zinc-300">
                    {actorLabel(repliedEvent.actorId, actors)}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] leading-5 text-zinc-500">
                    {repliedDisplayText ?? eventContent(repliedEvent)}
                  </p>
                </>
              )}
            </div>
          </div>
        ) : null}
        <div className="mt-1.5">{messageBody}</div>
        <MessageMedia
          event={event}
          roomId={roomId}
          onPlaybackChange={onPlaybackChange}
        />
      </div>

      {actions}
    </article>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
      <span className="h-px flex-1 bg-white/[0.07]" />
      <span className="rounded-full border border-white/10 bg-modbots-card px-3 py-0.5 text-[11px] font-medium text-zinc-500">
        {label}
      </span>
      <span className="h-px flex-1 bg-white/[0.07]" />
    </div>
  );
}

function ModerationEvent({
  actors,
  event,
  ruleTitles,
}: {
  actors: Map<string, Actor>;
  event: RoomEvent;
  ruleTitles: Map<string, string>;
}) {
  const text = moderationEventText(event, actors, ruleTitles);

  if (text === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 text-xs text-zinc-500 sm:px-6">
      <span className="h-px flex-1 bg-white/[0.06]" />
      <Shield className="h-3.5 w-3.5 shrink-0" />
      <span>{text}</span>
      <span className="tabular-nums">{formatTime(event.occurredAt)}</span>
      <span className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}

const ConversationTimeline = memo(function ConversationTimeline({
  actors,
  items,
  roomId,
  localActorId,
  mentionLabels,
  messagesByContentItem,
  chatLanguage,
  translatedEventText,
  contextEditSequence,
  onDeleteAttachment,
  onDeleteMessage,
  onEditRequestHandled,
  onEditMessage,
  onReply,
  onPlaybackChange,
  ruleTitles,
}: {
  actors: Map<string, Actor>;
  items: TimelineItem[];
  roomId: string;
  localActorId: string | undefined;
  mentionLabels: MentionLabel[];
  messagesByContentItem: Map<string, RoomEvent>;
  chatLanguage: ChatLanguage;
  translatedEventText: ReadonlyMap<string, string>;
  contextEditSequence: string | null;
  onDeleteAttachment: (event: RoomEvent, partId: string) => Promise<void>;
  onDeleteMessage: (event: RoomEvent) => Promise<void>;
  onEditRequestHandled: () => void;
  onEditMessage: (event: RoomEvent, text: string) => Promise<void>;
  onReply: (event: RoomEvent) => void;
  onPlaybackChange: (assetId: string, playing: boolean) => void;
  ruleTitles: Map<string, string>;
}) {
  return items.map((item) => {
    if (item.kind === "day") {
      return <DayDivider key={item.key} label={item.label} />;
    }

    if (item.kind === "moderation") {
      return (
        <ModerationEvent
          key={item.key}
          actors={actors}
          event={item.event}
          ruleTitles={ruleTitles}
        />
      );
    }

    const reply = payloadReply(item.event);
    const repliedEvent =
      reply === null
        ? null
        : (messagesByContentItem.get(reply.contentItemId) ?? null);
    const canReply =
      localActorId !== undefined &&
      payloadString(item.event, "contentItemId") !== null;
    const displayText = displayedEventText(
      item.event,
      chatLanguage,
      translatedEventText,
    );
    const originalText = originalEventText(item.event);
    const repliedDisplayText =
      repliedEvent === null
        ? null
        : displayedEventText(repliedEvent, chatLanguage, translatedEventText);

    return (
      <ChatMessage
        key={item.key}
        actors={actors}
        event={item.event}
        grouped={item.grouped}
        roomId={roomId}
        localActorId={localActorId}
        mentionLabels={mentionLabels}
        repliedEvent={repliedEvent}
        displayText={displayText}
        originalText={originalText}
        repliedDisplayText={repliedDisplayText}
        editRequested={contextEditSequence === item.event.sequence}
        onDeleteAttachment={onDeleteAttachment}
        onDeleteMessage={onDeleteMessage}
        onEditRequestHandled={onEditRequestHandled}
        onEditMessage={onEditMessage}
        onReply={canReply ? () => onReply(item.event) : undefined}
        onPlaybackChange={onPlaybackChange}
      />
    );
  });
});

// One row of the Activity card: the headline number is always visible, the
// breakdown sits behind the same expand grammar the Rules list uses.
function ActivitySection({
  label,
  value,
  open,
  onToggle,
  children,
}: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-white/[0.06]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-md px-1 py-2 text-left hover:bg-white/[0.03]"
      >
        <span className="flex-1 text-[12px] font-medium text-zinc-400">
          {label}
        </span>
        <span className="text-[13px] font-semibold tabular-nums text-zinc-100">
          {value}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? <div className="space-y-1.5 px-1 pb-2.5">{children}</div> : null}
    </div>
  );
}

function ActivityCountRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-500">
        {label}
      </span>
      <span className="text-[11px] tabular-nums text-zinc-300">
        {count.toLocaleString()}
      </span>
    </div>
  );
}

function ParticipantRow({
  actor,
  status,
}: {
  actor: Actor;
  status: ParticipantStatus;
}) {
  const { t } = useUiLanguage();
  const currentStatus = participantStatusStyles[status];
  const displayedStatus = actor.statusText?.trim() || t(currentStatus.label);
  const hasProfileStatus = actor.statusText?.trim().length > 0;

  return (
    <div
      data-participant-actor-id={actor.id}
      className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.04]"
    >
      <div className="relative">
        <ActorProfilePicture
          actor={actor}
          actorId={actor.id}
          name={actor.display}
          size="sm"
        />
        <span
          className={`modbots-profile-status-dot absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full border-2 border-modbots-panel ${currentStatus.dot}`}
          title={t(currentStatus.label)}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-zinc-200">
          {actor.display}
        </p>
        <p
          className={`mt-0.5 truncate text-[10px] font-medium ${
            hasProfileStatus
              ? "normal-case tracking-normal text-zinc-400"
              : `uppercase tracking-[0.08em] ${currentStatus.text}`
          }`}
          title={displayedStatus}
        >
          {displayedStatus}
        </p>
      </div>
    </div>
  );
}

function ProfileDetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-1 py-1.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
          {label}
        </p>
        <div className="mt-0.5 text-[12px] leading-5 text-zinc-200">
          {value}
        </div>
      </div>
    </div>
  );
}

function ProfileStatusControl({
  actor,
  saving,
  error,
  onSave,
}: {
  actor: Actor;
  saving: boolean;
  error: string | null;
  onSave: (status: {
    statusMode: "preset" | "custom" | "media" | null;
    statusText: string | null;
  }) => Promise<Actor>;
}) {
  const { t } = useUiLanguage();
  const [customSelected, setCustomSelected] = useState(
    actor.statusMode === "custom",
  );
  const [customStatus, setCustomStatus] = useState(
    actor.statusMode === "custom" ? (actor.statusText ?? "") : "",
  );

  useEffect(() => {
    if (actor.statusMode === "custom") {
      setCustomStatus(actor.statusText ?? "");
    }
  }, [actor.statusMode, actor.statusText]);

  const saveStatus = async (status: {
    statusMode: "preset" | "custom" | "media" | null;
    statusText: string | null;
  }) => {
    try {
      await onSave(status);
    } catch {
      // The mutation error is rendered below the controls.
    }
  };

  const submitCustomStatus = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const statusText = customStatus.trim();

    if (statusText.length > 0) {
      void saveStatus({ statusMode: "custom", statusText });
    }
  };

  const selectedStatusValue = customSelected
    ? "custom"
    : actor.statusMode === "preset"
      ? (actor.statusText ?? "")
      : actor.statusMode === "media"
        ? "media"
        : "";
  const SelectedStatusIcon =
    selectedStatusValue === "Available"
      ? CheckCircle2
      : selectedStatusValue === "Away"
        ? Clock3
        : selectedStatusValue === "media"
          ? Film
          : MessageSquare;

  return (
    <div>
      <div className="relative">
        <SelectedStatusIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <select
          aria-label={t("Status")}
          disabled={saving}
          value={selectedStatusValue}
          onChange={(event) => {
            const value = event.currentTarget.value;

            if (value === "custom") {
              setCustomSelected(true);
              return;
            }

            setCustomSelected(false);
            if (value === "media") {
              void saveStatus({ statusMode: "media", statusText: null });
              return;
            }
            if (value === "") {
              void saveStatus({ statusMode: null, statusText: null });
              return;
            }

            void saveStatus({ statusMode: "preset", statusText: value });
          }}
          className="h-10 w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.025] pl-10 pr-9 text-[13px] text-zinc-200 outline-none transition-colors hover:border-white/[0.14] hover:bg-white/[0.05] focus:border-white/20 disabled:cursor-wait disabled:opacity-60"
        >
          <option value="" disabled hidden>
            {t("Set a status")}
          </option>
          {profileStatusPresets.map((preset) => (
            <option key={preset} value={preset}>
              {t(preset)}
            </option>
          ))}
          <option value="custom">{t("Set status message")}</option>
          <option value="media">{t("Share the media I play")}</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
      </div>

      {customSelected ? (
        <form onSubmit={submitCustomStatus} className="mt-2 flex gap-1.5">
          <input
            value={customStatus}
            onChange={(event) => setCustomStatus(event.currentTarget.value)}
            maxLength={80}
            placeholder={t("Write a custom status")}
            className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-black/20 px-2.5 py-2 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-white/20"
          />
          <button
            type="submit"
            disabled={saving || customStatus.trim().length === 0}
            className="rounded-lg border border-white/[0.1] bg-white/[0.08] px-3 text-[12px] font-medium text-zinc-100 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("Save")}
          </button>
        </form>
      ) : null}
      {error === null ? null : (
        <p className="mt-2 px-1 text-[11px] leading-4 text-red-300">{error}</p>
      )}
    </div>
  );
}

const participantRoleLabel = (actor: Actor): string => {
  if (actor.type === "chat_bot") {
    return "Chat bot";
  }

  if (actor.type === "mod_bot") {
    return "Mod bot";
  }

  return "Human";
};

function ParticipantProfileDialog({
  actor,
  onClose,
}: {
  actor: Actor;
  onClose: () => void;
}) {
  const { t } = useUiLanguage();
  const closeButton = useRef<HTMLButtonElement>(null);
  const provided = (value: string | null): string =>
    value === null || value.trim().length === 0 ? t("Not provided") : value;

  useEffect(() => {
    requestAnimationFrame(() => closeButton.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t("Close profile")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t(`${actor.display}'s profile`)}
        className="relative z-10 flex max-h-[min(720px,calc(100vh-32px))] w-full max-w-md flex-col overflow-hidden rounded-window border border-white/10 bg-[image:var(--modbots-profile-background)] shadow-[0_28px_100px_rgba(0,0,0,0.72)]"
      >
        <header className="flex items-start gap-4 border-b border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.09),transparent_48%)] p-5">
          <ActorProfilePicture
            actor={actor}
            actorId={actor.id}
            name={actor.display}
            size="lg"
          />
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="truncate text-lg font-semibold text-zinc-50">
              {actor.display}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {t(participantRoleLabel(actor))}
            </p>
            {actor.statusText === null ? null : (
              <p className="mt-2 flex items-start gap-2 text-[13px] leading-5 text-zinc-200">
                {actor.statusMode === "media" ? (
                  <Film className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
                ) : actor.statusMode === "game" ? (
                  <Gamepad2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
                ) : (
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
                )}
                <span>{actor.statusText}</span>
              </p>
            )}
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label={t("Close profile")}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="modbots-scroll min-h-0 overflow-y-auto px-5 py-4">
          <div className="space-y-1">
            <ProfileDetailRow
              icon={<Users className="h-4 w-4" />}
              label={t("Role")}
              value={t(participantRoleLabel(actor))}
            />
            <ProfileDetailRow
              icon={<AtSign className="h-4 w-4" />}
              label={t("Username")}
              value={
                actor.handle === null ? t("Not provided") : `@${actor.handle}`
              }
            />
            <ProfileDetailRow
              icon={<CalendarDays className="h-4 w-4" />}
              label={
                actor.registered ? t("Member since") : t("Identity created")
              }
              value={memberSince(actor.createdAt)}
            />
            <ProfileDetailRow
              icon={<FileText className="h-4 w-4" />}
              label={t("About")}
              value={provided(actor.bio)}
            />
            <ProfileDetailRow
              icon={<AtSign className="h-4 w-4" />}
              label={t("Pronouns")}
              value={provided(actor.pronouns)}
            />
            <ProfileDetailRow
              icon={<MapPin className="h-4 w-4" />}
              label={t("Location")}
              value={provided(actor.location)}
            />
            <ProfileDetailRow
              icon={<LinkIcon className="h-4 w-4" />}
              label={t("Links")}
              value={
                actor.links.length === 0 ? (
                  t("Not provided")
                ) : (
                  <div className="flex flex-col items-start gap-1">
                    {actor.links.map((link) => (
                      <a
                        key={link}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="max-w-full truncate underline decoration-zinc-600 underline-offset-2 hover:text-white"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                )
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function RegisteredMark({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        d="M7 3H5a2 2 0 0 0-2 2v2m10-4h2a2 2 0 0 1 2 2v2M7 17H5a2 2 0 0 1-2-2v-2m10 4h2a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="m6.5 10 2.25 2.25 4.75-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SessionRestoreScreen({ restoring }: { restoring: boolean }) {
  const { t } = useUiLanguage();

  return (
    <section className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-modbots-canvas px-6 py-12 text-zinc-100">
      <NextImage
        src={startScreenBg}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-45"
      />
      <div className="relative z-10 flex flex-col items-center text-center">
        <NextImage
          src={appLogo}
          alt=""
          className="h-[72px] w-[72px] rounded-2xl"
        />
        <h1 className="mt-7 text-4xl font-bold text-white">Mod Bots</h1>
        <p className="mt-4 max-w-md text-lg leading-8 text-zinc-400">
          {restoring
            ? t("Restoring your session...")
            : t("Starting Mod Bots...")}
        </p>
      </div>
    </section>
  );
}

interface SaveFilePickerWindow extends Window {
  showSaveFilePicker?: (options: {
    excludeAcceptAllOption?: boolean;
    suggestedName?: string;
    types?: Array<{
      accept: Record<string, string[]>;
      description?: string;
    }>;
  }) => Promise<FileSystemFileHandle>;
}

export function Chatroom() {
  const router = useRouter();
  const { language: uiLanguage, t } = useUiLanguage();
  const [roomId, setRoomId] = useState(defaultRoomId);
  const {
    configureScope: configureNotificationScope,
    lastRoomEventSequence,
    notificationScope,
    notify,
    preferences: notificationPreferences,
    recordRoomEventSequence,
    setCategoryEnabled: setNotificationCategoryEnabled,
  } = useNotifications();
  const {
    actors,
    apiHealth,
    desktopSession,
    enterRoom,
    events,
    hasIdentity,
    identityRestored,
    localActor,
    leaveRoom,
    onlineActorIds,
    overview,
    rooms,
    realtimeStatus,
    rules,
    refresh,
    editContent,
    removeContent,
    sendContent,
    sendMessage,
    signOut,
    uploadProfilePicture,
    removeProfilePicture,
    translate,
    updateProfile,
    updateStatus,
    setMediaPlayback,
  } = useRoomActivity(roomId);
  const roomDirectory = rooms.data?.rooms ?? [];
  const selectedRoom: RoomSummary | undefined =
    roomDirectory.find((room) => room.id === roomId) ?? overview.data?.room;
  const gameLobbyAvailable =
    selectedRoom?.capabilities.includes("games") ?? false;
  const [roomView, setRoomView] = useState<RoomView>("chat");
  const playingMediaAssetIds = useRef<string[]>([]);
  const synchronizedMediaAssetId = useRef<string | null | undefined>(undefined);
  const mediaStatusQueue = useRef<Promise<void>>(Promise.resolve());
  const [draft, setDraft] = useState("");
  const [draftHistoryAvailability, setDraftHistoryAvailability] = useState({
    canUndo: false,
    canRedo: false,
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [recordedVoiceDuration, setRecordedVoiceDuration] = useState<
    number | null
  >(null);
  const [composerMenu, setComposerMenu] = useState<
    "attachment" | "emoji" | null
  >(null);
  const [voiceRecordingStatus, setVoiceRecordingStatus] = useState<
    "idle" | "requesting" | "recording"
  >("idle");
  const [voiceRecordingSeconds, setVoiceRecordingSeconds] = useState(0);
  const [mutedNotice, setMutedNotice] = useState<string | null>(null);
  const [membersOpen, setMembersOpen] = useState(true);
  const [aboutPanelOpen, setAboutPanelOpen] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<
    "participants" | "about" | null
  >(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [participantsWidth, setParticipantsWidth] = usePanelWidth(
    "modbots.desktop.participants-panel-width",
    participantsPanel,
  );
  const [aboutWidth, setAboutWidth] = usePanelWidth(
    "modbots.desktop.about-panel-width",
    aboutPanel,
  );
  const [activityScope, setActivityScope] = useState<ActivityScope>("7d");
  // Moderation opens by default: what the mod bots did is the one story
  // only this room can tell.
  const [openActivity, setOpenActivity] = useState<Record<string, boolean>>({
    moderation: true,
  });
  const toggleActivitySection = (id: string) =>
    setOpenActivity((previous) => ({
      ...previous,
      [id]: !(previous[id] ?? false),
    }));
  const [openRuleId, setOpenRuleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleEventCount, setVisibleEventCount] =
    useState(conversationPageSize);
  const [replyTarget, setReplyTarget] = useState<RoomEvent | null>(null);
  const [contextEditSequence, setContextEditSequence] = useState<string | null>(
    null,
  );
  const [profileActorId, setProfileActorId] = useState<string | null>(null);
  const clearContextEditRequest = useCallback(
    () => setContextEditSequence(null),
    [],
  );
  const closeParticipantProfile = useCallback(
    () => setProfileActorId(null),
    [],
  );
  const viewedProfileActor =
    profileActorId === null ? undefined : actors.get(profileActorId);
  const selectReplyTarget = useCallback(
    (event: RoomEvent) => setReplyTarget(event),
    [],
  );
  // The active participant picker in the composer, opened by typing `@`.
  const [mention, setMention] = useState<{
    query: string;
    index: number;
  } | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [reportProblemOpen, setReportProblemOpen] = useState(false);
  const [requestFeatureOpen, setRequestFeatureOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] =
    useState<SettingsSection>("account");
  const [sendWithEnter, setSendWithEnter] = useState(true);
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [translationLanguage, setTranslationLanguage] =
    useState<ChatLanguage>("zh-CN");
  const chatLanguage: ChatLanguage = translationEnabled
    ? translationLanguage
    : "en";
  const [translatedEventText, setTranslatedEventText] = useState<
    Map<string, string>
  >(() => new Map());
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [translatingSubmission, setTranslatingSubmission] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [localWindowActive, setLocalWindowActive] = useState(false);
  // Entering the room is an explicit act every launch: nothing inside the
  // room renders until the person finishes the browser-side sign-in flow.
  const [entered, setEntered] = useState(false);
  const [switchingRoomId, setSwitchingRoomId] = useState<string | null>(null);
  const presenceJoinedAs = useRef<string | null>(null);
  const chatroomRoot = useRef<HTMLDivElement>(null);
  const conversationViewport = useRef<HTMLDivElement>(null);
  const previousConversationHeight = useRef<number | null>(null);
  const conversationPositioned = useRef(false);
  const followLatestMessage = useRef(true);
  const previousEntered = useRef(entered);
  const previousSearchQuery = useRef(searchQuery);
  const previousVisibleEventCount = useRef(visibleEventCount);
  const wasEntered = useRef(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const draftValueRef = useRef("");
  const draftUndoRef = useRef<string[]>([]);
  const draftRedoRef = useRef<string[]>([]);
  const attachmentInput = useRef<HTMLInputElement>(null);
  const voiceRecorder = useRef<MediaRecorder | null>(null);
  const voiceStream = useRef<MediaStream | null>(null);
  const voiceChunks = useRef<Blob[]>([]);
  const voiceRecordingStartedAt = useRef<number | null>(null);
  const profilePictureInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const pendingTranslations = useRef(new Set<string>());
  const failedTranslations = useRef(new Set<string>());
  const updateDraftHistoryAvailability = () =>
    setDraftHistoryAvailability({
      canUndo: draftUndoRef.current.length > 0,
      canRedo: draftRedoRef.current.length > 0,
    });
  const applyDraft = (value: string) => {
    const current = draftValueRef.current;

    if (value === current) {
      return;
    }

    draftUndoRef.current = [...draftUndoRef.current.slice(-99), current];
    draftRedoRef.current = [];
    draftValueRef.current = value;
    setDraft(value);
    updateDraftHistoryAvailability();
  };

  const setMediaPlaybackAsync = setMediaPlayback.mutateAsync;
  const synchronizeMediaStatus = useCallback(
    (mediaAssetId: string | null) => {
      if (localActor?.statusMode !== "media") {
        synchronizedMediaAssetId.current = undefined;
        return;
      }
      if (synchronizedMediaAssetId.current === mediaAssetId) {
        return;
      }

      synchronizedMediaAssetId.current = mediaAssetId;
      mediaStatusQueue.current = mediaStatusQueue.current
        .catch(() => undefined)
        .then(async () => {
          try {
            await setMediaPlaybackAsync(mediaAssetId);
          } catch {
            if (synchronizedMediaAssetId.current === mediaAssetId) {
              synchronizedMediaAssetId.current = undefined;
            }
          }
        });
    },
    [localActor?.statusMode, setMediaPlaybackAsync],
  );
  const handleMediaPlaybackChange = useCallback(
    (mediaAssetId: string, playing: boolean) => {
      const previous = playingMediaAssetIds.current;
      const previousTarget = previous.at(-1) ?? null;
      const withoutAsset = previous.filter((id) => id !== mediaAssetId);
      const next = playing ? [...withoutAsset, mediaAssetId] : withoutAsset;
      const nextTarget = next.at(-1) ?? null;
      playingMediaAssetIds.current = next;

      if (previousTarget !== nextTarget) {
        synchronizeMediaStatus(nextTarget);
      }
    },
    [synchronizeMediaStatus],
  );

  // Playback belongs to the room that owns the media asset.
  // biome-ignore lint/correctness/useExhaustiveDependencies: roomId intentionally resets room-scoped playback state.
  useEffect(() => {
    playingMediaAssetIds.current = [];
    synchronizedMediaAssetId.current = undefined;
  }, [roomId]);

  useEffect(() => {
    if (localActor?.statusMode === "media") {
      synchronizeMediaStatus(playingMediaAssetIds.current.at(-1) ?? null);
    } else {
      synchronizedMediaAssetId.current = undefined;
    }
  }, [localActor?.statusMode, synchronizeMediaStatus]);

  useEffect(() => {
    if (voiceRecordingStatus !== "recording") {
      setVoiceRecordingSeconds(0);
      return;
    }

    const updateDuration = () => {
      const startedAt = voiceRecordingStartedAt.current;
      setVoiceRecordingSeconds(
        startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000),
      );
    };
    updateDuration();
    const timer = window.setInterval(updateDuration, 1_000);
    return () => window.clearInterval(timer);
  }, [voiceRecordingStatus]);

  useEffect(
    () => () => {
      const recorder = voiceRecorder.current;

      if (recorder !== null) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;

        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      }

      voiceStream.current?.getTracks().forEach((track) => {
        track.stop();
      });
    },
    [],
  );

  const expectedNotificationScope =
    localActor === undefined ? null : `${roomId}:${localActor.id}`;

  useEffect(() => {
    configureNotificationScope(expectedNotificationScope);
  }, [configureNotificationScope, expectedNotificationScope]);

  useEffect(() => {
    const roomEvents = events.data;

    if (
      !entered ||
      localActor === undefined ||
      roomEvents === undefined ||
      notificationScope !== expectedNotificationScope
    ) {
      return;
    }

    const latestSequence = roomEvents.at(-1)?.sequence;

    if (latestSequence === undefined) {
      return;
    }

    if (lastRoomEventSequence === null) {
      recordRoomEventSequence(latestSequence);
      return;
    }

    for (const event of eventsAfterSequence(
      roomEvents,
      lastRoomEventSequence,
    )) {
      const roomNotification = classifyRoomEvent(
        event,
        roomEvents,
        actors,
        localActor.id,
      );

      if (roomNotification !== null) {
        notify(roomNotification);
      }
    }

    recordRoomEventSequence(latestSequence);
  }, [
    actors,
    entered,
    events.data,
    expectedNotificationScope,
    lastRoomEventSequence,
    localActor,
    notificationScope,
    notify,
    recordRoomEventSequence,
  ]);
  const resetDraft = (value: string) => {
    draftValueRef.current = value;
    draftUndoRef.current = [];
    draftRedoRef.current = [];
    setDraft(value);
    updateDraftHistoryAvailability();
  };
  const moveDraftHistory = (direction: "undo" | "redo") => {
    const source = direction === "undo" ? draftUndoRef : draftRedoRef;
    const destination = direction === "undo" ? draftRedoRef : draftUndoRef;
    const value = source.current.pop();

    if (value === undefined) {
      return;
    }

    destination.current.push(draftValueRef.current);
    draftValueRef.current = value;
    setDraft(value);
    setMention(null);
    updateDraftHistoryAvailability();

    requestAnimationFrame(() => {
      const composer = composerRef.current;

      if (composer !== null) {
        composer.focus();
        composer.setSelectionRange(value.length, value.length);
      }
    });
  };
  const apiConnected = apiHealth.data?.status === "ok";
  const chatBotCount = onlineActorIds.filter(
    (actorId) => actors.get(actorId)?.type === "chat_bot",
  ).length;
  const modBotCount = onlineActorIds.filter(
    (actorId) => actors.get(actorId)?.type === "mod_bot",
  ).length;

  const openSearch = useCallback(() => {
    setRoomView("chat");

    if (window.matchMedia("(max-width: 1023px)").matches) {
      setMobilePanel(null);
      setMobileSearchOpen(true);
      return;
    }

    requestAnimationFrame(() => searchInput.current?.focus());
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) {
      searchInput.current?.focus();
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    setSendWithEnter(
      readStoredBoolean(settingsStorageKeys.sendWithEnter, true),
    );
    const storedChatLanguage = readStoredChatLanguage();
    setTranslationEnabled(
      readStoredBoolean(
        settingsStorageKeys.translationEnabled,
        storedChatLanguage !== "en",
      ),
    );
    setTranslationLanguage("zh-CN");
    setSettingsReady(true);
  }, []);

  useEffect(() => {
    const updateLocalWindowActivity = () => {
      setLocalWindowActive(
        document.visibilityState === "visible" && document.hasFocus(),
      );
    };

    updateLocalWindowActivity();
    window.addEventListener("focus", updateLocalWindowActivity);
    window.addEventListener("blur", updateLocalWindowActivity);
    document.addEventListener("visibilitychange", updateLocalWindowActivity);

    return () => {
      window.removeEventListener("focus", updateLocalWindowActivity);
      window.removeEventListener("blur", updateLocalWindowActivity);
      document.removeEventListener(
        "visibilitychange",
        updateLocalWindowActivity,
      );
    };
  }, []);

  useEffect(() => {
    if (!settingsReady) {
      return;
    }

    writeStoredBoolean(settingsStorageKeys.sendWithEnter, sendWithEnter);
  }, [sendWithEnter, settingsReady]);

  useEffect(() => {
    if (!settingsReady) {
      return;
    }

    writeStoredBoolean(
      settingsStorageKeys.translationEnabled,
      translationEnabled,
    );
    window.localStorage.setItem(
      settingsStorageKeys.translationLanguage,
      translationLanguage,
    );
    window.localStorage.setItem(settingsStorageKeys.chatLanguage, chatLanguage);
  }, [chatLanguage, settingsReady, translationEnabled, translationLanguage]);

  const changeTranslationLanguage = useCallback((language: ChatLanguage) => {
    failedTranslations.current.clear();
    setTranslationError(null);
    setTranslationLanguage(language);
  }, []);

  const changeTranslationEnabled = useCallback((enabled: boolean) => {
    failedTranslations.current.clear();
    setTranslationError(null);
    setTranslationEnabled(enabled);
  }, []);

  const openSettings = useCallback((section: SettingsSection = "account") => {
    setSettingsSection(section);
    setSettingsOpen(true);
  }, []);

  useEffect(() => {
    if (
      uploadProfilePicture.error !== null ||
      removeProfilePicture.error !== null
    ) {
      openSettings("account");
    }
  }, [openSettings, removeProfilePicture.error, uploadProfilePicture.error]);

  useEffect(() => {
    if (entered && !wasEntered.current) {
      setMembersOpen(true);
      setAboutPanelOpen(true);
      setMobilePanel(null);
      setMobileSearchOpen(false);
    }

    wasEntered.current = entered;
  }, [entered]);

  const participantStatuses = useMemo(() => {
    const statuses = new Map<
      string,
      {
        present: boolean;
        lastActivityAt: number | null;
      }
    >();

    for (const event of events.data ?? []) {
      if (event.actorId === null) {
        continue;
      }

      const current = statuses.get(event.actorId) ?? {
        present: false,
        lastActivityAt: null,
      };
      const occurredAt = new Date(event.occurredAt).getTime();

      if (event.type === "actor_joined") {
        current.present = true;
        current.lastActivityAt = occurredAt;
      } else if (event.type === "actor_left") {
        current.present = false;
      } else if (
        event.type === "message_posted" ||
        event.type === "content_posted" ||
        event.type === "moderation_action_applied"
      ) {
        current.lastActivityAt = occurredAt;
      }

      statuses.set(event.actorId, current);
    }

    return statuses;
  }, [events.data]);
  const visibleOnlineActors = onlineActorIds
    .map((actorId) => actors.get(actorId))
    .filter(
      (actor): actor is Actor =>
        actor !== undefined && isVisibleParticipant(actor),
    );
  const roster = useMemo(() => {
    const now = Date.now();
    const onlineIds = new Set(onlineActorIds);
    const onlineHumans = visibleOnlineActors.filter(
      (actor) => actor.type === "human",
    );
    const botResidents = [...actors.values()]
      .filter(
        (actor) =>
          actor.retiredAt === null &&
          actor.profilePictureUrl !== null &&
          (actor.type === "chat_bot" || actor.type === "mod_bot"),
      )
      .sort((left, right) => left.display.localeCompare(right.display));

    const statusFor = (actor: Actor): ParticipantStatus => {
      const state = participantStatuses.get(actor.id);
      const lastActivityAt = state?.lastActivityAt ?? null;

      if (actor.type === "human") {
        if (actor.id === localActor?.id && localWindowActive) {
          return "active";
        }

        return lastActivityAt !== null &&
          now - lastActivityAt <= participantActiveWindowMs
          ? "active"
          : "idle";
      }

      // Presence comes from the roster, which the backend derives from the
      // full event history; the client's bounded event window only informs
      // recency, never presence.
      if (!onlineIds.has(actor.id)) {
        return "offline";
      }

      return lastActivityAt !== null &&
        now - lastActivityAt <= participantActiveWindowMs
        ? "active"
        : "idle";
    };

    const membersByType: Record<
      ActorType,
      Array<{ actor: Actor; status: ParticipantStatus }>
    > = {
      human: onlineHumans.map((actor) => ({ actor, status: statusFor(actor) })),
      chat_bot: botResidents
        .filter((actor) => actor.type === "chat_bot")
        .map((actor) => ({ actor, status: statusFor(actor) })),
      mod_bot: botResidents
        .filter((actor) => actor.type === "mod_bot")
        .map((actor) => ({ actor, status: statusFor(actor) })),
    };

    return roleOrder.map((type) => ({
      type,
      members: membersByType[type],
    }));
  }, [
    actors,
    localActor?.id,
    localWindowActive,
    onlineActorIds,
    participantStatuses,
    visibleOnlineActors,
  ]);
  const localParticipantStatus =
    localActor === undefined
      ? "offline"
      : (roster
          .flatMap((group) => group.members)
          .find((member) => member.actor.id === localActor.id)?.status ??
        "offline");
  const localParticipantStatusStyle =
    participantStatusStyles[localParticipantStatus];
  const projectedEvents = useMemo(
    () => projectContentLifecycle(events.data ?? []),
    [events.data],
  );
  const roomEvents = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();

    return projectedEvents
      .filter(
        (event) =>
          event.type === "message_posted" ||
          event.type === "content_posted" ||
          event.type === "moderation_action_applied",
      )
      .filter((event) => {
        if (query.length === 0) {
          return true;
        }

        const displayed = displayedEventText(
          event,
          chatLanguage,
          translatedEventText,
        );
        const searchable =
          displayed.length > 0 ? displayed : eventContent(event);
        return searchable.toLocaleLowerCase().includes(query);
      });
  }, [chatLanguage, projectedEvents, searchQuery, translatedEventText]);
  const hiddenEventCount = Math.max(0, roomEvents.length - visibleEventCount);
  const visibleRoomEvents = useMemo(
    () => roomEvents.slice(-visibleEventCount),
    [roomEvents, visibleEventCount],
  );
  const timeline = useMemo(
    () => buildTimeline(visibleRoomEvents),
    [visibleRoomEvents],
  );
  useEffect(() => {
    if (chatLanguage !== "zh-CN" || localActor === undefined) {
      return;
    }

    const candidates: Array<{ sequence: string; text: string }> = [];
    let totalCharacters = 0;

    for (const event of projectedEvents.slice(-visibleEventCount)) {
      if (
        (event.type !== "message_posted" && event.type !== "content_posted") ||
        translatedEventText.has(event.sequence) ||
        pendingTranslations.current.has(event.sequence) ||
        failedTranslations.current.has(event.sequence) ||
        eventSource(event)?.language === "zh-CN"
      ) {
        continue;
      }

      const text = eventText(event);

      if (
        text.trim().length === 0 ||
        text.length > 4_000 ||
        candidates.length >= 50 ||
        totalCharacters + text.length > 40_000
      ) {
        continue;
      }

      candidates.push({ sequence: event.sequence, text });
      totalCharacters += text.length;
    }

    if (candidates.length === 0) {
      return;
    }

    for (const candidate of candidates) {
      pendingTranslations.current.add(candidate.sequence);
    }

    void translate(
      candidates.map((candidate) => candidate.text),
      "en",
      "zh-CN",
    )
      .then((translations) => {
        setTranslatedEventText((current) => {
          const next = new Map(current);

          candidates.forEach((candidate, index) => {
            const translated = translations[index];

            if (translated !== undefined) {
              next.set(candidate.sequence, translated);
            }
          });

          return next;
        });
        setTranslationError(null);
      })
      .catch(() => {
        for (const candidate of candidates) {
          failedTranslations.current.add(candidate.sequence);
        }
        setTranslationError(
          "Some messages could not be translated. English remains visible until translation is available.",
        );
      })
      .finally(() => {
        for (const candidate of candidates) {
          pendingTranslations.current.delete(candidate.sequence);
        }
      });
  }, [
    chatLanguage,
    localActor,
    projectedEvents,
    translate,
    translatedEventText,
    visibleEventCount,
  ]);
  const latestRoomEventSequence =
    roomEvents[roomEvents.length - 1]?.sequence ?? null;
  const previousLatestRoomEventSequence = useRef(latestRoomEventSequence);
  // Replies reference the content item behind a message; this resolves the
  // reference back to the original message for the quoted line.
  const messagesByContentItem = useMemo(() => {
    const map = new Map<string, RoomEvent>();

    for (const event of projectedEvents) {
      if (event.type !== "message_posted" && event.type !== "content_posted") {
        continue;
      }

      const contentItemId = payloadString(event, "contentItemId");

      if (contentItemId !== null) {
        map.set(contentItemId, event);
      }
    }

    return map;
  }, [projectedEvents]);
  const editMessage = useCallback(
    async (event: RoomEvent, nextText: string): Promise<void> => {
      const contentItemId = payloadString(event, "contentItemId");
      const parts = contentPartInputs(event);
      const textIndex = parts.findIndex((part) => part.kind === "text");

      if (contentItemId === null || textIndex < 0) {
        throw new Error("This message cannot be edited.");
      }

      const current = parts[textIndex];

      if (current === undefined || current.kind !== "text") {
        throw new Error("This message cannot be edited.");
      }

      let replacement: ContentPartInput;

      if (current.sourceLanguage === "zh-CN") {
        const [translated] = await translate([nextText], "zh-CN", "en");

        if (translated === undefined) {
          throw new Error("Translation returned no message.");
        }

        replacement = {
          ...current,
          text: translated,
          sourceText: nextText,
          sourceLanguage: "zh-CN",
        };
      } else {
        replacement = {
          ...current,
          text: nextText,
          ...(current.sourceText === undefined ? {} : { sourceText: nextText }),
        };
      }

      const nextParts = [...parts];
      nextParts[textIndex] = replacement;
      await editContent.mutateAsync({ contentItemId, parts: nextParts });
      setTranslatedEventText((currentTranslations) => {
        const next = new Map(currentTranslations);
        next.delete(event.sequence);
        return next;
      });
    },
    [editContent, translate],
  );
  const deleteMessage = useCallback(
    async (event: RoomEvent): Promise<void> => {
      const contentItemId = payloadString(event, "contentItemId");

      if (contentItemId === null) {
        throw new Error("This message cannot be deleted.");
      }

      await removeContent.mutateAsync(contentItemId);
    },
    [removeContent],
  );
  const deleteAttachment = useCallback(
    async (event: RoomEvent, partId: string): Promise<void> => {
      const contentItemId = payloadString(event, "contentItemId");

      if (contentItemId === null) {
        throw new Error("This attachment cannot be deleted.");
      }

      const remainingParts = contentPartInputs(event).filter(
        (part) => part.partId !== partId,
      );

      if (remainingParts.length === 0) {
        await removeContent.mutateAsync(contentItemId);
        return;
      }

      await editContent.mutateAsync({ contentItemId, parts: remainingParts });
    },
    [editContent, removeContent],
  );
  const editContextMessage = useCallback((sequence: string) => {
    setContextEditSequence(sequence);
  }, []);
  const deleteContextMessage = useCallback(
    async (sequence: string): Promise<void> => {
      const event = projectedEvents.find(
        (candidate) => candidate.sequence === sequence,
      );

      if (event === undefined || event.actorId !== localActor?.id) {
        throw new Error("This message cannot be deleted.");
      }

      await deleteMessage(event);
    },
    [deleteMessage, localActor?.id, projectedEvents],
  );
  // The dictionary the message renderer matches `@mentions` against.
  const mentionLabels = useMemo(() => buildMentionLabels(actors), [actors]);
  const ruleTitles = useMemo(
    () =>
      new Map((rules.data?.rules ?? []).map((rule) => [rule.id, rule.title])),
    [rules.data],
  );
  // The room's activity, computed from the full event history the client
  // already holds (getRoomEvents pages through the entire record). The
  // scope tabs re-window the same record; nothing here is estimated.
  const activity = useMemo(() => {
    const dayMs = 86_400_000;
    const weekMs = 7 * dayMs;
    const source = events.data ?? [];
    const todayStart = startOfDay(new Date());
    const firstEventStart =
      source.length > 0
        ? startOfDay(new Date(source[0].occurredAt))
        : todayStart;
    // "All" buckets by week, anchored so today falls in the last bucket;
    // the leading partial week folds into the first bucket.
    const bucketMs = activityScope === "all" ? weekMs : dayMs;
    const start =
      activityScope === "7d"
        ? todayStart - 6 * dayMs
        : activityScope === "30d"
          ? todayStart - 29 * dayMs
          : todayStart -
            Math.floor((todayStart - firstEventStart) / weekMs) * weekMs;
    const bucketCount =
      activityScope === "7d"
        ? 7
        : activityScope === "30d"
          ? 30
          : Math.floor((todayStart - start) / weekMs) + 1;
    const weekdayName = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
    });
    const weekdayInitial = new Intl.DateTimeFormat(undefined, {
      weekday: "narrow",
    });
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const at = start + index * bucketMs;

      return {
        key: String(at),
        count: 0,
        label:
          activityScope === "7d"
            ? weekdayName.format(new Date(at))
            : activityScope === "30d"
              ? shortDate(at)
              : `Week of ${shortDate(at)}`,
        initial:
          activityScope === "7d" ? weekdayInitial.format(new Date(at)) : null,
      };
    });
    const messagesByType: Record<ActorType | "unknown", number> = {
      human: 0,
      chat_bot: 0,
      mod_bot: 0,
      unknown: 0,
    };
    const talkedByType: Record<ActorType | "unknown", Set<string>> = {
      human: new Set(),
      chat_bot: new Set(),
      mod_bot: new Set(),
      unknown: new Set(),
    };
    const moderationByAction = new Map<string, number>();
    const messagesByActor = new Map<string, number>();
    let messages = 0;
    let moderationTotal = 0;

    for (const event of source) {
      const occurred = new Date(event.occurredAt).getTime();

      if (activityScope !== "all" && occurred < start) {
        continue;
      }

      if (event.type === "message_posted" || event.type === "content_posted") {
        messages += 1;
        const index = Math.min(
          bucketCount - 1,
          Math.max(0, Math.floor((occurred - start) / bucketMs)),
        );
        buckets[index].count += 1;
        const type =
          event.actorId === null
            ? "unknown"
            : (actors.get(event.actorId)?.type ?? "unknown");
        messagesByType[type] += 1;

        if (event.actorId !== null) {
          talkedByType[type].add(event.actorId);
          messagesByActor.set(
            event.actorId,
            (messagesByActor.get(event.actorId) ?? 0) + 1,
          );
        }
      } else if (event.type === "moderation_action_applied") {
        moderationTotal += 1;
        const action = payloadString(event, "action") ?? "other";
        moderationByAction.set(
          action,
          (moderationByAction.get(action) ?? 0) + 1,
        );
      }
    }

    const typeOrder: Array<ActorType | "unknown"> = [
      "human",
      "chat_bot",
      "mod_bot",
      "unknown",
    ];
    const messageRows = typeOrder
      .filter((type) => messagesByType[type] > 0)
      .map((type) => ({
        label: actorTypeRowLabels[type],
        count: messagesByType[type],
      }))
      .sort((a, b) => b.count - a.count);
    const talkedRows = typeOrder
      .filter((type) => talkedByType[type].size > 0)
      .map((type) => ({
        label: actorTypeRowLabels[type],
        count: talkedByType[type].size,
      }))
      .sort((a, b) => b.count - a.count);
    const moderationRows = [...moderationByAction]
      .map(([action, count]) => ({
        label: moderationActionLabels[action] ?? action.replace(/_/g, " "),
        count,
      }))
      .sort((a, b) => b.count - a.count);
    const topPosters = [...messagesByActor]
      .map(([actorId, count]) => ({ actorId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      buckets,
      max: Math.max(...buckets.map((bucket) => bucket.count), 1),
      messages,
      messageRows,
      moderationTotal,
      moderationRows,
      talkedTotal: talkedRows.reduce((sum, row) => sum + row.count, 0),
      talkedRows,
      topPosters,
      rangeStartLabel:
        activityScope === "all" ? shortDate(firstEventStart) : shortDate(start),
    };
  }, [events.data, actors, activityScope]);
  // Muted state is imperceptible until a send fails, so it is derived from
  // the room's own moderation events for the local actor.
  const isMuted = useMemo(() => {
    if (localActor === undefined) {
      return false;
    }

    let muted = false;

    for (const event of events.data ?? []) {
      if (event.actorId !== localActor.id) {
        continue;
      }

      if (event.type === "actor_muted") {
        muted = true;
      } else if (event.type === "actor_unmuted") {
        muted = false;
      }
    }

    return muted;
  }, [events.data, localActor]);
  const localProfile = useMemo(() => {
    if (localActor === undefined) {
      return null;
    }

    let messages = 0;
    let messagesToday = 0;
    let lastMessageAt: string | null = null;
    let joinedAt: string | null = null;
    let joinedAtMs: number | null = null;
    let roomMessagesSinceJoin = 0;
    let repliesToMe = 0;
    let moderationOnMe = 0;
    let lastModerationOnMe: RoomEvent | null = null;
    const mySequences = new Set<string>();
    const partnerCounts = new Map<string, number>();
    const othersSinceJoin = new Map<string, number>();
    const todayStart = startOfDay(new Date());
    const countPartner = (actorId: string | null) => {
      if (actorId !== null && actorId !== localActor.id) {
        partnerCounts.set(actorId, (partnerCounts.get(actorId) ?? 0) + 1);
      }
    };

    for (const event of events.data ?? []) {
      if (event.type === "actor_joined") {
        if (event.actorId === localActor.id) {
          joinedAt = event.occurredAt;
          joinedAtMs = new Date(event.occurredAt).getTime();
        }

        continue;
      }

      if (event.type === "moderation_action_applied") {
        const target = payloadString(event, "targetEventSequence");

        if (target !== null && mySequences.has(target)) {
          moderationOnMe += 1;
          lastModerationOnMe = event;
        }

        continue;
      }

      if (event.type !== "message_posted" && event.type !== "content_posted") {
        continue;
      }

      const reply = payloadReply(event);
      const replyTargetAuthor =
        reply === null
          ? null
          : (messagesByContentItem.get(reply.contentItemId)?.actorId ?? null);

      if (event.actorId === localActor.id) {
        messages += 1;
        lastMessageAt = event.occurredAt;
        mySequences.add(event.sequence);

        if (reply !== null) {
          countPartner(replyTargetAuthor);
        }

        if (new Date(event.occurredAt).getTime() >= todayStart) {
          messagesToday += 1;
        }

        continue;
      }

      if (
        joinedAtMs !== null &&
        new Date(event.occurredAt).getTime() >= joinedAtMs
      ) {
        roomMessagesSinceJoin += 1;

        if (event.actorId !== null) {
          othersSinceJoin.set(
            event.actorId,
            (othersSinceJoin.get(event.actorId) ?? 0) + 1,
          );
        }
      }

      if (replyTargetAuthor === localActor.id) {
        repliesToMe += 1;
        countPartner(event.actorId);
      }
    }

    const topPartners = [...partnerCounts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([actorId, count]) => ({
        name: actorLabel(actorId, actors),
        count,
      }));
    const mostActiveEntry = [...othersSinceJoin].sort((a, b) => b[1] - a[1])[0];
    let lastModerationLabel: string | null = null;

    if (lastModerationOnMe !== null) {
      const applied: RoomEvent = lastModerationOnMe;
      const action =
        payloadString(applied, "action")?.replace(/_/g, " ") ??
        "a moderation action";
      const ruleId = payloadString(applied, "ruleId");
      const ruleTitle = ruleId === null ? undefined : ruleTitles.get(ruleId);
      lastModerationLabel = `${action[0].toUpperCase()}${action.slice(1)} by ${actorLabel(applied.actorId, actors)}${
        ruleTitle === undefined ? "" : ` · rule: ${ruleTitle}`
      }`;
    }

    return {
      accountLabel: localActor.registered
        ? "Registered account"
        : "Guest session",
      handleLabel:
        localActor.registered && localActor.handle !== null
          ? `@${localActor.handle}`
          : "This identity ends when you leave",
      identityLabel:
        localActor.discriminator === null
          ? "No room identity assigned"
          : `Room identity #${localActor.discriminator}`,
      profilePictureLabel:
        localActor.profilePictureId === null
          ? "Monogram fallback right now"
          : "UPPS-served picture",
      joinedAt,
      lastMessageAt,
      messages,
      messagesToday,
      roomMessagesSinceJoin,
      repliesToMe,
      topPartners,
      moderationOnMe,
      lastModerationLabel,
      mostActiveSinceJoin:
        mostActiveEntry === undefined
          ? null
          : actorLabel(mostActiveEntry[0], actors),
      online: onlineActorIds.includes(localActor.id),
    };
  }, [
    events.data,
    localActor,
    onlineActorIds,
    actors,
    messagesByContentItem,
    ruleTitles,
  ]);
  const accountSettings = useMemo<AccountSettingsSummary | null>(() => {
    if (localActor === undefined || localProfile === null) {
      return null;
    }

    return {
      display: localActor.display,
      alias: localProfile.handleLabel,
      accountLabel: localProfile.accountLabel,
      registered: localActor.registered,
      identityLabel: localProfile.identityLabel,
      memberSinceLabel: memberSince(localActor.createdAt),
      profilePictureSummary:
        localActor.profilePictureId === null
          ? "You are using the monogram fallback right now."
          : "This profile picture is assigned through the Unified Profile-Picture System.",
      hasProfilePicture: localActor.profilePictureId !== null,
      healthSummary: isMuted
        ? "Muted right now."
        : localProfile.moderationOnMe === 0
          ? "Good standing. No mod bot has had to act on your messages."
          : `${localProfile.moderationOnMe.toLocaleString()} mod bot ${
              localProfile.moderationOnMe === 1 ? "action" : "actions"
            } on your messages.`,
      latestModerationLabel: localProfile.lastModerationLabel,
      bio: localActor.bio,
      pronouns: localActor.pronouns,
      location: localActor.location,
      links: localActor.links ?? [],
    };
  }, [isMuted, localActor, localProfile]);
  const openAccountPage = useCallback(() => {
    window.open(
      new URL("/account", accountBaseUrl).toString(),
      "_blank",
      "noopener,noreferrer",
    );
  }, []);
  const openAccountSettings = useCallback(() => {
    setUserMenuOpen(false);
    openSettings("account");
  }, [openSettings]);
  const chooseProfilePicture = useCallback(() => {
    uploadProfilePicture.reset();
    removeProfilePicture.reset();
    profilePictureInput.current?.click();
  }, [removeProfilePicture, uploadProfilePicture]);
  // Everyone a human can address: the bot residents, always in the room, and
  // any other human currently present. Yourself and the platform are never
  // addressees.
  const addressableParticipants = useMemo(() => {
    const seen = new Set<string>();
    const list: Actor[] = [];
    const consider = (actor: Actor | undefined) => {
      if (
        actor === undefined ||
        actor.retiredAt !== null ||
        actor.id === localActor?.id ||
        seen.has(actor.id) ||
        !isVisibleParticipant(actor)
      ) {
        return;
      }

      seen.add(actor.id);
      list.push(actor);
    };

    for (const actor of actors.values()) {
      if (actor.type === "chat_bot" || actor.type === "mod_bot") {
        consider(actor);
      }
    }

    for (const actorId of onlineActorIds) {
      consider(actors.get(actorId));
    }

    return list.sort((left, right) =>
      left.display.localeCompare(right.display),
    );
  }, [actors, onlineActorIds, localActor]);
  const mentionOptions = useMemo((): MentionOption[] => {
    if (mention === null) {
      return [];
    }

    const query = mention.query.toLowerCase();
    const options: MentionOption[] = [];

    if (
      query.length === 0 ||
      "room".startsWith(query) ||
      "everyone".startsWith(query)
    ) {
      options.push({ kind: "room" });
    }

    for (const actor of addressableParticipants) {
      if (
        query.length === 0 ||
        actor.displayName.toLowerCase().includes(query) ||
        actor.display.toLowerCase().includes(query)
      ) {
        options.push({ kind: "actor", actor });
      }
    }

    return options.slice(0, 8);
  }, [mention, addressableParticipants]);
  const updateMentionState = (text: string, caret: number) => {
    const found = mentionAt(text, caret);
    setMention(found === null ? null : { query: found.query, index: 0 });
  };
  const applyMention = (option: MentionOption) => {
    const caret = composerRef.current?.selectionStart ?? draft.length;
    const found = mentionAt(draft, caret);

    if (found === null) {
      setMention(null);
      return;
    }

    const token = option.kind === "room" ? "@room" : `@${option.actor.display}`;
    const insertion = `${token} `;
    const before = draft.slice(0, found.start);
    const after = draft.slice(caret);
    const nextCaret = before.length + insertion.length;

    applyDraft(`${before}${insertion}${after}`);
    setMention(null);

    requestAnimationFrame(() => {
      const element = composerRef.current;

      if (element !== null) {
        element.focus();
        element.setSelectionRange(nextCaret, nextCaret);
      }
    });
  };
  const handleComposerKeyDown = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      moveDraftHistory(event.shiftKey ? "redo" : "undo");
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
      event.preventDefault();
      moveDraftHistory("redo");
      return;
    }

    if (mention !== null && mentionOptions.length > 0) {
      const count = mentionOptions.length;
      const active = Math.min(mention.index, count - 1);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMention({ query: mention.query, index: (active + 1) % count });
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMention({
          query: mention.query,
          index: (active - 1 + count) % count,
        });
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        applyMention(mentionOptions[active]);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setMention(null);
        return;
      }
    }

    const shouldSubmit = sendWithEnter
      ? event.key === "Enter" && !event.shiftKey
      : event.key === "Enter" && (event.ctrlKey || event.metaKey);

    if (shouldSubmit && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };
  const openAttachmentPicker = (accept: string) => {
    if (attachmentInput.current !== null) {
      attachmentInput.current.accept = accept;
      attachmentInput.current.click();
    }
  };
  const insertEmoji = (emoji: string) => {
    const composer = composerRef.current;
    const start = composer?.selectionStart ?? draftValueRef.current.length;
    const end = composer?.selectionEnd ?? start;
    const next = `${draftValueRef.current.slice(0, start)}${emoji}${draftValueRef.current.slice(end)}`;

    if (next.length > 4_000) {
      return;
    }

    applyDraft(next);
    setMention(null);
    requestAnimationFrame(() => {
      composer?.focus();
      const caret = start + emoji.length;
      composer?.setSelectionRange(caret, caret);
    });
  };
  const releaseVoiceStream = () => {
    voiceStream.current?.getTracks().forEach((track) => {
      track.stop();
    });
    voiceStream.current = null;
  };
  const stopVoiceRecording = () => {
    const recorder = voiceRecorder.current;

    if (recorder !== null && recorder.state !== "inactive") {
      recorder.stop();
    }
  };
  const startVoiceRecording = async () => {
    setComposerMenu(null);
    setAttachmentError(null);
    setDeliveryError(null);

    if (
      navigator.mediaDevices?.getUserMedia === undefined ||
      typeof MediaRecorder === "undefined"
    ) {
      setAttachmentError("Voice recording is not supported in this browser.");
      return;
    }

    setVoiceRecordingStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      const mimeType = preferredVoiceMimeTypes.find((candidate) =>
        MediaRecorder.isTypeSupported(candidate),
      );
      const recorder = new MediaRecorder(stream, {
        audioBitsPerSecond: 64_000,
        ...(mimeType === undefined ? {} : { mimeType }),
      });

      voiceStream.current = stream;
      voiceRecorder.current = recorder;
      voiceChunks.current = [];
      let recordingFailed = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          voiceChunks.current.push(event.data);
        }
      };
      recorder.onerror = () => {
        recordingFailed = true;
        releaseVoiceStream();
        voiceRecorder.current = null;
        voiceRecordingStartedAt.current = null;
        setVoiceRecordingStatus("idle");
        setVoiceRecordingSeconds(0);
        setAttachmentError("The voice recording could not be created.");
      };
      recorder.onstop = () => {
        const startedAt = voiceRecordingStartedAt.current;
        const recordedDuration =
          startedAt === null
            ? 1
            : Math.max(1, Math.round((Date.now() - startedAt) / 1_000));
        const recordedType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(voiceChunks.current, { type: recordedType });
        releaseVoiceStream();
        voiceRecorder.current = null;
        voiceChunks.current = [];
        voiceRecordingStartedAt.current = null;
        setVoiceRecordingStatus("idle");
        setVoiceRecordingSeconds(0);

        if (recordingFailed) {
          return;
        }

        if (blob.size === 0) {
          setAttachmentError("The voice recording could not be created.");
          return;
        }

        const filename = `voice-message-${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")}.${recordingExtension(recordedType)}`;
        setAttachment(new File([blob], filename, { type: recordedType }));
        setRecordedVoiceDuration(recordedDuration);
        setAttachmentError(null);
      };
      recorder.start(250);
      voiceRecordingStartedAt.current = Date.now();
      setVoiceRecordingStatus("recording");
    } catch {
      releaseVoiceStream();
      voiceRecorder.current = null;
      voiceRecordingStartedAt.current = null;
      setVoiceRecordingStatus("idle");
      setVoiceRecordingSeconds(0);
      setAttachmentError(
        "Microphone access is needed to record a voice message.",
      );
    }
  };
  const takeScreenshot = async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const chatroom = chatroomRoot.current;

    if (chatroom === null) {
      return;
    }

    let blob: Blob | null = null;

    try {
      const canvas = await html2canvas(chatroom, {
        backgroundColor: null,
        height: chatroom.clientHeight,
        logging: false,
        scale: Math.min(window.devicePixelRatio, 2),
        useCORS: true,
        width: chatroom.clientWidth,
        windowHeight: chatroom.clientHeight,
        windowWidth: chatroom.clientWidth,
      });
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
    } catch (captureError) {
      notify({
        title: "Screenshot could not be created.",
        message:
          captureError instanceof Error ? captureError.message : undefined,
        tone: "error",
      });
      return;
    }

    if (blob === null) {
      notify({ title: "Screenshot could not be created.", tone: "error" });
      return;
    }

    const saveFilePicker = (window as SaveFilePickerWindow).showSaveFilePicker;

    if (saveFilePicker === undefined) {
      notify({
        title: "Screenshot could not be saved.",
        message: "This browser does not provide a Save As dialog.",
        tone: "error",
      });
      return;
    }

    const suggestedName = `mod-bots-screenshot-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.png`;
    let fileHandle: FileSystemFileHandle;

    try {
      fileHandle = await saveFilePicker.call(window, {
        excludeAcceptAllOption: true,
        suggestedName,
        types: [
          {
            accept: { "image/png": [".png"] },
            description: "PNG image",
          },
        ],
      });
    } catch (saveError) {
      if (
        saveError instanceof DOMException &&
        saveError.name === "AbortError"
      ) {
        return;
      }

      notify({ title: "Screenshot could not be saved.", tone: "error" });
      return;
    }

    try {
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch {
      notify({ title: "Screenshot could not be saved.", tone: "error" });
    }
  };
  const replyToContextMessage = useCallback(
    (sequence: string) => {
      const target = (events.data ?? []).find(
        (event) => event.sequence === sequence,
      );

      if (target === undefined) {
        return;
      }

      setReplyTarget(target);
      requestAnimationFrame(() => composerRef.current?.focus());
    },
    [events.data],
  );
  const logOut = () => {
    setUserMenuOpen(false);
    void signOut();
    setEntered(false);
  };
  const canSend =
    localActor !== undefined &&
    apiConnected &&
    (draft.trim().length > 0 || attachment !== null) &&
    voiceRecordingStatus === "idle" &&
    !sendMessage.isPending &&
    !sendContent.isPending &&
    !translatingSubmission;
  const error =
    apiHealth.error ??
    rooms.error ??
    desktopSession.error ??
    overview.error ??
    events.error;
  const historyUnavailable = events.isError;
  const realtimeConnected = realtimeStatus.state === "connected";
  const connectionProblem = !apiConnected || !realtimeConnected;
  const connectionLabel =
    apiConnected && realtimeConnected
      ? "Connected"
      : realtimeStatus.state === "offline"
        ? "Offline"
        : realtimeStatus.state === "reconnecting" || realtimeConnected
          ? "Reconnecting"
          : "Connecting";
  const previousConnectionLabel = useRef<string | null>(null);
  const hasConnected = useRef(false);

  useEffect(() => {
    const previous = previousConnectionLabel.current;
    previousConnectionLabel.current = connectionLabel;

    if (connectionLabel === "Connected") {
      if (hasConnected.current && previous !== "Connected") {
        notify({
          category: "system",
          title: "Connection restored",
          tone: "success",
        });
      }

      hasConnected.current = true;
      return;
    }

    if (hasConnected.current && previous === "Connected") {
      notify({
        category: "system",
        title: "Connection interrupted",
        message: "Trying to reconnect...",
        tone: "warning",
      });
    }
  }, [connectionLabel, notify]);

  const scrollToLatest = useCallback(() => {
    const viewport = conversationViewport.current;

    if (viewport !== null) {
      viewport.scrollTop = viewport.scrollHeight;
      followLatestMessage.current = true;
    }
  }, []);

  const loadEarlierMessages = () => {
    const viewport = conversationViewport.current;

    previousConversationHeight.current = viewport?.scrollHeight ?? null;
    followLatestMessage.current = false;
    setVisibleEventCount((current) =>
      Math.min(roomEvents.length, current + conversationPageSize),
    );
  };

  const handleConversationScroll = () => {
    const viewport = conversationViewport.current;

    if (viewport === null) {
      return;
    }

    const distanceFromLatest =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    followLatestMessage.current = distanceFromLatest <= 48;

    if (
      viewport.scrollTop <= 64 &&
      hiddenEventCount > 0 &&
      previousConversationHeight.current === null
    ) {
      loadEarlierMessages();
    }
  };

  useEffect(() => {
    if (previousEntered.current === entered) {
      return;
    }

    previousEntered.current = entered;
    conversationPositioned.current = false;
    followLatestMessage.current = true;
  }, [entered]);

  useEffect(() => {
    if (consumeEnterAfterLogin()) {
      setEntered(true);
    }
  }, []);

  useEffect(() => {
    if (previousSearchQuery.current === searchQuery) {
      return;
    }

    previousSearchQuery.current = searchQuery;
    setVisibleEventCount(conversationPageSize);
  }, [searchQuery]);

  useEffect(() => {
    if (previousVisibleEventCount.current === visibleEventCount) {
      return;
    }

    previousVisibleEventCount.current = visibleEventCount;
    const previousHeight = previousConversationHeight.current;
    const viewport = conversationViewport.current;

    if (previousHeight === null || viewport === null) {
      return;
    }

    previousConversationHeight.current = null;
    viewport.scrollTop += viewport.scrollHeight - previousHeight;
  }, [visibleEventCount]);

  useEffect(() => {
    const eventSequenceChanged =
      previousLatestRoomEventSequence.current !== latestRoomEventSequence;
    previousLatestRoomEventSequence.current = latestRoomEventSequence;

    if (!entered || searchQuery.length > 0) {
      return;
    }

    if (
      !conversationPositioned.current ||
      (eventSequenceChanged && followLatestMessage.current)
    ) {
      scrollToLatest();
      conversationPositioned.current = true;
    }
  }, [entered, latestRoomEventSequence, searchQuery, scrollToLatest]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        openSearch();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "," && entered) {
        event.preventDefault();
        openSettings("account");
        return;
      }

      if (event.key === "Escape") {
        setAboutOpen(false);
        setSettingsOpen(false);
        setReplyTarget(null);
        setComposerMenu(null);
        setUserMenuOpen(false);
        setMobilePanel(null);
        setMobileSearchOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [entered, openSearch, openSettings]);

  // Signing out (or a stale identity being dropped) closes the door again.
  useEffect(() => {
    if (!hasIdentity) {
      const recorder = voiceRecorder.current;

      if (recorder !== null && recorder.state !== "inactive") {
        recorder.stop();
      }

      setEntered(false);
      presenceJoinedAs.current = null;
    }
  }, [hasIdentity]);

  useEffect(() => {
    if (identityRestored && !hasIdentity) {
      router.replace("/login");
    }
  }, [hasIdentity, identityRestored, router]);

  useEffect(() => {
    if (hasIdentity && localActor !== undefined) {
      setEntered(true);
    }
  }, [hasIdentity, localActor]);

  // Presence joins once per identity after the person has entered, including
  // restored sessions. Closing the app does not clear identity; logging out
  // is the action that closes the session.
  useEffect(() => {
    if (
      entered &&
      localActor !== undefined &&
      presenceJoinedAs.current !== `${roomId}:${localActor.id}`
    ) {
      presenceJoinedAs.current = `${roomId}:${localActor.id}`;
      void enterRoom();
    }
  }, [entered, localActor, enterRoom, roomId]);

  const switchRoom = async (nextRoomId: string): Promise<void> => {
    if (
      nextRoomId === roomId ||
      switchingRoomId !== null ||
      voiceRecordingStatus !== "idle"
    ) {
      return;
    }

    setSwitchingRoomId(nextRoomId);
    setDeliveryError(null);

    try {
      await leaveRoom();
      resetDraft("");
      setAttachment(null);
      setAttachmentError(null);
      setRecordedVoiceDuration(null);
      setReplyTarget(null);
      setMention(null);
      setComposerMenu(null);
      setSearchQuery("");
      setTranslatedEventText(new Map());
      setVisibleEventCount(conversationPageSize);
      setContextEditSequence(null);
      setProfileActorId(null);
      setUserMenuOpen(false);
      setMobilePanel(null);
      setMobileSearchOpen(false);
      setRoomView("chat");
      setRoomId(nextRoomId);
    } catch (error) {
      setDeliveryError(
        error instanceof Error ? error.message : "Could not change rooms.",
      );
    } finally {
      setSwitchingRoomId(null);
    }
  };

  const selectRoomView = (view: RoomView): void => {
    if (view === "games" && !gameLobbyAvailable) {
      return;
    }

    setRoomView(view);
    setMobileSearchOpen(false);
    setComposerMenu(null);

    if (view === "games") {
      setSearchQuery("");
    }
  };

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();

    if (!canSend) {
      return;
    }

    resetDraft("");
    setMention(null);
    setComposerMenu(null);
    setMutedNotice(null);
    setTranslationError(null);
    setDeliveryError(null);
    const replyContentItemId =
      replyTarget === null ? null : payloadString(replyTarget, "contentItemId");
    const addressedTo = deriveAddressedTo(content, addressableParticipants);
    let translationCompleted = chatLanguage !== "zh-CN" || content.length === 0;

    try {
      let chatroomContent = content;
      let source: { text: string; language: string } | undefined;

      if (chatLanguage === "zh-CN" && content.length > 0) {
        setTranslatingSubmission(true);
        const [translated] = await translate([content], "zh-CN", "en");

        if (translated === undefined) {
          throw new Error("Translation returned no message.");
        }

        chatroomContent = translated;
        source = { text: content, language: "zh-CN" };
        translationCompleted = true;
      }

      const addressing = {
        ...(replyContentItemId === null
          ? {}
          : { replyTo: { contentItemId: replyContentItemId } }),
        ...(addressedTo.length === 0 ? {} : { addressedTo }),
      };

      if (attachment === null) {
        await sendMessage.mutateAsync({
          content: chatroomContent,
          source,
          ...addressing,
        });
      } else {
        await sendContent.mutateAsync({
          content: chatroomContent,
          source,
          file: attachment,
          ...addressing,
        });
        setAttachment(null);
        setRecordedVoiceDuration(null);
      }
      setReplyTarget(null);
    } catch (sendFailure) {
      resetDraft(content);

      if (isMutedError(sendFailure)) {
        setMutedNotice(
          "You are muted by moderation. Your message was not sent.",
        );
      } else if (!translationCompleted) {
        setTranslationError(
          "Your message could not be translated, so it was not sent.",
        );
      } else {
        setDeliveryError(
          sendFailure instanceof Error
            ? sendFailure.message
            : "The message could not be delivered.",
        );
      }
    } finally {
      setTranslatingSubmission(false);
    }
  };

  return (
    <div
      ref={chatroomRoot}
      className="modbots-chatroom flex h-screen h-dvh flex-col overflow-hidden bg-modbots-canvas text-zinc-100"
    >
      <input
        ref={profilePictureInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";

          if (file !== undefined) {
            uploadProfilePicture.mutate(file);
          }
        }}
      />
      {entered ? (
        <>
          <AutomaticUpdateChecker currentVersion={appVersion} />
          <MenuBar
            canUndoMessage={draftHistoryAvailability.canUndo}
            canRedoMessage={draftHistoryAvailability.canRedo}
            onUndoMessage={() => moveDraftHistory("undo")}
            onRedoMessage={() => moveDraftHistory("redo")}
            onOpenSettings={() => openSettings("account")}
            onReportProblem={() => setReportProblemOpen(true)}
            onRequestFeature={() => setRequestFeatureOpen(true)}
            onOpenAbout={() => setAboutOpen(true)}
            onTakeScreenshot={() => void takeScreenshot()}
          />
          <DesktopContextMenu
            enabled={entered}
            rootRef={chatroomRoot}
            onDeleteMessage={deleteContextMessage}
            onEditMessage={editContextMessage}
            onReplyToMessage={replyToContextMessage}
            onViewProfile={setProfileActorId}
          />
          {viewedProfileActor === undefined ? null : (
            <ParticipantProfileDialog
              actor={viewedProfileActor}
              onClose={closeParticipantProfile}
            />
          )}
        </>
      ) : null}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {userMenuOpen ? (
          <div
            className="fixed inset-0 z-20"
            onClick={() => setUserMenuOpen(false)}
            aria-hidden="true"
          />
        ) : null}
        {mobilePanel !== null ? (
          <button
            type="button"
            aria-label={t("Close side panel")}
            onClick={() => {
              setMobilePanel(null);
              setUserMenuOpen(false);
            }}
            className="fixed inset-x-0 bottom-7 top-11 z-30 bg-modbots-overlay backdrop-blur-[2px] lg:hidden"
          />
        ) : null}
        <div className="modbots-print-chat-layout relative flex min-h-0 flex-1">
          {!entered ? (
            <SessionRestoreScreen restoring={identityRestored && hasIdentity} />
          ) : (
            <>
              {membersOpen ? (
                <aside
                  className={`fixed bottom-7 left-0 top-11 z-40 w-[min(88vw,340px)] shrink-0 flex-col border-r border-white/[0.08] bg-modbots-panel shadow-[20px_0_60px_rgba(0,0,0,0.5)] lg:static lg:z-auto lg:flex lg:w-[var(--participants-width)] lg:shadow-none ${
                    mobilePanel === "participants" ? "flex" : "hidden"
                  }`}
                  style={
                    {
                      "--participants-width": `${participantsWidth}px`,
                    } as CSSProperties
                  }
                >
                  <div className="flex h-[68px] shrink-0 items-center border-b border-white/[0.08] px-5">
                    <h1 className="truncate text-[15px] font-semibold text-white">
                      {t("Rooms")}
                    </h1>
                    <button
                      type="button"
                      onClick={() => {
                        setMobilePanel(null);
                        setUserMenuOpen(false);
                      }}
                      className="ml-auto rounded-lg p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-white lg:hidden"
                      aria-label={t("Close participants")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <nav
                    aria-label={t("Rooms")}
                    className="shrink-0 border-b border-white/[0.06] p-2.5"
                  >
                    {rooms.isLoading ? (
                      <div className="flex h-10 items-center justify-center text-zinc-600">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {roomDirectory.map((room) => {
                          const selected = room.id === roomId;
                          const switching = room.id === switchingRoomId;

                          return (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() => void switchRoom(room.id)}
                              disabled={
                                selected ||
                                switchingRoomId !== null ||
                                voiceRecordingStatus !== "idle"
                              }
                              aria-current={selected ? "page" : undefined}
                              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-default ${
                                selected
                                  ? "bg-white/[0.08] text-white"
                                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100 disabled:opacity-60"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                  selected ? "bg-emerald-400" : "bg-zinc-700"
                                }`}
                              />
                              <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
                                {room.name}
                              </span>
                              {switching ? (
                                <LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-500" />
                              ) : (
                                <span className="text-[10px] tabular-nums text-zinc-600">
                                  {room.peopleOnline}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </nav>
                  <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-5 py-2 text-zinc-400">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-[0.08em]">
                      {t("Participants")}
                    </span>
                    <span className="ml-auto text-xs tabular-nums text-zinc-500">
                      {visibleOnlineActors.length}
                    </span>
                  </div>
                  <div className="modbots-scroll min-h-0 flex-1 overflow-y-auto p-3">
                    <div className="space-y-4">
                      {roster.map((group) => (
                        <div key={group.type}>
                          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
                            {t(roleLabels[group.type])} · {group.members.length}
                          </p>
                          <div className="space-y-0.5">
                            {group.members.map((member) => (
                              <ParticipantRow
                                key={member.actor.id}
                                actor={member.actor}
                                status={member.status}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="relative shrink-0 border-t border-white/[0.08] p-3">
                    {userMenuOpen &&
                    localActor !== undefined &&
                    localProfile !== null ? (
                      <div
                        className="absolute bottom-full left-3 z-30 mb-2 max-h-[calc(100vh-120px)] w-[320px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-window border border-white/10 bg-[image:var(--modbots-profile-background)] shadow-[0_24px_80px_rgba(0,0,0,0.58)] backdrop-blur-xl"
                        role="dialog"
                        aria-label={t("Your profile")}
                      >
                        <div className="border-b border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_45%)] px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="relative shrink-0">
                              <ActorProfilePicture
                                actor={localActor}
                                actorId={localActor.id}
                                name={localActor.display}
                                size="lg"
                              />
                              <button
                                type="button"
                                onClick={chooseProfilePicture}
                                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] bg-modbots-popover text-zinc-300 shadow-[0_10px_22px_rgba(0,0,0,0.35)] transition-colors hover:border-white/20 hover:bg-modbots-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                                aria-label={t("Change profile picture")}
                                title={t("Change profile picture")}
                              >
                                <Camera className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="min-w-0 flex-1 pt-1">
                              <p className="truncate text-[15px] font-semibold leading-5 text-zinc-50">
                                {localActor.display}
                              </p>
                              <p className="mt-0.5 truncate text-[14px] text-zinc-400">
                                {localProfile.handleLabel}
                              </p>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                {localActor.registered ? (
                                  <RegisteredMark className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                ) : null}
                                <button
                                  type="button"
                                  onClick={openAccountSettings}
                                  className="inline-flex h-4 cursor-pointer items-center text-[13px] font-medium leading-none text-zinc-400 underline decoration-zinc-600 underline-offset-2 transition-colors hover:text-white hover:decoration-zinc-300 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                                >
                                  {localProfile.accountLabel}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-b border-white/[0.08] px-4 py-3">
                          <ProfileStatusControl
                            actor={localActor}
                            saving={updateStatus.isPending}
                            error={
                              updateStatus.error instanceof Error
                                ? updateStatus.error.message
                                : null
                            }
                            onSave={(status) =>
                              updateStatus.mutateAsync(status)
                            }
                          />
                        </div>

                        <div className="space-y-1 px-4 py-3">
                          <ProfileDetailRow
                            icon={<CalendarDays className="h-4 w-4" />}
                            label={
                              localActor.registered
                                ? t("Member since")
                                : t("Identity created")
                            }
                            value={memberSince(localActor.createdAt)}
                          />
                          <ProfileDetailRow
                            icon={<FileText className="h-4 w-4" />}
                            label={t("About")}
                            value={localActor.bio ?? t("Not set")}
                          />
                          <ProfileDetailRow
                            icon={<AtSign className="h-4 w-4" />}
                            label={t("Pronouns")}
                            value={localActor.pronouns ?? t("Not set")}
                          />
                          <ProfileDetailRow
                            icon={<MapPin className="h-4 w-4" />}
                            label={t("Location")}
                            value={localActor.location ?? t("Not set")}
                          />
                          <ProfileDetailRow
                            icon={<LinkIcon className="h-4 w-4" />}
                            label={t("Links")}
                            value={
                              (localActor.links ?? []).length === 0 ? (
                                t("Not set")
                              ) : (
                                <div className="flex flex-wrap gap-x-3 gap-y-1">
                                  {(localActor.links ?? []).map((link) => (
                                    <a
                                      key={link}
                                      href={link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="truncate underline decoration-zinc-600 underline-offset-2 hover:text-white"
                                    >
                                      {new URL(link).hostname}
                                    </a>
                                  ))}
                                </div>
                              )
                            }
                          />
                        </div>
                        <div className="border-t border-white/[0.08] p-2">
                          <button
                            type="button"
                            onClick={logOut}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                          >
                            <LogOut className="h-4 w-4 shrink-0 text-zinc-500" />
                            {t("Log out")}
                          </button>
                        </div>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-1 rounded-window border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.22)]">
                      <button
                        type="button"
                        onClick={() =>
                          localActor === undefined
                            ? undefined
                            : setUserMenuOpen((open) => !open)
                        }
                        disabled={localActor === undefined}
                        aria-haspopup="dialog"
                        aria-expanded={userMenuOpen}
                        title={t("Your profile")}
                        className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-default"
                      >
                        <div className="relative shrink-0">
                          <ActorProfilePicture
                            actor={localActor}
                            actorId={localActor?.id ?? null}
                            name={localActor?.display ?? t("You")}
                            size="md"
                          />
                          {localActor !== undefined ? (
                            <span
                              role="img"
                              className={`modbots-profile-status-dot absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-modbots-panel ${localParticipantStatusStyle.dot}`}
                              aria-label={t(localParticipantStatusStyle.label)}
                              title={t(localParticipantStatusStyle.label)}
                            />
                          ) : null}
                        </div>
                        <span className="min-w-0 truncate text-[13px] font-semibold leading-5 text-zinc-100">
                          {localActor?.display ??
                            (hasIdentity
                              ? t("Preparing session...")
                              : t("Not joined"))}
                        </span>
                        {localActor !== undefined ? (
                          <ChevronDown
                            className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-200 ${
                              userMenuOpen ? "" : "rotate-180"
                            }`}
                          />
                        ) : null}
                      </button>
                    </div>
                  </div>
                </aside>
              ) : null}
              {membersOpen ? (
                <PanelResizeHandle
                  label="Resize the participants panel"
                  width={participantsWidth}
                  limits={participantsPanel}
                  onWidthChange={setParticipantsWidth}
                  grow={1}
                />
              ) : null}

              <div className="modbots-print-chat-column flex min-w-0 flex-1 flex-col">
                <header className="modbots-print-chat-header z-10 flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.08] bg-modbots-panel px-3 lg:h-[68px] lg:gap-4 lg:px-5">
                  {mobileSearchOpen ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
                      <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-modbots-popover px-3">
                        <Search className="h-4 w-4 shrink-0 text-zinc-500" />
                        <input
                          ref={searchInput}
                          value={searchQuery}
                          onChange={(event) =>
                            setSearchQuery(event.currentTarget.value)
                          }
                          placeholder={t("Search the chat")}
                          className="min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setMobileSearchOpen(false);
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 hover:bg-white/[0.06] hover:text-white"
                        aria-label={t("Close search")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-white lg:flex-none">
                        {selectedRoom?.name ?? t("Chat")}
                      </h2>
                      {gameLobbyAvailable ? (
                        <div
                          className="flex shrink-0 rounded-lg border border-white/[0.08] bg-modbots-inset p-0.5"
                          role="tablist"
                          aria-label={t("Room view")}
                        >
                          {(["chat", "games"] as const).map((view) => (
                            <button
                              key={view}
                              type="button"
                              role="tab"
                              aria-selected={roomView === view}
                              onClick={() => selectRoomView(view)}
                              className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition sm:px-3 ${
                                roomView === view
                                  ? "bg-white/[0.09] text-zinc-100"
                                  : "text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              {t(view === "chat" ? "Chat" : "Games")}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      <div className="hidden flex-1 lg:block" />
                      {roomView === "chat" ? (
                        <div className="hidden h-9 w-[min(32vw,380px)] items-center gap-2 rounded-lg border border-white/10 bg-modbots-popover px-3 lg:flex">
                          <Search className="h-4 w-4 shrink-0 text-zinc-500" />
                          <input
                            ref={searchInput}
                            value={searchQuery}
                            onChange={(event) =>
                              setSearchQuery(event.currentTarget.value)
                            }
                            placeholder={t("Search the chat")}
                            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                          />
                          {searchQuery.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setSearchQuery("")}
                              className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white"
                              aria-label={t("Clear search")}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="hidden flex-1 lg:block" />
                      <div className="ml-auto flex items-center gap-1 lg:hidden">
                        {roomView === "chat" ? (
                          <button
                            type="button"
                            onClick={openSearch}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                            aria-label={t("Search the chat")}
                          >
                            <Search className="h-[18px] w-[18px]" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setMembersOpen(true);
                            setMobilePanel("participants");
                          }}
                          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                          aria-label={t("Show participants")}
                          aria-expanded={mobilePanel === "participants"}
                        >
                          <Users className="h-[18px] w-[18px]" />
                          <span className="absolute right-0 top-0 flex min-w-4 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full bg-zinc-200 px-1 text-[9px] font-bold leading-4 text-zinc-900">
                            {visibleOnlineActors.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setAboutPanelOpen(true);
                            setMobilePanel("about");
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                          aria-label={t("Show room information")}
                          aria-expanded={mobilePanel === "about"}
                        >
                          <Info className="h-[18px] w-[18px]" />
                        </button>
                      </div>
                    </>
                  )}
                </header>

                {connectionProblem || error instanceof Error ? (
                  <div className="modbots-print-hidden flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] bg-modbots-menu px-4 py-2 text-xs text-zinc-300 lg:px-7">
                    <span>
                      {historyUnavailable
                        ? "We couldn't load the conversation right now. Try again in a moment."
                        : error instanceof Error
                          ? error.message
                          : "The conversation is reconnecting. New messages may be delayed."}
                    </span>
                    <button
                      type="button"
                      onClick={() => void refresh()}
                      className="rounded-lg px-3 py-1.5 font-medium text-white hover:bg-white/[0.07]"
                    >
                      Retry
                    </button>
                  </div>
                ) : null}

                <div className="modbots-print-chat-body relative flex min-h-0 flex-1">
                  {roomView === "games" && gameLobbyAvailable ? (
                    <GameLobby
                      roomId={roomId}
                      actorId={localActor?.id}
                      actors={actors}
                    />
                  ) : null}
                  <section
                    className={`modbots-print-chat-section min-w-0 flex-1 flex-col ${
                      roomView === "games" && gameLobbyAvailable
                        ? "hidden"
                        : "flex"
                    }`}
                  >
                    <div
                      ref={conversationViewport}
                      onScroll={handleConversationScroll}
                      className="modbots-print-conversation modbots-scroll min-h-0 flex-1 overflow-y-auto"
                    >
                      <div className="modbots-print-timeline flex min-h-full flex-col justify-end py-3">
                        {events.isLoading ? (
                          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
                            Loading conversation...
                          </div>
                        ) : timeline.length === 0 ? (
                          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-modbots-field text-zinc-400">
                              {searchQuery.length > 0 ? (
                                <Search className="h-5 w-5" />
                              ) : (
                                <MessageSquare className="h-5 w-5" />
                              )}
                            </div>
                            <h2 className="mt-4 text-base font-semibold text-zinc-200">
                              {searchQuery.length > 0
                                ? "No matching messages"
                                : historyUnavailable
                                  ? "We couldn't load the conversation"
                                  : "Start the conversation"}
                            </h2>
                            <p className="mt-1 text-sm text-zinc-500">
                              {searchQuery.length > 0
                                ? "Try another word or phrase."
                                : historyUnavailable
                                  ? "Try again in a moment."
                                  : "Messages from people and bots appear here together."}
                            </p>
                          </div>
                        ) : (
                          <ConversationTimeline
                            actors={actors}
                            items={timeline}
                            roomId={roomId}
                            localActorId={localActor?.id}
                            mentionLabels={mentionLabels}
                            messagesByContentItem={messagesByContentItem}
                            chatLanguage={chatLanguage}
                            translatedEventText={translatedEventText}
                            contextEditSequence={contextEditSequence}
                            onDeleteAttachment={deleteAttachment}
                            onDeleteMessage={deleteMessage}
                            onEditRequestHandled={clearContextEditRequest}
                            onEditMessage={editMessage}
                            onReply={selectReplyTarget}
                            onPlaybackChange={handleMediaPlaybackChange}
                            ruleTitles={ruleTitles}
                          />
                        )}
                      </div>
                    </div>

                    <div className="modbots-print-hidden shrink-0 px-3 pb-3 pt-2 sm:px-7 sm:pb-5">
                      {translationError !== null ? (
                        <div className="mb-2 flex items-center gap-2 rounded-window border border-white/10 bg-modbots-menu px-3 py-2 text-xs text-zinc-300">
                          <CircleAlert className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          <span className="flex-1">{translationError}</span>
                          <button
                            type="button"
                            onClick={() => setTranslationError(null)}
                            className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white"
                            aria-label={t("Dismiss translation error")}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : null}
                      {attachmentError !== null ? (
                        <div className="mb-2 flex items-center gap-2 rounded-window border border-white/10 bg-modbots-menu px-3 py-2 text-xs text-zinc-300">
                          <CircleAlert className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          <span className="flex-1">{attachmentError}</span>
                          <button
                            type="button"
                            onClick={() => setAttachmentError(null)}
                            className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white"
                            aria-label={t("Dismiss attachment error")}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : null}
                      {mutedNotice !== null ? (
                        <div className="mb-2 flex items-center gap-2 rounded-window border border-white/10 bg-modbots-menu px-3 py-2 text-xs text-zinc-300">
                          <MicOff className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          <span className="flex-1">{mutedNotice}</span>
                          <button
                            type="button"
                            onClick={() => setMutedNotice(null)}
                            className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white"
                            aria-label={t("Dismiss muted notice")}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : null}
                      <form
                        onSubmit={(event) => void submitMessage(event)}
                        className="relative rounded-window border border-white/10 bg-modbots-field shadow-[0_16px_50px_rgba(0,0,0,0.35)] focus-within:border-white/20"
                      >
                        {mention !== null && mentionOptions.length > 0 ? (
                          <div className="absolute bottom-full left-0 mb-2 w-72 overflow-hidden rounded-window border border-white/10 bg-modbots-popover p-1 shadow-2xl">
                            <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-600">
                              Address someone
                            </p>
                            {mentionOptions.map((option, index) => {
                              const active =
                                index ===
                                Math.min(
                                  mention.index,
                                  mentionOptions.length - 1,
                                );

                              return (
                                <button
                                  key={
                                    option.kind === "room"
                                      ? "room"
                                      : option.actor.id
                                  }
                                  type="button"
                                  onMouseDown={(pointerEvent) => {
                                    pointerEvent.preventDefault();
                                    applyMention(option);
                                  }}
                                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left ${
                                    active
                                      ? "bg-white/[0.08] text-white"
                                      : "text-zinc-300 hover:bg-white/[0.05]"
                                  }`}
                                >
                                  {option.kind === "room" ? (
                                    <>
                                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300">
                                        <Users className="h-4 w-4" />
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="block text-[13px] font-medium">
                                          {t("Room")}
                                        </span>
                                        <span className="block truncate text-[11px] text-zinc-500">
                                          {t("Everyone here")}
                                        </span>
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <ActorProfilePicture
                                        actor={option.actor}
                                        actorId={option.actor.id}
                                        name={option.actor.display}
                                        size="sm"
                                      />
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[13px] font-medium">
                                          {option.actor.displayName}
                                        </span>
                                        <span className="block truncate text-[11px] text-zinc-500">
                                          {actorRole(option.actor.id, actors)}
                                        </span>
                                      </span>
                                    </>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                        {replyTarget !== null ? (
                          <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-2 text-xs">
                            <CornerUpLeft className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                            <span className="shrink-0 text-zinc-400">
                              {replyTarget.actorId === localActor?.id ? (
                                <span className="font-medium text-zinc-200">
                                  Quoting your message
                                </span>
                              ) : (
                                <>
                                  Replying to{" "}
                                  <span className="font-medium text-zinc-200">
                                    {actorLabel(replyTarget.actorId, actors)}
                                  </span>
                                </>
                              )}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-zinc-600">
                              {displayedEventText(
                                replyTarget,
                                chatLanguage,
                                translatedEventText,
                              ) || eventContent(replyTarget)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setReplyTarget(null)}
                              className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white"
                              aria-label={t(
                                replyTarget.actorId === localActor?.id
                                  ? "Cancel quote"
                                  : "Cancel reply",
                              )}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : null}
                        {deliveryError !== null ? (
                          <div className="mx-3 mt-2 flex w-[calc(100%-1.5rem)] max-w-2xl items-start gap-2 rounded-lg border border-red-400/20 bg-red-500/[0.08] px-3 py-2 text-xs text-zinc-300">
                            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium text-zinc-100">
                                {t("Message not sent")}
                              </span>
                              <span className="mt-0.5 block text-zinc-400">
                                {deliveryError}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setDeliveryError(null)}
                              className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white"
                              aria-label={t("Dismiss delivery error")}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : null}
                        {attachment !== null ? (
                          <div className="mx-3 mt-2 flex w-fit max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2 pr-1 text-xs text-zinc-300">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/20 text-zinc-400">
                              {attachment.type.startsWith("audio/") ? (
                                <FileAudio className="h-4 w-4" />
                              ) : (
                                <Paperclip className="h-4 w-4" />
                              )}
                            </span>
                            <span className="min-w-0 max-w-72">
                              <span
                                className="block truncate font-medium text-zinc-200"
                                title={attachment.name}
                              >
                                {recordedVoiceDuration === null
                                  ? attachment.name
                                  : t("Voice message")}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-zinc-500">
                                {recordedVoiceDuration === null
                                  ? null
                                  : `${recordingDurationLabel(recordedVoiceDuration)} · `}
                                {(attachment.size / 1_048_576).toFixed(1)} MB
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAttachment(null);
                                setRecordedVoiceDuration(null);
                                setDeliveryError(null);
                              }}
                              className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white"
                              aria-label={t("Remove attachment")}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : null}
                        <input
                          ref={attachmentInput}
                          type="file"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.currentTarget.files?.[0] ?? null;

                            if (
                              file !== null &&
                              file.size > 100 * 1024 * 1024
                            ) {
                              setAttachment(null);
                              setRecordedVoiceDuration(null);
                              setAttachmentError(
                                "Attachments cannot exceed 100 MB.",
                              );
                            } else {
                              setAttachment(file);
                              setRecordedVoiceDuration(null);
                              setAttachmentError(null);
                              setDeliveryError(null);
                            }

                            event.currentTarget.value = "";
                          }}
                        />
                        <textarea
                          ref={composerRef}
                          data-message-composer
                          value={draft}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            applyDraft(value);
                            updateMentionState(
                              value,
                              event.currentTarget.selectionStart ??
                                value.length,
                            );
                          }}
                          onSelect={(event) =>
                            updateMentionState(
                              event.currentTarget.value,
                              event.currentTarget.selectionStart ?? 0,
                            )
                          }
                          onBlur={() => setMention(null)}
                          onKeyDown={handleComposerKeyDown}
                          rows={1}
                          maxLength={4_000}
                          disabled={localActor === undefined || !apiConnected}
                          placeholder={
                            localActor === undefined
                              ? "Preparing your session..."
                              : t("Message the room")
                          }
                          className="max-h-40 min-h-[58px] w-full resize-none bg-transparent px-4 pb-2 pt-4 text-[14px] leading-6 text-zinc-100 outline-none placeholder:text-zinc-500 disabled:cursor-default"
                        />
                        <div className="relative flex items-center justify-between px-2 pb-2">
                          <div className="flex items-center gap-0.5">
                            <ComposerAttachmentMenu
                              disabled={
                                !apiConnected ||
                                localActor === undefined ||
                                voiceRecordingStatus !== "idle"
                              }
                              open={composerMenu === "attachment"}
                              onOpenChange={(open) =>
                                setComposerMenu(open ? "attachment" : null)
                              }
                              onChoose={openAttachmentPicker}
                            />
                            <span className="mx-1 h-5 w-px bg-white/10" />
                            <ComposerEmojiPicker
                              disabled={
                                !apiConnected || localActor === undefined
                              }
                              open={composerMenu === "emoji"}
                              onOpenChange={(open) =>
                                setComposerMenu(open ? "emoji" : null)
                              }
                              onSelect={insertEmoji}
                            />
                          </div>

                          {voiceRecordingStatus === "recording" ||
                          draft.length > 0 ? (
                            <span className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 text-center text-[11px] text-zinc-600 sm:block">
                              {voiceRecordingStatus === "recording"
                                ? `${t("Recording")} ${recordingDurationLabel(
                                    voiceRecordingSeconds,
                                  )}`
                                : `${draft.length}/4000`}
                            </span>
                          ) : null}

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={
                                !apiConnected ||
                                localActor === undefined ||
                                voiceRecordingStatus === "requesting" ||
                                (attachment !== null &&
                                  voiceRecordingStatus !== "recording")
                              }
                              aria-pressed={
                                voiceRecordingStatus === "recording"
                              }
                              aria-label={
                                voiceRecordingStatus === "recording"
                                  ? t("Stop voice recording")
                                  : t("Record voice message")
                              }
                              title={
                                voiceRecordingStatus === "recording"
                                  ? t("Stop voice recording")
                                  : t("Record voice message")
                              }
                              onClick={() => {
                                if (voiceRecordingStatus === "recording") {
                                  stopVoiceRecording();
                                } else {
                                  void startVoiceRecording();
                                }
                              }}
                              className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-default disabled:text-zinc-700 ${
                                voiceRecordingStatus === "recording"
                                  ? "modbots-recording-control bg-red-500/20 text-red-400"
                                  : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
                              }`}
                            >
                              {voiceRecordingStatus === "requesting" ? (
                                <LoaderCircle className="h-[18px] w-[18px] animate-spin" />
                              ) : voiceRecordingStatus === "recording" ? (
                                <Square className="h-3.5 w-3.5 fill-current" />
                              ) : (
                                <Mic className="h-[18px] w-[18px]" />
                              )}
                            </button>
                            <button
                              type="submit"
                              disabled={!canSend}
                              className="flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-modbots-field disabled:cursor-default disabled:bg-zinc-800 disabled:text-zinc-500"
                            >
                              <span>
                                {translatingSubmission
                                  ? t("Translating...")
                                  : t("Send")}
                              </span>
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </section>
                </div>
              </div>

              {aboutPanelOpen ? (
                <PanelResizeHandle
                  label="Resize the about panel"
                  width={aboutWidth}
                  limits={aboutPanel}
                  onWidthChange={setAboutWidth}
                  grow={-1}
                />
              ) : null}
              {aboutPanelOpen ? (
                <aside
                  className={`fixed bottom-7 right-0 top-11 z-40 w-[min(88vw,360px)] shrink-0 flex-col border-l border-white/[0.08] bg-modbots-panel shadow-[-20px_0_60px_rgba(0,0,0,0.5)] lg:static lg:z-auto lg:flex lg:w-[var(--about-width)] lg:shadow-none ${
                    mobilePanel === "about" ? "flex" : "hidden"
                  }`}
                  style={
                    {
                      "--about-width": `${aboutWidth}px`,
                    } as CSSProperties
                  }
                >
                  <div className="flex h-[68px] shrink-0 items-center border-b border-white/[0.08] px-5">
                    <h2 className="text-[15px] font-semibold text-white lg:hidden">
                      {t("Room information")}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setMobilePanel(null)}
                      className="ml-auto rounded-lg p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-white lg:hidden"
                      aria-label={t("Close room information")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="modbots-scroll min-h-0 flex-1 overflow-y-auto p-5">
                    <p className="text-[13px] font-semibold text-zinc-100">
                      {selectedRoom?.name ?? t("Room information")}
                    </p>
                    <p className="mt-1 text-[13px] leading-5 text-zinc-400">
                      {selectedRoom?.description ?? ""}
                    </p>

                    <div className="mt-4 space-y-2.5 text-[13px] text-zinc-400">
                      <p className="flex items-start gap-2.5">
                        <Bot className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                        {uiLanguage === "zh-CN" ? (
                          <span>
                            这里有
                            <span className="text-zinc-200">
                              {chatBotCount} 个聊天机器人
                            </span>
                            ，由
                            <span className="text-zinc-200">
                              {modBotCount} 个管理机器人
                            </span>
                            观察
                          </span>
                        ) : (
                          <span>
                            Home to{" "}
                            <span className="text-zinc-200">
                              {chatBotCount} chat{" "}
                              {chatBotCount === 1 ? "bot" : "bots"}
                            </span>
                            , watched by{" "}
                            <span className="text-zinc-200">
                              {modBotCount} mod{" "}
                              {modBotCount === 1 ? "bot" : "bots"}
                            </span>
                          </span>
                        )}
                      </p>
                      <p className="flex items-start gap-2.5">
                        <DoorOpen className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                        <span>
                          {t("Open to guests, anonymous or registered")}
                        </span>
                      </p>
                      <p className="flex items-start gap-2.5">
                        <Image className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                        <span>
                          {t("Text, images, audio, video, and files")}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 rounded-window border border-white/[0.06] bg-white/[0.02] p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
                          {t("Activity")}
                        </p>
                        <div
                          className="flex rounded-md border border-white/[0.08] bg-modbots-inset p-0.5"
                          role="tablist"
                          aria-label={t("Activity period")}
                        >
                          {activityScopes.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              role="tab"
                              aria-selected={activityScope === option.id}
                              onClick={() => setActivityScope(option.id)}
                              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                activityScope === option.id
                                  ? "bg-white/[0.1] text-white"
                                  : "text-zinc-500 hover:text-zinc-200"
                              }`}
                            >
                              {t(option.label)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {activityScope === "7d" ? (
                        <div className="mt-2.5 grid grid-cols-7 gap-1.5">
                          {activity.buckets.map((bucket, index) => (
                            <div
                              key={bucket.key}
                              title={`${bucket.label} · ${bucket.count} ${
                                bucket.count === 1 ? "message" : "messages"
                              }`}
                            >
                              <div
                                className={`h-7 rounded-md ${
                                  index === activity.buckets.length - 1
                                    ? "ring-1 ring-inset ring-white/40"
                                    : ""
                                }`}
                                style={{
                                  backgroundColor: bucketShade(
                                    bucket.count,
                                    activity.max,
                                  ),
                                }}
                              />
                              <p
                                className={`mt-1 text-center text-[9px] font-medium ${
                                  index === activity.buckets.length - 1
                                    ? "text-zinc-300"
                                    : "text-zinc-600"
                                }`}
                              >
                                {bucket.initial}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="mt-2.5 grid grid-cols-[repeat(auto-fill,minmax(12px,1fr))] gap-1">
                            {activity.buckets.map((bucket, index) => (
                              <div
                                key={bucket.key}
                                title={`${bucket.label} · ${bucket.count} ${
                                  bucket.count === 1 ? "message" : "messages"
                                }`}
                                className={`h-3 rounded-[3px] ${
                                  index === activity.buckets.length - 1
                                    ? "ring-1 ring-inset ring-white/40"
                                    : ""
                                }`}
                                style={{
                                  backgroundColor: bucketShade(
                                    bucket.count,
                                    activity.max,
                                  ),
                                }}
                              />
                            ))}
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[9px] font-medium text-zinc-600">
                            <span>{activity.rangeStartLabel}</span>
                            <span>{t("Today")}</span>
                          </div>
                        </>
                      )}

                      <div className="mt-2.5">
                        <ActivitySection
                          label={t("Messages")}
                          value={activity.messages.toLocaleString()}
                          open={openActivity.messages === true}
                          onToggle={() => toggleActivitySection("messages")}
                        >
                          {activity.messageRows.length === 0 ? (
                            <p className="text-[11px] text-zinc-600">
                              {t("None in this period.")}
                            </p>
                          ) : (
                            activity.messageRows.map((row) => (
                              <ActivityCountRow
                                key={row.label}
                                label={`From ${row.label.toLocaleLowerCase()}`}
                                count={row.count}
                              />
                            ))
                          )}
                        </ActivitySection>
                        <ActivitySection
                          label={t("Moderation")}
                          value={activity.moderationTotal.toLocaleString()}
                          open={openActivity.moderation === true}
                          onToggle={() => toggleActivitySection("moderation")}
                        >
                          {activity.moderationRows.length === 0 ? (
                            <p className="text-[11px] text-zinc-600">
                              {t("None in this period.")}
                            </p>
                          ) : (
                            activity.moderationRows.map((row) => (
                              <ActivityCountRow
                                key={row.label}
                                label={row.label}
                                count={row.count}
                              />
                            ))
                          )}
                        </ActivitySection>
                        <ActivitySection
                          label={t("Participants")}
                          value={activity.talkedTotal.toLocaleString()}
                          open={openActivity.talked === true}
                          onToggle={() => toggleActivitySection("talked")}
                        >
                          {activity.topPosters.length === 0 ? (
                            <p className="text-[11px] text-zinc-600">
                              {t("None in this period.")}
                            </p>
                          ) : (
                            <>
                              <p className="text-[11px] text-zinc-600">
                                {activity.talkedRows
                                  .map(
                                    (row) =>
                                      `${row.count} ${row.label.toLocaleLowerCase()}`,
                                  )
                                  .join(" · ")}
                              </p>
                              {activity.topPosters.map((poster) => {
                                const posterActor = actors.get(poster.actorId);
                                const posterName = actorLabel(
                                  poster.actorId,
                                  actors,
                                );

                                return (
                                  <div
                                    key={poster.actorId}
                                    className="flex items-center gap-2"
                                  >
                                    <span
                                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 text-[8px] font-semibold text-zinc-200"
                                      style={{
                                        backgroundColor: shadeFor(
                                          poster.actorId,
                                        ),
                                      }}
                                    >
                                      {monogram(posterName)}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300">
                                      {posterName}
                                    </span>
                                    {posterActor !== undefined &&
                                    posterActor.type !== "human" ? (
                                      <span className="shrink-0 text-zinc-600">
                                        {roleBadgeIcon(posterActor.type)}
                                      </span>
                                    ) : null}
                                    <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">
                                      {poster.count.toLocaleString()}
                                    </span>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </ActivitySection>
                      </div>
                    </div>

                    {rules.data !== undefined ? (
                      <div className="mt-4 rounded-window border border-white/[0.06] bg-white/[0.02] p-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-600">
                          {t("Rules")}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-zinc-300">
                          {rules.data.ethos}
                        </p>
                        <ol className="mt-2">
                          {rules.data.rules.map((rule, index) => (
                            <li key={rule.id}>
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenRuleId(
                                    openRuleId === rule.id ? null : rule.id,
                                  )
                                }
                                className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left text-sm text-zinc-300 hover:bg-white/[0.04]"
                              >
                                <span className="w-4 shrink-0 text-xs tabular-nums text-zinc-600">
                                  {index + 1}
                                </span>
                                <span className="flex-1">{rule.title}</span>
                                <ChevronDown
                                  className={`h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform ${
                                    openRuleId === rule.id ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                              {openRuleId === rule.id ? (
                                <p className="pb-2 pl-7 pr-1.5 text-xs leading-5 text-zinc-500">
                                  {rule.text}
                                </p>
                              ) : null}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                  </div>
                </aside>
              ) : null}
            </>
          )}
        </div>

        {entered ? (
          <StatusBar
            connectionLabel={connectionLabel}
            sending={
              sendMessage.isPending ||
              sendContent.isPending ||
              translatingSubmission
            }
            muted={isMuted}
            searchMatches={
              searchQuery.trim().length > 0 ? roomEvents.length : null
            }
          />
        ) : null}

        {settingsOpen ? (
          <SettingsDialog
            section={settingsSection}
            onSectionChange={setSettingsSection}
            account={accountSettings}
            accountAvatar={
              localActor === undefined ? null : (
                <ActorProfilePicture
                  actor={localActor}
                  actorId={localActor.id}
                  name={localActor.display}
                  size="lg"
                />
              )
            }
            sendWithEnter={sendWithEnter}
            onSendWithEnterChange={setSendWithEnter}
            notificationPreferences={notificationPreferences}
            onNotificationPreferenceChange={setNotificationCategoryEnabled}
            translationEnabled={translationEnabled}
            onTranslationEnabledChange={changeTranslationEnabled}
            translationLanguage={translationLanguage}
            onTranslationLanguageChange={changeTranslationLanguage}
            translationError={translationError}
            onOpenAccountPage={openAccountPage}
            onManageProfilePicture={chooseProfilePicture}
            onRemoveProfilePicture={() => {
              uploadProfilePicture.reset();
              removeProfilePicture.mutate();
            }}
            profilePictureSaving={
              uploadProfilePicture.isPending || removeProfilePicture.isPending
            }
            profilePictureError={
              uploadProfilePicture.error instanceof Error
                ? uploadProfilePicture.error.message
                : removeProfilePicture.error instanceof Error
                  ? removeProfilePicture.error.message
                  : null
            }
            onSaveProfile={(profile) => {
              updateProfile.mutate(profile);
            }}
            profileSaving={updateProfile.isPending}
            profileError={
              updateProfile.error instanceof Error
                ? updateProfile.error.message
                : null
            }
            onClose={() => setSettingsOpen(false)}
          />
        ) : null}

        {reportProblemOpen ? (
          <ReportProblemDialog onClose={() => setReportProblemOpen(false)} />
        ) : null}

        {requestFeatureOpen ? (
          <RequestFeatureDialog onClose={() => setRequestFeatureOpen(false)} />
        ) : null}

        {aboutOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <button
              type="button"
              aria-label="Close About Mod Bots"
              className="absolute inset-0 cursor-default bg-modbots-overlay"
              onClick={() => setAboutOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="about-mod-bots-title"
              className="relative w-[360px] rounded-window border border-white/10 bg-modbots-dialog p-6 shadow-[0_24px_70px_rgba(0,0,0,0.6)]"
            >
              <div className="flex items-center gap-3">
                <NextImage
                  src={appLogo}
                  alt=""
                  className="h-11 w-11 rounded-xl"
                />
                <div>
                  <p
                    id="about-mod-bots-title"
                    className="text-sm font-semibold text-white"
                  >
                    Mod Bots Web
                  </p>
                  <p className="text-xs text-zinc-500">Version {appVersion}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                A multimodal chatroom where humans and chat bots talk, and mod
                bots learn to moderate from everything that happens.
              </p>
              <button
                type="button"
                onClick={() => setAboutOpen(false)}
                className="mt-5 w-full rounded-xl bg-white py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
