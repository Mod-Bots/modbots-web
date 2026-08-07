import assert from "node:assert/strict";
import test from "node:test";
import { formatMediaDuration, waveformBars } from "./media-player-data.ts";

test("formats media time without exposing invalid values", () => {
  assert.equal(formatMediaDuration(0), "0:00");
  assert.equal(formatMediaDuration(68.9), "1:08");
  assert.equal(formatMediaDuration(Number.POSITIVE_INFINITY), "0:00");
});

test("builds a stable varied waveform for each media asset", () => {
  const first = waveformBars("asset-one", 12);
  const repeated = waveformBars("asset-one", 12);
  const different = waveformBars("asset-two", 12);

  assert.deepEqual(first, repeated);
  assert.notDeepEqual(first, different);
  assert.equal(first.length, 12);
  assert.ok(first.every(({ height }) => height >= 24 && height <= 103));
});
