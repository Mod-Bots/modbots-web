"use client";

import { RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useUiLanguage } from "@/i18n/UiLanguageProvider";

type UpdatePhase = "checking" | "current" | "updating" | "error";

interface UpdateResponse {
  error?: unknown;
  latestVersion?: unknown;
  updateAvailable?: unknown;
  updateReady?: unknown;
}

interface CheckForUpdatesDialogProps {
  currentVersion: string;
  onClose: () => void;
}

const updatePollInterval = 5_000;
const updatePollLimit = 24;

export function CheckForUpdatesDialog({
  currentVersion,
  onClose,
}: CheckForUpdatesDialogProps) {
  const { t } = useUiLanguage();
  const [phase, setPhase] = useState<UpdatePhase>("checking");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkNumber, setCheckNumber] = useState(0);
  const canClose = phase !== "updating";

  useEffect(() => {
    if (!canClose) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [canClose, onClose]);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | null = null;
    let reloadTimer: number | null = null;
    let pollCount = 0;
    let updateFound = false;

    const schedulePoll = () => {
      pollCount += 1;

      if (pollCount > updatePollLimit) {
        setPhase("error");
        setError(t("The update is taking longer than expected. Try again."));
        return;
      }

      pollTimer = window.setTimeout(check, updatePollInterval);
    };

    const check = async () => {
      try {
        const response = await fetch(
          `/api/check-updates?currentVersion=${encodeURIComponent(currentVersion)}&check=${checkNumber}`,
          { cache: "no-store" },
        );
        const result = (await response.json()) as UpdateResponse;

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            typeof result.error === "string"
              ? t(result.error)
              : t("GitHub could not be checked for updates."),
          );
        }

        if (
          typeof result.updateAvailable !== "boolean" ||
          typeof result.updateReady !== "boolean" ||
          !(
            result.latestVersion === null ||
            typeof result.latestVersion === "string"
          ) ||
          (result.updateAvailable && typeof result.latestVersion !== "string")
        ) {
          throw new Error(t("GitHub could not be checked for updates."));
        }

        if (!result.updateAvailable) {
          setPhase("current");
          return;
        }

        updateFound = true;
        setLatestVersion(result.latestVersion);
        setPhase("updating");

        if (result.updateReady) {
          reloadTimer = window.setTimeout(() => window.location.reload(), 400);
          return;
        }

        schedulePoll();
      } catch (checkError) {
        if (cancelled) {
          return;
        }

        if (updateFound) {
          schedulePoll();
          return;
        }

        setPhase("error");
        setError(
          checkError instanceof Error
            ? checkError.message
            : t("GitHub could not be checked for updates."),
        );
      }
    };

    void check();

    return () => {
      cancelled = true;

      if (pollTimer !== null) {
        window.clearTimeout(pollTimer);
      }

      if (reloadTimer !== null) {
        window.clearTimeout(reloadTimer);
      }
    };
  }, [checkNumber, currentVersion, t]);

  const retry = () => {
    setPhase("checking");
    setLatestVersion(null);
    setError(null);
    setCheckNumber((current) => current + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={t("Close")}
        disabled={!canClose}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-modbots-overlay disabled:cursor-default"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="check-updates-title"
        className="relative w-full max-w-[440px] overflow-hidden rounded-window border border-white/10 bg-modbots-dialog shadow-[0_24px_70px_rgba(0,0,0,0.6)]"
      >
        <header className="flex items-center gap-4 border-b border-white/[0.08] px-5 py-4 sm:px-6">
          <h2
            id="check-updates-title"
            className="min-w-0 flex-1 text-base font-semibold text-white"
          >
            {t("Check for Updates")}
          </h2>
          {canClose ? (
            <button
              type="button"
              aria-label={t("Close")}
              title={t("Close")}
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </header>

        <div className="p-5 sm:p-6">
          {phase === "checking" ? (
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <RefreshCw className="h-4 w-4 animate-spin text-zinc-500" />
              <p>{t("Checking GitHub for web updates...")}</p>
            </div>
          ) : null}

          {phase === "current" ? (
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {t("Mod Bots is up to date.")}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                {t("Version")} {currentVersion}
              </p>
            </div>
          ) : null}

          {phase === "updating" ? (
            <div className="flex items-start gap-3">
              <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  {t("Downloading and installing the update...")}
                </p>
                {latestVersion !== null ? (
                  <p className="mt-2 text-sm text-zinc-500">
                    {t("Version")} {latestVersion}
                  </p>
                ) : null}
                <p className="mt-2 text-sm leading-5 text-zinc-500">
                  {t("Mod Bots will reopen when the update is ready.")}
                </p>
              </div>
            </div>
          ) : null}

          {phase === "error" ? (
            <p role="alert" className="text-sm leading-5 text-red-400">
              {error}
            </p>
          ) : null}

          {phase !== "checking" && phase !== "updating" ? (
            <div className="mt-6 flex justify-end gap-3 border-t border-white/[0.08] pt-5">
              {phase === "error" ? (
                <button
                  type="button"
                  onClick={retry}
                  className="h-10 rounded-window border border-white/10 px-4 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                >
                  {t("Try again")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-window bg-white px-4 text-sm font-semibold text-black hover:bg-zinc-200"
              >
                {t("Done")}
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
