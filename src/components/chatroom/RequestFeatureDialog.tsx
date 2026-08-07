"use client";

import { ExternalLink, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useUiLanguage } from "@/i18n/UiLanguageProvider";

interface CreatedIssue {
  number: number;
  url: string;
}

interface RequestFeatureDialogProps {
  onClose: () => void;
}

export function RequestFeatureDialog({ onClose }: RequestFeatureDialogProps) {
  const { t } = useUiLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdIssue, setCreatedIssue] = useState<CreatedIssue | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, submitting]);

  const submitFeature = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/request-feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const result = (await response.json()) as {
        error?: unknown;
        number?: unknown;
        url?: unknown;
      };

      if (
        !response.ok ||
        typeof result.number !== "number" ||
        typeof result.url !== "string"
      ) {
        throw new Error(
          typeof result.error === "string"
            ? t(result.error)
            : t("The feature request could not be created. Please try again."),
        );
      }

      setCreatedIssue({ number: result.number, url: result.url });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : t("The feature request could not be created. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={t("Close")}
        disabled={submitting}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-modbots-overlay disabled:cursor-default"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-feature-title"
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[560px] flex-col overflow-hidden rounded-window border border-white/10 bg-modbots-dialog shadow-[0_24px_70px_rgba(0,0,0,0.6)] sm:max-h-[calc(100dvh-3rem)]"
      >
        <header className="flex shrink-0 items-start gap-4 border-b border-white/[0.08] px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2
              id="request-feature-title"
              className="text-base font-semibold text-white"
            >
              {t("Request a Feature")}
            </h2>
            <p className="mt-1 text-sm leading-5 text-zinc-500">
              {t("Submitting this form creates a public GitHub issue.")}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("Close")}
            title={t("Close")}
            disabled={submitting}
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 disabled:cursor-default disabled:opacity-50 lg:h-8 lg:w-8"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {createdIssue === null ? (
          <form
            onSubmit={submitFeature}
            className="modbots-scroll min-h-0 space-y-5 overflow-y-auto p-5 sm:p-6"
          >
            <label className="block">
              <span className="text-sm font-medium text-zinc-200">
                {t("Feature title")}
              </span>
              <input
                type="text"
                required
                maxLength={256}
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
                className="mt-2 h-11 w-full rounded-window border border-white/10 bg-modbots-field px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/25 focus:ring-1 focus:ring-white/10"
                placeholder={t("Briefly describe the feature")}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-200">
                {t("Description")}
              </span>
              <textarea
                required
                maxLength={10000}
                rows={8}
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
                className="mt-2 min-h-40 w-full resize-y rounded-window border border-white/10 bg-modbots-field px-3 py-2.5 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-white/25 focus:ring-1 focus:ring-white/10"
                placeholder={t(
                  "Explain the feature and how it would improve Mod Bots.",
                )}
              />
            </label>

            {error !== null ? (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-3 border-t border-white/[0.08] pt-5">
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="h-11 rounded-window border border-white/10 px-4 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white disabled:cursor-default disabled:opacity-50 lg:h-10"
              >
                {t("Cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-11 rounded-window bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-200 disabled:cursor-default disabled:opacity-60 lg:h-10"
              >
                {submitting ? t("Submitting...") : t("Submit")}
              </button>
            </div>
          </form>
        ) : (
          <div className="modbots-scroll min-h-0 overflow-y-auto p-5 sm:p-6">
            <p className="text-sm leading-6 text-zinc-300">
              {t("The GitHub feature request was created successfully.")}
            </p>
            <a
              href={createdIssue.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-4 hover:text-white"
            >
              {t("View issue")} #{createdIssue.number}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <div className="mt-6 flex justify-end border-t border-white/[0.08] pt-5">
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-window bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-200 lg:h-10"
              >
                {t("Done")}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
