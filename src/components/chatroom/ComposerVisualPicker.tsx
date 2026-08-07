"use client";

import {
  ImagePlay,
  LoaderCircle,
  Sticker,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  GeneratedVisualExpression,
  MemeTemplate,
  ReactionGifTemplate,
} from "@/data/platform";
import { useUiLanguage } from "@/i18n/UiLanguageProvider";

type VisualMode = "meme" | "gif";

const memeTemplates: { value: MemeTemplate; label: string }[] = [
  { value: "reaction", label: "Reaction" },
  { value: "contrast", label: "Expectation and reality" },
  { value: "announcement", label: "Announcement" },
];
const gifTemplates: { value: ReactionGifTemplate; label: string }[] = [
  { value: "celebrate", label: "Celebrate" },
  { value: "laugh", label: "Laugh" },
  { value: "side_eye", label: "Side-eye" },
  { value: "facepalm", label: "Facepalm" },
];

export function ComposerVisualPicker({
  disabled,
  open,
  onOpenChange,
  onCreateMeme,
  onCreateReactionGif,
  onGenerated,
}: {
  disabled: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateMeme: (request: {
    template: MemeTemplate;
    topText: string;
    bottomText: string;
  }) => Promise<GeneratedVisualExpression>;
  onCreateReactionGif: (request: {
    template: ReactionGifTemplate;
    text: string;
  }) => Promise<GeneratedVisualExpression>;
  onGenerated: (visual: GeneratedVisualExpression) => void;
}) {
  const { t } = useUiLanguage();
  const [mode, setMode] = useState<VisualMode>("meme");
  const [memeTemplate, setMemeTemplate] = useState<MemeTemplate>("reaction");
  const [gifTemplate, setGifTemplate] =
    useState<ReactionGifTemplate>("celebrate");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [reactionText, setReactionText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      return;
    }

    requestAnimationFrame(() => firstField.current?.focus());
  }, [open]);

  const canCreate =
    !pending &&
    (mode === "meme"
      ? topText.trim().length > 0 && bottomText.trim().length > 0
      : reactionText.trim().length > 0);

  const createVisual = async () => {
    if (!canCreate) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const visual =
        mode === "meme"
          ? await onCreateMeme({
              template: memeTemplate,
              topText: topText.trim(),
              bottomText: bottomText.trim(),
            })
          : await onCreateReactionGif({
              template: gifTemplate,
              text: reactionText.trim(),
            });
      onGenerated(visual);
      onOpenChange(false);
      setTopText("");
      setBottomText("");
      setReactionText("");
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "The visual could not be created.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("Create meme or GIF")}
        title={t("Create meme or GIF")}
        onClick={() => onOpenChange(!open)}
        className={`rounded-lg p-2.5 transition-colors disabled:cursor-default ${
          open
            ? "bg-white/[0.09] text-zinc-100"
            : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
        }`}
      >
        <WandSparkles className="h-[18px] w-[18px]" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={t("Close visual creator")}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => onOpenChange(false)}
          />
          <div
            role="dialog"
            aria-label={t("Create meme or GIF")}
            className="absolute bottom-full left-0 z-50 mb-2 w-[min(390px,calc(100vw-32px))] overflow-hidden rounded-window border border-white/10 bg-modbots-popover shadow-[0_18px_60px_rgba(0,0,0,0.58)]"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-zinc-100">
                  {t("Create something visual")}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {t("Add your own words, then send it like any image.")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label={t("Close visual creator")}
                className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1 border-b border-white/[0.08] p-2">
              <button
                type="button"
                onClick={() => setMode("meme")}
                aria-pressed={mode === "meme"}
                className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200 aria-pressed:bg-white/[0.09] aria-pressed:text-white"
              >
                <Sticker className="h-4 w-4" />
                {t("Meme")}
              </button>
              <button
                type="button"
                onClick={() => setMode("gif")}
                aria-pressed={mode === "gif"}
                className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200 aria-pressed:bg-white/[0.09] aria-pressed:text-white"
              >
                <ImagePlay className="h-4 w-4" />
                {t("Animated GIF")}
              </button>
            </div>

            <div className="space-y-3 p-4">
              {mode === "meme" ? (
                <>
                  <label className="block text-xs text-zinc-400">
                    <span className="mb-1.5 block">{t("Style")}</span>
                    <select
                      value={memeTemplate}
                      onChange={(event) =>
                        setMemeTemplate(
                          event.currentTarget.value as MemeTemplate,
                        )
                      }
                      className="h-10 w-full rounded-lg border border-white/10 bg-modbots-field px-3 text-sm text-zinc-200 outline-none focus:border-white/20"
                    >
                      {memeTemplates.map((template) => (
                        <option key={template.value} value={template.value}>
                          {t(template.label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs text-zinc-400">
                    <span className="mb-1.5 block">{t("Top text")}</span>
                    <input
                      ref={firstField}
                      value={topText}
                      maxLength={180}
                      onChange={(event) =>
                        setTopText(event.currentTarget.value)
                      }
                      className="h-10 w-full rounded-lg border border-white/10 bg-modbots-field px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-white/20"
                      placeholder={t("Set up the moment")}
                    />
                  </label>
                  <label className="block text-xs text-zinc-400">
                    <span className="mb-1.5 block">{t("Bottom text")}</span>
                    <input
                      value={bottomText}
                      maxLength={180}
                      onChange={(event) =>
                        setBottomText(event.currentTarget.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void createVisual();
                        }
                      }}
                      className="h-10 w-full rounded-lg border border-white/10 bg-modbots-field px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-white/20"
                      placeholder={t("Deliver the punchline")}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="block text-xs text-zinc-400">
                    <span className="mb-1.5 block">{t("Reaction")}</span>
                    <select
                      value={gifTemplate}
                      onChange={(event) =>
                        setGifTemplate(
                          event.currentTarget.value as ReactionGifTemplate,
                        )
                      }
                      className="h-10 w-full rounded-lg border border-white/10 bg-modbots-field px-3 text-sm text-zinc-200 outline-none focus:border-white/20"
                    >
                      {gifTemplates.map((template) => (
                        <option key={template.value} value={template.value}>
                          {t(template.label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs text-zinc-400">
                    <span className="mb-1.5 block">{t("Reaction text")}</span>
                    <input
                      ref={firstField}
                      value={reactionText}
                      maxLength={120}
                      onChange={(event) =>
                        setReactionText(event.currentTarget.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void createVisual();
                        }
                      }}
                      className="h-10 w-full rounded-lg border border-white/10 bg-modbots-field px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-white/20"
                      placeholder={t("What is the reaction about?")}
                    />
                  </label>
                </>
              )}

              {error !== null ? (
                <p className="rounded-lg border border-red-400/20 bg-red-500/[0.08] px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                disabled={!canCreate}
                onClick={() => void createVisual()}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-default disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {pending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <WandSparkles className="h-4 w-4" />
                )}
                {pending
                  ? t("Creating...")
                  : mode === "meme"
                    ? t("Create meme")
                    : t("Create GIF")}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
