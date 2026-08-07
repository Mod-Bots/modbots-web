"use client";

import type { LucideIcon } from "lucide-react";
import {
  Camera,
  ClipboardPaste,
  Copy,
  RefreshCw,
  Reply,
  Scissors,
  Search,
  Settings2,
  TextSelect,
} from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUiLanguage } from "@/i18n/UiLanguageProvider";

interface ContextTarget {
  editable: HTMLInputElement | HTMLTextAreaElement | null;
  hasSelection: boolean;
  messageSequence: string | null;
  target: HTMLElement;
  x: number;
  y: number;
}

interface ContextMenuAction {
  disabled?: boolean;
  icon: LucideIcon;
  id: string;
  label: string;
  onSelect: () => void;
  shortcut?: string;
}

type ContextMenuItem = ContextMenuAction | { id: string; separator: true };

const desktopQuery = "(min-width: 1024px)";
const menuEdgeGap = 8;

const editableTarget = (
  target: HTMLElement,
): HTMLInputElement | HTMLTextAreaElement | null => {
  if (
    (target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement) &&
    !target.disabled &&
    !target.readOnly
  ) {
    return target;
  }

  return null;
};

const targetHasSelection = (
  editable: HTMLInputElement | HTMLTextAreaElement | null,
): boolean => {
  if (editable !== null) {
    return editable.selectionStart !== editable.selectionEnd;
  }

  const selection = window.getSelection();
  return selection !== null && !selection.isCollapsed;
};

export function DesktopContextMenu({
  enabled,
  rootRef,
  onOpenSearch,
  onOpenSettings,
  onReplyToMessage,
  onTakeScreenshot,
}: {
  enabled: boolean;
  rootRef: RefObject<HTMLElement | null>;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onReplyToMessage: (sequence: string) => void;
  onTakeScreenshot: () => void;
}) {
  const { t } = useUiLanguage();
  const [context, setContext] = useState<ContextTarget | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setContext(null), []);

  const open = useCallback(
    (target: EventTarget | null, x: number, y: number): boolean => {
      if (
        !enabled ||
        !window.matchMedia(desktopQuery).matches ||
        !(target instanceof Node) ||
        !rootRef.current?.contains(target)
      ) {
        return false;
      }

      const element =
        target instanceof HTMLElement ? target : target.parentElement;

      if (element === null) {
        return false;
      }

      const editable = editableTarget(element);
      const message = element.closest<HTMLElement>(
        "[data-room-message-sequence]",
      );

      setContext({
        editable,
        hasSelection: targetHasSelection(editable),
        messageSequence: message?.dataset.roomMessageSequence ?? null,
        target: element,
        x,
        y,
      });
      return true;
    },
    [enabled, rootRef],
  );

  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      if (open(event.target, event.clientX, event.clientY)) {
        event.preventDefault();
      }
    };
    const onKeyboardContextMenu = (event: KeyboardEvent) => {
      const opensContextMenu =
        event.key === "ContextMenu" || (event.shiftKey && event.key === "F10");

      if (!opensContextMenu) {
        if (event.key === "Escape") {
          close();
        }
        return;
      }

      const target = document.activeElement;
      const bounds = target?.getBoundingClientRect();

      if (
        open(
          target,
          bounds === undefined ? menuEdgeGap : bounds.left + 12,
          bounds === undefined ? menuEdgeGap : bounds.top + 12,
        )
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyboardContextMenu);
    window.addEventListener("blur", close);
    window.addEventListener("resize", close);

    return () => {
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyboardContextMenu);
      window.removeEventListener("blur", close);
      window.removeEventListener("resize", close);
    };
  }, [close, open]);

  useLayoutEffect(() => {
    if (context === null || menuRef.current === null) {
      return;
    }

    const bounds = menuRef.current.getBoundingClientRect();
    const x = Math.max(
      menuEdgeGap,
      Math.min(context.x, window.innerWidth - bounds.width - menuEdgeGap),
    );
    const y = Math.max(
      menuEdgeGap,
      Math.min(context.y, window.innerHeight - bounds.height - menuEdgeGap),
    );

    if (x !== context.x || y !== context.y) {
      setContext((current) => (current === null ? null : { ...current, x, y }));
      return;
    }

    menuRef.current
      .querySelector<HTMLButtonElement>(
        'button[role="menuitem"]:not(:disabled)',
      )
      ?.focus();
  }, [context]);

  const runEditCommand = useCallback(
    (command: "copy" | "cut" | "paste" | "selectAll") => {
      if (context?.editable !== null && context?.editable !== undefined) {
        context.editable.focus();
      }

      document.execCommand(command);
    },
    [context],
  );

  const items = useMemo<ContextMenuItem[]>(() => {
    if (context === null) {
      return [];
    }

    const editItems: ContextMenuItem[] = [];

    const messageSequence = context.messageSequence;

    if (messageSequence !== null) {
      editItems.push({
        icon: Reply,
        id: "reply",
        label: t("Reply"),
        onSelect: () => onReplyToMessage(messageSequence),
      });
    }

    if (context.editable !== null) {
      editItems.push(
        {
          disabled: !context.hasSelection,
          icon: Scissors,
          id: "cut",
          label: t("Cut"),
          onSelect: () => runEditCommand("cut"),
          shortcut: "Ctrl+X",
        },
        {
          disabled: !context.hasSelection,
          icon: Copy,
          id: "copy",
          label: t("Copy"),
          onSelect: () => runEditCommand("copy"),
          shortcut: "Ctrl+C",
        },
        {
          icon: ClipboardPaste,
          id: "paste",
          label: t("Paste"),
          onSelect: () => runEditCommand("paste"),
          shortcut: "Ctrl+V",
        },
        {
          icon: TextSelect,
          id: "select-all",
          label: t("Select All"),
          onSelect: () => runEditCommand("selectAll"),
          shortcut: "Ctrl+A",
        },
      );
    } else if (context.hasSelection) {
      editItems.push({
        icon: Copy,
        id: "copy",
        label: t("Copy"),
        onSelect: () => runEditCommand("copy"),
        shortcut: "Ctrl+C",
      });
    }

    return [
      ...editItems,
      ...(editItems.length > 0
        ? [{ id: "edit-tools", separator: true } as const]
        : []),
      {
        icon: Search,
        id: "search",
        label: t("Search the chat"),
        onSelect: onOpenSearch,
        shortcut: "Ctrl+F",
      },
      {
        icon: Camera,
        id: "screenshot",
        label: t("Take a Screenshot"),
        onSelect: onTakeScreenshot,
      },
      {
        icon: Settings2,
        id: "settings",
        label: t("Settings"),
        onSelect: onOpenSettings,
        shortcut: "Ctrl+,",
      },
      { id: "app-refresh", separator: true },
      {
        icon: RefreshCw,
        id: "refresh",
        label: t("Refresh the Chatroom"),
        onSelect: () => window.location.reload(),
      },
    ];
  }, [
    context,
    onOpenSearch,
    onOpenSettings,
    onReplyToMessage,
    onTakeScreenshot,
    runEditCommand,
    t,
  ]);

  if (context === null) {
    return null;
  }

  const selectAction = (action: () => void) => {
    close();
    action();
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        'button[role="menuitem"]:not(:disabled)',
      ) ?? [],
    );
    const activeIndex = buttons.indexOf(
      document.activeElement as HTMLButtonElement,
    );

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      context.target.focus();
      return;
    }

    if (buttons.length === 0) {
      return;
    }

    let nextIndex: number | null = null;

    if (event.key === "ArrowDown") {
      nextIndex = (activeIndex + 1) % buttons.length;
    } else if (event.key === "ArrowUp") {
      nextIndex = (activeIndex - 1 + buttons.length) % buttons.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = buttons.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      buttons[nextIndex]?.focus();
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={t("Close menu")}
        className="fixed inset-0 z-[200] hidden cursor-default lg:block"
        onMouseDown={close}
      />
      <div
        ref={menuRef}
        role="menu"
        aria-label={t("Application context menu")}
        onContextMenu={(event) => event.preventDefault()}
        onKeyDown={handleMenuKeyDown}
        className="fixed z-[201] hidden min-w-[238px] rounded-window border border-white/10 bg-modbots-menu p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.58)] lg:block"
        style={{ left: context.x, top: context.y }}
      >
        {items.map((item) => {
          if ("separator" in item) {
            return (
              <hr
                key={item.id}
                className="my-1 border-0 border-t border-white/[0.08]"
              />
            );
          }

          const ItemIcon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectAction(item.onSelect)}
              className="group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-zinc-300 hover:bg-white/[0.07] hover:text-white focus-visible:bg-white/[0.07] focus-visible:text-white focus-visible:outline-none disabled:cursor-default disabled:text-zinc-600 disabled:hover:bg-transparent"
            >
              <ItemIcon className="h-3.5 w-3.5 shrink-0 text-zinc-500 group-hover:text-zinc-300 group-disabled:text-zinc-700" />
              <span className="flex-1 whitespace-nowrap">{item.label}</span>
              {item.shortcut !== undefined ? (
                <span className="ml-5 shrink-0 text-[11px] tabular-nums text-zinc-600">
                  {item.shortcut}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </>
  );
}
