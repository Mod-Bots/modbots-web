"use client";

import type { LucideIcon } from "lucide-react";
import { FileAudio, FileText, Image, Paperclip, Video } from "lucide-react";
import { useUiLanguage } from "@/i18n/UiLanguageProvider";

interface AttachmentCategory {
  accept: string;
  description: string;
  icon: LucideIcon;
  id: string;
  label: string;
}

const categories: AttachmentCategory[] = [
  {
    accept: "image/*",
    description: "Photos, GIFs, and other images",
    icon: Image,
    id: "image",
    label: "Image",
  },
  {
    accept: "video/*",
    description: "Video from your device",
    icon: Video,
    id: "video",
    label: "Video",
  },
  {
    accept: "audio/*",
    description: "An existing audio file",
    icon: FileAudio,
    id: "audio",
    label: "Audio file",
  },
  {
    accept:
      ".pdf,.doc,.docx,.odt,.rtf,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx,application/pdf,text/plain,text/csv",
    description: "PDF, text, Office, and similar files",
    icon: FileText,
    id: "document",
    label: "Document",
  },
];

export function ComposerAttachmentMenu({
  disabled,
  open,
  onChoose,
  onOpenChange,
}: {
  disabled: boolean;
  open: boolean;
  onChoose: (accept: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useUiLanguage();

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("Add files or media")}
        title={t("Add files or media")}
        onClick={() => onOpenChange(!open)}
        className={`rounded-lg p-2.5 transition-colors disabled:cursor-default ${
          open
            ? "bg-white/[0.09] text-zinc-100"
            : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
        }`}
      >
        <Paperclip className="h-[18px] w-[18px]" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={t("Close attachment menu")}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => onOpenChange(false)}
          />
          <div
            role="menu"
            aria-label={t("Choose attachment type")}
            className="absolute bottom-full left-0 z-50 mb-2 w-[272px] rounded-window border border-white/10 bg-modbots-popover p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
          >
            <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
              {t("Add to your message")}
            </p>
            {categories.map((category) => {
              const ItemIcon = category.icon;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onOpenChange(false);
                    onChoose(category.accept);
                  }}
                  className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-white/[0.07] focus-visible:bg-white/[0.07] focus-visible:outline-none"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-400 group-hover:text-zinc-200">
                    <ItemIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-zinc-200">
                      {t(category.label)}
                    </span>
                    <span className="block truncate text-[11px] text-zinc-500">
                      {t(category.description)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
