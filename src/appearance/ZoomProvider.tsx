"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const storageKey = "modbots.interface-zoom";
const minimumZoom = 0.5;
const maximumZoom = 2;
const zoomStep = 0.1;

const normalizeZoom = (zoom: number) =>
  Math.min(maximumZoom, Math.max(minimumZoom, Math.round(zoom * 10) / 10));

const storedZoom = () => {
  if (typeof window === "undefined") {
    return 1;
  }

  const parsed = Number(window.localStorage.getItem(storageKey));
  return Number.isFinite(parsed) &&
    parsed >= minimumZoom &&
    parsed <= maximumZoom
    ? normalizeZoom(parsed)
    : 1;
};

const applyZoom = (zoom: number) => {
  document.documentElement.style.setProperty(
    "--modbots-interface-zoom",
    String(zoom),
  );
};

interface ZoomContextValue {
  canZoomIn: boolean;
  canZoomOut: boolean;
  resetZoom: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

const ZoomContext = createContext<ZoomContextValue | null>(null);

export function ZoomProvider({ children }: { children: ReactNode }) {
  const [zoom, setZoom] = useState(storedZoom);

  const saveZoom = useCallback((nextZoom: number) => {
    const normalized = normalizeZoom(nextZoom);
    setZoom(normalized);
    window.localStorage.setItem(storageKey, String(normalized));
    applyZoom(normalized);
  }, []);

  const zoomIn = useCallback(() => saveZoom(zoom + zoomStep), [saveZoom, zoom]);
  const zoomOut = useCallback(
    () => saveZoom(zoom - zoomStep),
    [saveZoom, zoom],
  );
  const resetZoom = useCallback(() => saveZoom(1), [saveZoom]);

  useEffect(() => {
    applyZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    const handleZoomShortcut = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      if (
        event.key === "+" ||
        event.key === "=" ||
        event.code === "NumpadAdd"
      ) {
        event.preventDefault();
        zoomIn();
      } else if (event.key === "-" || event.code === "NumpadSubtract") {
        event.preventDefault();
        zoomOut();
      } else if (event.key === "0" || event.code === "Numpad0") {
        event.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleZoomShortcut);
    return () => window.removeEventListener("keydown", handleZoomShortcut);
  }, [resetZoom, zoomIn, zoomOut]);

  return (
    <ZoomContext.Provider
      value={{
        canZoomIn: zoom < maximumZoom,
        canZoomOut: zoom > minimumZoom,
        resetZoom,
        zoomIn,
        zoomOut,
      }}
    >
      {children}
    </ZoomContext.Provider>
  );
}

export function useZoom() {
  const context = useContext(ZoomContext);

  if (context === null) {
    throw new Error("useZoom must be used within ZoomProvider");
  }

  return context;
}
