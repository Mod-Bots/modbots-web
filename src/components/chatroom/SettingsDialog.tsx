import {
  ArrowUpRight,
  Camera,
  GripHorizontal,
  Languages,
  MessageSquare,
  Shield,
  UserRound,
  X,
} from "lucide-react";
import type {
  CSSProperties,
  FormEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useRef, useState } from "react";
import type { ChatLanguage } from "@/data/contracts";
import { type UiLanguage, useUiLanguage } from "@/i18n/UiLanguageProvider";

export type SettingsSection = "account" | "chat" | "language";

export interface AccountSettingsSummary {
  display: string;
  alias: string;
  accountLabel: string;
  registered: boolean;
  identityLabel: string;
  memberSinceLabel: string;
  profilePictureSummary: string;
  hasProfilePicture: boolean;
  healthSummary: string;
  latestModerationLabel: string | null;
  bio: string | null;
  pronouns: string | null;
  location: string | null;
  links: string[];
}

interface WindowPosition {
  x: number;
  y: number;
}

interface WindowDrag {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  width: number;
  height: number;
}

interface WindowSize {
  width: number;
  height: number;
}

type WindowResizeEdge = "n" | "e" | "s" | "w";

interface WindowResize {
  pointerId: number;
  edge: WindowResizeEdge;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  width: number;
  height: number;
}

const settingsWindowMargin = 12;
const settingsResizeHandles: ReadonlyArray<{
  edge: WindowResizeEdge;
  className: string;
}> = [
  {
    edge: "n",
    className: "left-3 right-3 top-0 h-2 cursor-n-resize",
  },
  {
    edge: "e",
    className: "bottom-3 right-0 top-3 w-2 cursor-e-resize",
  },
  {
    edge: "s",
    className: "bottom-0 left-3 right-3 h-2 cursor-s-resize",
  },
  {
    edge: "w",
    className: "bottom-3 left-0 top-3 w-2 cursor-w-resize",
  },
];

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

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

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm text-zinc-200 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]">
      <span className="font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="peer sr-only"
      />
      <span className="relative h-5 w-9 shrink-0 rounded-full border border-white/10 bg-zinc-800 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-3.5 after:w-3.5 after:rounded-full after:bg-zinc-400 after:transition-transform peer-checked:bg-zinc-100 peer-checked:after:translate-x-4 peer-checked:after:bg-zinc-900 peer-focus-visible:ring-2 peer-focus-visible:ring-white/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#101010]" />
    </label>
  );
}

function SectionButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
        active
          ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
      }`}
    >
      {active ? (
        <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-r-full bg-zinc-100" />
      ) : null}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-black/20">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
    </button>
  );
}

function DetailCard({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-black/20 text-zinc-300">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {title}
          </p>
          <div className="mt-2 text-[13px] leading-6 text-zinc-200">
            {children}
          </div>
        </div>
      </div>
      {action !== undefined ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}

export function SettingsDialog({
  section,
  onSectionChange,
  account,
  accountAvatar,
  sendWithEnter,
  onSendWithEnterChange,
  translationEnabled,
  onTranslationEnabledChange,
  translationLanguage,
  onTranslationLanguageChange,
  translationError,
  onOpenAccountPage,
  onManageProfilePicture,
  onRemoveProfilePicture,
  profilePictureSaving,
  profilePictureError,
  onSaveProfile,
  profileSaving,
  profileError,
  onClose,
}: {
  section: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  account: AccountSettingsSummary | null;
  accountAvatar: ReactNode;
  sendWithEnter: boolean;
  onSendWithEnterChange: (checked: boolean) => void;
  translationEnabled: boolean;
  onTranslationEnabledChange: (enabled: boolean) => void;
  translationLanguage: ChatLanguage;
  onTranslationLanguageChange: (language: ChatLanguage) => void;
  translationError: string | null;
  onOpenAccountPage: () => void;
  onManageProfilePicture: () => void;
  onRemoveProfilePicture: () => void;
  profilePictureSaving: boolean;
  profilePictureError: string | null;
  onSaveProfile: (profile: {
    bio: string | null;
    pronouns: string | null;
    location: string | null;
    links: string[];
  }) => void;
  profileSaving: boolean;
  profileError: string | null;
  onClose: () => void;
}) {
  const {
    language: uiLanguage,
    setLanguage: setUiLanguage,
    t,
  } = useUiLanguage();
  const [bio, setBio] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [location, setLocation] = useState("");
  const [links, setLinks] = useState("");
  const [windowPosition, setWindowPosition] = useState<WindowPosition | null>(
    null,
  );
  const [windowSize, setWindowSize] = useState<WindowSize | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const windowDrag = useRef<WindowDrag | null>(null);
  const windowResize = useRef<WindowResize | null>(null);

  useEffect(() => {
    setBio(account?.bio ?? "");
    setPronouns(account?.pronouns ?? "");
    setLocation(account?.location ?? "");
    setLinks(account?.links?.join(" ") ?? "");
  }, [account?.bio, account?.location, account?.pronouns, account?.links]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog === null || window.innerWidth < 640) {
      return;
    }

    const bounds = dialog.getBoundingClientRect();
    setWindowPosition({ x: bounds.left, y: bounds.top });
    setWindowSize({ width: bounds.width, height: bounds.height });
  }, []);

  useEffect(() => {
    const keepWindowVisible = () => {
      if (window.innerWidth < 640) {
        setWindowPosition(null);
        setWindowSize(null);
        return;
      }

      const dialog = dialogRef.current;

      if (dialog === null) {
        return;
      }

      const bounds = dialog.getBoundingClientRect();
      const nextPosition = {
        x: clamp(
          bounds.left,
          settingsWindowMargin,
          Math.max(
            settingsWindowMargin,
            window.innerWidth - bounds.width - settingsWindowMargin,
          ),
        ),
        y: clamp(
          bounds.top,
          settingsWindowMargin,
          Math.max(
            settingsWindowMargin,
            window.innerHeight - bounds.height - settingsWindowMargin,
          ),
        ),
      };

      setWindowPosition((current) => (current === null ? null : nextPosition));
      setWindowSize((current) =>
        current === null
          ? null
          : {
              width: Math.min(
                current.width,
                window.innerWidth - nextPosition.x - settingsWindowMargin,
              ),
              height: Math.min(
                current.height,
                window.innerHeight - nextPosition.y - settingsWindowMargin,
              ),
            },
      );
    };

    window.addEventListener("resize", keepWindowVisible);
    return () => window.removeEventListener("resize", keepWindowVisible);
  }, []);

  const startWindowMove = (event: ReactPointerEvent<HTMLElement>) => {
    const dialog = dialogRef.current;
    const target = event.target as Element;

    if (
      dialog === null ||
      window.innerWidth < 640 ||
      target.closest("[data-window-move-ignore]") !== null
    ) {
      return;
    }

    const bounds = dialog.getBoundingClientRect();
    windowDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: bounds.left,
      originY: bounds.top,
      width: bounds.width,
      height: bounds.height,
    };
    setWindowPosition({ x: bounds.left, y: bounds.top });
    setWindowSize({ width: bounds.width, height: bounds.height });
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const moveWindow = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = windowDrag.current;

    if (drag === null || drag.pointerId !== event.pointerId) {
      return;
    }

    setWindowPosition({
      x: clamp(
        drag.originX + event.clientX - drag.startX,
        settingsWindowMargin,
        Math.max(
          settingsWindowMargin,
          window.innerWidth - drag.width - settingsWindowMargin,
        ),
      ),
      y: clamp(
        drag.originY + event.clientY - drag.startY,
        settingsWindowMargin,
        Math.max(
          settingsWindowMargin,
          window.innerHeight - drag.height - settingsWindowMargin,
        ),
      ),
    });
  };

  const stopWindowMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (windowDrag.current?.pointerId !== event.pointerId) {
      return;
    }

    windowDrag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const startWindowResize =
    (edge: WindowResizeEdge) => (event: ReactPointerEvent<HTMLElement>) => {
      const dialog = dialogRef.current;

      if (dialog === null || window.innerWidth < 640) {
        return;
      }

      const bounds = dialog.getBoundingClientRect();
      windowResize.current = {
        pointerId: event.pointerId,
        edge,
        startX: event.clientX,
        startY: event.clientY,
        originX: bounds.left,
        originY: bounds.top,
        width: bounds.width,
        height: bounds.height,
      };
      setWindowPosition({ x: bounds.left, y: bounds.top });
      setWindowSize({ width: bounds.width, height: bounds.height });
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

  const resizeWindow = (event: ReactPointerEvent<HTMLElement>) => {
    const resize = windowResize.current;

    if (resize === null || resize.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - resize.startX;
    const deltaY = event.clientY - resize.startY;
    const right = resize.originX + resize.width;
    const bottom = resize.originY + resize.height;
    const minimumWidth = Math.min(
      600,
      window.innerWidth - settingsWindowMargin * 2,
    );
    const minimumHeight = Math.min(
      440,
      window.innerHeight - settingsWindowMargin * 2,
    );
    let x = resize.originX;
    let y = resize.originY;
    let width = resize.width;
    let height = resize.height;

    if (resize.edge.includes("e")) {
      width = clamp(
        resize.width + deltaX,
        minimumWidth,
        window.innerWidth - resize.originX - settingsWindowMargin,
      );
    }

    if (resize.edge.includes("w")) {
      x = clamp(
        resize.originX + deltaX,
        settingsWindowMargin,
        right - minimumWidth,
      );
      width = right - x;
    }

    if (resize.edge.includes("s")) {
      height = clamp(
        resize.height + deltaY,
        minimumHeight,
        window.innerHeight - resize.originY - settingsWindowMargin,
      );
    }

    if (resize.edge.includes("n")) {
      y = clamp(
        resize.originY + deltaY,
        settingsWindowMargin,
        bottom - minimumHeight,
      );
      height = bottom - y;
    }

    setWindowPosition({ x, y });
    setWindowSize({ width, height });
  };

  const stopWindowResize = (event: ReactPointerEvent<HTMLElement>) => {
    if (windowResize.current?.pointerId !== event.pointerId) {
      return;
    }

    windowResize.current = null;
    const bounds = dialogRef.current?.getBoundingClientRect();
    if (bounds !== undefined) {
      setWindowPosition({ x: bounds.left, y: bounds.top });
      setWindowSize({ width: bounds.width, height: bounds.height });
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSaveProfile({
      bio: bio.trim() || null,
      pronouns: pronouns.trim() || null,
      location: location.trim() || null,
      links: links
        .split(/\s+/)
        .map((link) => link.trim())
        .filter((link) => link.length > 0),
    });
  };

  const positionedWindowStyle: CSSProperties | undefined =
    windowPosition === null
      ? undefined
      : {
          left: `${windowPosition.x}px`,
          top: `${windowPosition.y}px`,
          maxWidth: `calc(100vw - ${windowPosition.x + settingsWindowMargin}px)`,
          maxHeight: `calc(100dvh - ${windowPosition.y + settingsWindowMargin}px)`,
          width: windowSize === null ? undefined : `${windowSize.width}px`,
          height: windowSize === null ? undefined : `${windowSize.height}px`,
        };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-3">
      <button
        type="button"
        aria-label={t("Close settings")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-[2px]"
      />
      <div
        ref={dialogRef}
        style={positionedWindowStyle}
        className={`modbots-settings-dialog relative z-10 flex h-dvh w-full flex-col overflow-hidden border border-white/10 bg-[#101010] shadow-[0_28px_90px_rgba(0,0,0,0.7)] sm:absolute sm:h-[min(720px,calc(100dvh-24px))] sm:min-h-[440px] sm:w-[min(880px,calc(100vw-24px))] sm:min-w-[600px] sm:max-h-[calc(100dvh-24px)] sm:max-w-[calc(100vw-24px)] sm:rounded-window ${
          windowPosition === null
            ? "sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
            : "sm:translate-x-0 sm:translate-y-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modbots-settings-title"
      >
        <div
          onPointerDown={startWindowMove}
          onPointerMove={moveWindow}
          onPointerUp={stopWindowMove}
          onPointerCancel={stopWindowMove}
          className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.08] bg-[#0c0c0c] px-4 sm:cursor-move sm:touch-none"
        >
          <button
            type="button"
            className="hidden h-8 w-8 shrink-0 touch-none cursor-move items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-white/[0.05] hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:flex"
            aria-label={t("Move settings window")}
            title={t("Move settings window")}
          >
            <GripHorizontal className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2
              id="modbots-settings-title"
              className="truncate text-sm font-semibold text-white"
            >
              {t("Settings")}
            </h2>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {t("Manage your Mod Bots settings.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-window-move-ignore
            className="flex h-8 w-8 shrink-0 cursor-default items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label={t("Close settings")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[200px_minmax(0,1fr)] md:grid-rows-1">
          <aside className="border-b border-white/[0.08] bg-[#0d0d0d] p-3 md:border-b-0 md:border-r">
            <nav className="grid grid-cols-3 gap-1.5 md:block md:space-y-1">
              <SectionButton
                label={t("Account")}
                icon={<UserRound className="h-4 w-4" />}
                active={section === "account"}
                onClick={() => onSectionChange("account")}
              />
              <SectionButton
                label={t("Language")}
                icon={<Languages className="h-4 w-4" />}
                active={section === "language"}
                onClick={() => onSectionChange("language")}
              />
              <SectionButton
                label={t("Chat")}
                icon={<MessageSquare className="h-4 w-4" />}
                active={section === "chat"}
                onClick={() => onSectionChange("chat")}
              />
            </nav>
          </aside>

          <div className="modbots-scroll min-h-0 overflow-y-auto bg-[#121212] p-4 sm:p-5">
            {section === "account" ? (
              account === null ? null : (
                <div>
                  <section className="rounded-lg border border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.015))] p-4">
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        {accountAvatar}
                        <button
                          type="button"
                          onClick={onManageProfilePicture}
                          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] bg-[#181818] text-zinc-300 shadow-[0_10px_22px_rgba(0,0,0,0.35)] transition-colors hover:border-white/20 hover:bg-[#202020] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                          aria-label={t("Change profile picture")}
                          title={t("Change profile picture")}
                        >
                          <Camera className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="min-w-0 flex-1 pt-1">
                        <p className="truncate text-[15px] font-semibold text-zinc-50">
                          {account.display}
                        </p>
                        <p className="mt-1 truncate text-[14px] text-zinc-400">
                          {account.alias}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {account.registered ? (
                            <RegisteredMark className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          ) : null}
                          <span className="inline-flex h-4 items-center text-[13px] font-medium leading-none text-zinc-400">
                            {account.accountLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                          {account.identityLabel}
                        </p>
                      </div>
                    </div>
                  </section>

                  <form
                    onSubmit={submitProfile}
                    className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.025] p-4"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      {t("Profile")}
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="sm:col-span-2">
                        <span className="text-[11px] font-medium text-zinc-300">
                          {t("About")}
                        </span>
                        <textarea
                          value={bio}
                          onChange={(event) => setBio(event.target.value)}
                          maxLength={160}
                          rows={3}
                          className="mt-1.5 w-full resize-y rounded-md border border-white/[0.08] bg-black/20 px-3 py-2 text-[13px] text-zinc-100 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                        />
                      </label>
                      <label>
                        <span className="text-[11px] font-medium text-zinc-300">
                          {t("Pronouns")}
                        </span>
                        <input
                          value={pronouns}
                          onChange={(event) => setPronouns(event.target.value)}
                          maxLength={40}
                          className="mt-1.5 w-full rounded-md border border-white/[0.08] bg-black/20 px-3 py-2 text-[13px] text-zinc-100 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                        />
                      </label>
                      <label>
                        <span className="text-[11px] font-medium text-zinc-300">
                          {t("Location")}
                        </span>
                        <input
                          value={location}
                          onChange={(event) => setLocation(event.target.value)}
                          maxLength={80}
                          className="mt-1.5 w-full rounded-md border border-white/[0.08] bg-black/20 px-3 py-2 text-[13px] text-zinc-100 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                        />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="text-[11px] font-medium text-zinc-300">
                          {t("Links")}
                        </span>
                        <input
                          value={links}
                          onChange={(event) => setLinks(event.target.value)}
                          className="mt-1.5 w-full rounded-md border border-white/[0.08] bg-black/20 px-3 py-2 text-[13px] text-zinc-100 outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10"
                        />
                      </label>
                    </div>
                    {profileError !== null ? (
                      <p className="mt-3 text-[11px] text-red-300">
                        {profileError}
                      </p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="mt-4 rounded-md bg-white px-4 py-2 text-[12px] font-semibold text-black transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] disabled:cursor-wait disabled:opacity-50"
                    >
                      {profileSaving ? t("Saving...") : t("Save profile")}
                    </button>
                  </form>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <DetailCard
                      title={t("Profile picture")}
                      icon={<Camera className="h-4 w-4" />}
                      action={
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={onManageProfilePicture}
                            disabled={profilePictureSaving}
                            className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-zinc-200 transition-colors hover:border-white/15 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-wait disabled:opacity-50"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            {profilePictureSaving
                              ? t("Saving picture...")
                              : t("Change picture")}
                          </button>
                          {account.hasProfilePicture ? (
                            <button
                              type="button"
                              onClick={onRemoveProfilePicture}
                              disabled={profilePictureSaving}
                              className="rounded-md px-3 py-1.5 text-[11px] font-semibold text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-wait disabled:opacity-50"
                            >
                              {t("Remove picture")}
                            </button>
                          ) : null}
                        </div>
                      }
                    >
                      <p>{account.profilePictureSummary}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {t("Profile pictures are served through UPPS.")}
                      </p>
                      {profilePictureError !== null ? (
                        <p className="mt-2 text-[11px] text-red-300">
                          {profilePictureError}
                        </p>
                      ) : null}
                    </DetailCard>

                    <DetailCard
                      title={t("Account health")}
                      icon={<Shield className="h-4 w-4" />}
                    >
                      <p>{account.healthSummary}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {account.latestModerationLabel ??
                          t(
                            "No recent mod bot action is attached to this account.",
                          )}
                      </p>
                    </DetailCard>
                  </div>

                  <div className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.025] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      {t("Member since")}
                    </p>
                    <p className="mt-2 text-[13px] text-zinc-200">
                      {account.memberSinceLabel}
                    </p>
                    <button
                      type="button"
                      onClick={onOpenAccountPage}
                      className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-zinc-200 transition-colors hover:border-white/15 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      {t("Open full account page")}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            ) : section === "chat" ? (
              <div>
                <section className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    {t("Chat settings")}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {t("Choose how you send messages.")}
                  </p>
                </section>

                <div className="mt-4 space-y-3">
                  <ToggleRow
                    label={t("Send with Enter")}
                    checked={sendWithEnter}
                    onChange={onSendWithEnterChange}
                  />
                </div>
              </div>
            ) : (
              <div>
                <section className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    {t("Language settings")}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {t("Choose the language used by the interface.")}
                  </p>
                </section>

                <div className="mt-4 space-y-3">
                  <label className="block rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3">
                    <span className="block text-sm text-zinc-200">
                      {t("Interface language")}
                    </span>
                    <select
                      value={uiLanguage}
                      onChange={(event) =>
                        setUiLanguage(event.currentTarget.value as UiLanguage)
                      }
                      className="mt-3 w-full rounded-md border border-white/[0.1] bg-[#171717] px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10"
                    >
                      <option value="en">English</option>
                      <option value="zh-CN">简体中文</option>
                    </select>
                    <span className="mt-2 block text-[11px] leading-5 text-zinc-500">
                      {uiLanguage === "zh-CN"
                        ? t(
                            "Show menus, buttons, and settings in Simplified Chinese.",
                          )
                        : t("Show menus, buttons, and settings in English.")}
                    </span>
                  </label>
                </div>

                <section className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.025] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    {t("Messages")}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {t("Choose how messages are translated.")}
                  </p>
                </section>
                <div className="mt-4 space-y-3">
                  <ToggleRow
                    label={t("Translate messages")}
                    checked={translationEnabled}
                    onChange={onTranslationEnabledChange}
                  />
                  <label className="block rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3">
                    <span className="block text-sm text-zinc-200">
                      {t("Translate messages into")}
                    </span>
                    <select
                      value={translationLanguage}
                      disabled={!translationEnabled}
                      onChange={(event) =>
                        onTranslationLanguageChange(
                          event.currentTarget.value as ChatLanguage,
                        )
                      }
                      className="mt-3 w-full rounded-md border border-white/[0.1] bg-[#171717] px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="zh-CN">简体中文</option>
                    </select>
                    {translationError !== null ? (
                      <span className="mt-2 block text-[11px] text-red-300">
                        {translationError}
                      </span>
                    ) : null}
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
        {settingsResizeHandles.map((handle) => (
          <div
            key={handle.edge}
            aria-hidden="true"
            onPointerDown={startWindowResize(handle.edge)}
            onPointerMove={resizeWindow}
            onPointerUp={stopWindowResize}
            onPointerCancel={stopWindowResize}
            className={`absolute z-20 hidden touch-none sm:block ${handle.className}`}
          />
        ))}
      </div>
    </div>
  );
}
