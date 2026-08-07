"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useRef, useState } from "react";
import { useUiLanguage } from "@/i18n/UiLanguageProvider";
import { formatMediaDuration, waveformBars } from "./media-player-data";

interface ChatAudioPlayerProps {
  assetId: string;
  caption: string | null;
  captionTrackUrl: string;
  src: string;
}

export function ChatAudioPlayer({
  assetId,
  caption,
  captionTrackUrl,
  src,
}: ChatAudioPlayerProps) {
  const { t } = useUiLanguage();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const bars = useMemo(() => waveformBars(assetId), [assetId]);
  const progress = duration > 0 ? currentTime / duration : 0;
  const filename = caption?.trim() || t("Audio attachment");
  const title = /^voice-message-/i.test(filename)
    ? t("Voice message")
    : filename;

  const syncDuration = () => {
    const audio = audioRef.current;

    if (audio !== null && Number.isFinite(audio.duration)) {
      setDuration(audio.duration);
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;

    if (audio === null) {
      return;
    }

    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch {
      setPlaying(false);
    }
  };

  const seek = (value: string) => {
    const audio = audioRef.current;
    const nextTime = Number(value);

    if (audio === null || !Number.isFinite(nextTime)) {
      return;
    }

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const toggleMuted = () => {
    const audio = audioRef.current;

    if (audio === null) {
      return;
    }

    audio.muted = !audio.muted;
  };

  return (
    <figure className="w-full max-w-[400px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <audio
        ref={audioRef}
        preload="metadata"
        src={src}
        onLoadedMetadata={syncDuration}
        onDurationChange={syncDuration}
        onTimeUpdate={(event) =>
          setCurrentTime(event.currentTarget.currentTime)
        }
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
      >
        <track
          default
          kind="captions"
          src={captionTrackUrl}
          srcLang="und"
          label="Message caption"
        />
      </audio>

      <div className="flex items-center gap-3 px-3 pb-2.5 pt-3">
        <button
          type="button"
          onClick={() => void togglePlayback()}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
            playing
              ? "border-cyan-300/30 bg-cyan-400 text-black shadow-[0_0_22px_rgba(34,211,238,0.2)]"
              : "border-white/10 bg-white/[0.07] text-zinc-100 hover:bg-white/[0.12]"
          }`}
          aria-label={playing ? t("Pause audio") : t("Play audio")}
          title={playing ? t("Pause") : t("Play")}
        >
          {playing ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="relative flex h-9 items-center gap-[3px] rounded-md focus-within:ring-2 focus-within:ring-cyan-300/60">
            {bars.map((bar, index) => (
              <span
                key={bar.id}
                className={`modbots-audio-wave-bar block min-w-0 flex-1 rounded-full ${
                  (index + 0.5) / bars.length <= progress
                    ? "bg-cyan-400"
                    : "bg-zinc-600"
                } ${playing ? "modbots-audio-wave-bar-playing" : ""}`}
                style={
                  {
                    height: `${Math.min(bar.height, 100)}%`,
                    animationDelay: `${index * -43}ms`,
                  } as CSSProperties
                }
              />
            ))}
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.01}
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => seek(event.currentTarget.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label={t("Seek audio")}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] tabular-nums text-zinc-500">
            <span>{formatMediaDuration(currentTime)}</span>
            <span>
              {duration > 0 ? formatMediaDuration(duration) : "--:--"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleMuted}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.07] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label={muted ? t("Unmute audio") : t("Mute audio")}
          title={muted ? t("Unmute") : t("Mute")}
        >
          {muted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
      </div>

      <figcaption
        className="truncate border-t border-white/[0.07] px-3 py-2 text-[11px] text-zinc-500"
        title={filename}
      >
        {title}
      </figcaption>
    </figure>
  );
}
