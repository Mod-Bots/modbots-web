"use client";

import { Maximize2 } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface WindowContextValue {
  canMaximize: boolean;
  canRestore: boolean;
  maximize: () => void;
  minimize: () => void;
  restore: () => void;
}

const WindowContext = createContext<WindowContextValue | null>(null);

const setWindowState = (state: "normal" | "minimized") => {
  document.documentElement.dataset.windowState = state;
};

export function WindowProvider({ children }: { children: ReactNode }) {
  const [minimized, setMinimized] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const fullscreenSupported =
    typeof document !== "undefined" &&
    typeof document.documentElement.requestFullscreen === "function";

  const restore = useCallback(() => {
    setMinimized(false);
    setWindowState("normal");

    if (document.fullscreenElement !== null) {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, []);

  const minimize = useCallback(() => {
    if (document.fullscreenElement !== null) {
      void document.exitFullscreen().catch(() => undefined);
    }

    setMinimized(true);
    setWindowState("minimized");
  }, []);

  const maximize = useCallback(() => {
    if (!fullscreenSupported || document.fullscreenElement !== null) {
      return;
    }

    setMinimized(false);
    setWindowState("normal");
    void document.documentElement.requestFullscreen().catch(() => undefined);
  }, [fullscreenSupported]);

  useEffect(() => {
    const syncFullscreen = () => {
      setFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener("fullscreenchange", syncFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  return (
    <WindowContext.Provider
      value={{
        canMaximize: fullscreenSupported && !fullscreen,
        canRestore: fullscreen,
        maximize,
        minimize,
        restore,
      }}
    >
      <div className="modbots-window-content">{children}</div>
      {minimized ? (
        <div className="pointer-events-none fixed inset-0 z-[100] flex items-end p-4">
          <button
            type="button"
            onClick={restore}
            className="pointer-events-auto flex min-w-64 items-center gap-3 rounded-window border border-white/10 bg-modbots-menu px-4 py-3 text-left text-zinc-200 shadow-[0_18px_55px_rgba(0,0,0,0.35)] hover:bg-modbots-popover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Restore Mod Bots"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-modbots-panel text-xs font-semibold text-zinc-300">
              MB
            </span>
            <span className="flex-1 text-sm font-semibold">Mod Bots</span>
            <Maximize2 className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
      ) : null}
    </WindowContext.Provider>
  );
}

export function useAppWindow() {
  const context = useContext(WindowContext);

  if (context === null) {
    throw new Error("useAppWindow must be used within WindowProvider");
  }

  return context;
}
