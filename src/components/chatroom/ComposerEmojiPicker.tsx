"use client";

import { Clock3, Search, SmilePlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUiLanguage } from "@/i18n/UiLanguageProvider";
import {
  type EmojiCategoryId,
  type EmojiEntry,
  emojiCategories,
} from "./emoji-data";

const recentEmojiStorageKey = "modbots.web.recent-emojis.v1";
const recentEmojiLimit = 18;

const readRecentEmojis = (): string[] => {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(recentEmojiStorageKey) ?? "[]",
    );
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
};

export function ComposerEmojiPicker({
  disabled,
  open,
  onOpenChange,
  onSelect,
}: {
  disabled: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (emoji: string) => void;
}) {
  const { t } = useUiLanguage();
  const [activeCategory, setActiveCategory] =
    useState<EmojiCategoryId>("smileys");
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => setRecent(readRecentEmojis()), []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  const allEmojis = useMemo(
    () => emojiCategories.flatMap((category) => category.emojis),
    [],
  );
  const emojiByCharacter = useMemo(
    () => new Map(allEmojis.map((entry) => [entry.emoji, entry])),
    [allEmojis],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const visibleEmojis = useMemo<EmojiEntry[]>(() => {
    if (normalizedQuery.length > 0) {
      return allEmojis.filter((entry) =>
        `${entry.name} ${entry.keywords}`
          .toLowerCase()
          .includes(normalizedQuery),
      );
    }

    return (
      emojiCategories.find((category) => category.id === activeCategory)
        ?.emojis ?? []
    );
  }, [activeCategory, allEmojis, normalizedQuery]);

  const chooseEmoji = (emoji: string) => {
    onSelect(emoji);
    setRecent((current) => {
      const next = [emoji, ...current.filter((item) => item !== emoji)].slice(
        0,
        recentEmojiLimit,
      );
      window.localStorage.setItem(recentEmojiStorageKey, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("Add emoji")}
        title={t("Add emoji")}
        onClick={() => onOpenChange(!open)}
        className={`rounded-lg p-2.5 transition-colors disabled:cursor-default ${
          open
            ? "bg-white/[0.09] text-zinc-100"
            : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
        }`}
      >
        <SmilePlus className="h-[18px] w-[18px]" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={t("Close emoji picker")}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => onOpenChange(false)}
          />
          <div
            role="dialog"
            aria-label={t("Emoji picker")}
            className="absolute bottom-full left-0 z-50 mb-2 flex h-[420px] w-[min(370px,calc(100vw-32px))] flex-col overflow-hidden rounded-window border border-white/10 bg-modbots-popover shadow-[0_18px_60px_rgba(0,0,0,0.58)]"
          >
            <div className="flex items-center gap-2 border-b border-white/[0.08] p-2.5">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 focus-within:border-white/20">
                <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  aria-label={t("Search emoji")}
                  placeholder={t("Search emoji")}
                  className="h-9 min-w-0 flex-1 bg-transparent text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600"
                />
                {query.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label={t("Clear emoji search")}
                    className="rounded p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </label>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label={t("Close emoji picker")}
                className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modbots-scroll flex gap-0.5 overflow-x-auto border-b border-white/[0.08] px-2 py-1.5">
              {recent.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  title={t("Recently used")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/[0.07] hover:text-zinc-200"
                >
                  <Clock3 className="h-4 w-4" />
                </button>
              ) : null}
              {emojiCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.id);
                    setQuery("");
                  }}
                  aria-pressed={
                    normalizedQuery.length === 0 &&
                    activeCategory === category.id
                  }
                  title={t(category.label)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[17px] transition hover:scale-110 hover:bg-white/[0.07] aria-pressed:bg-white/[0.09]"
                >
                  {category.icon}
                </button>
              ))}
            </div>

            {normalizedQuery.length === 0 && recent.length > 0 ? (
              <div className="border-b border-white/[0.08] px-3 py-2">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
                  {t("Recently used")}
                </p>
                <div className="grid grid-cols-9 gap-0.5">
                  {recent.map((emoji) => {
                    const entry = emojiByCharacter.get(emoji);
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => chooseEmoji(emoji)}
                        aria-label={entry === undefined ? emoji : t(entry.name)}
                        title={entry === undefined ? emoji : t(entry.name)}
                        className="flex h-8 items-center justify-center rounded-lg text-[20px] transition hover:scale-125 hover:bg-white/[0.07] focus-visible:bg-white/[0.07] focus-visible:outline-none"
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="modbots-scroll min-h-0 flex-1 overflow-y-auto p-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
                {normalizedQuery.length > 0
                  ? t("Search results")
                  : t(
                      emojiCategories.find(
                        (category) => category.id === activeCategory,
                      )?.label ?? "Emoji",
                    )}
              </p>
              {visibleEmojis.length > 0 ? (
                <div className="grid grid-cols-9 gap-0.5">
                  {visibleEmojis.map((entry) => (
                    <button
                      key={`${entry.emoji}-${entry.name}`}
                      type="button"
                      onClick={() => chooseEmoji(entry.emoji)}
                      aria-label={t(entry.name)}
                      title={t(entry.name)}
                      className="flex h-9 items-center justify-center rounded-lg text-[22px] transition hover:scale-125 hover:bg-white/[0.07] focus-visible:bg-white/[0.07] focus-visible:outline-none motion-safe:hover:animate-bounce"
                    >
                      {entry.emoji}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="flex h-full items-center justify-center text-center text-[13px] text-zinc-500">
                  {t("No emoji found")}
                </p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
