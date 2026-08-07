import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { supportsMediaStatus } from "./room-capabilities.ts";

describe("media status room capability", () => {
  it("allows Share & Show-off and Chill & Play capabilities", () => {
    assert.equal(
      supportsMediaStatus({
        capabilities: ["synchronized_media", "media_status"],
      }),
      true,
    );
    assert.equal(
      supportsMediaStatus({ capabilities: ["games", "media_status"] }),
      true,
    );
  });

  it("rejects every room without the media status capability", () => {
    assert.equal(supportsMediaStatus({ capabilities: [] }), false);
    assert.equal(supportsMediaStatus({ capabilities: ["games"] }), false);
    assert.equal(supportsMediaStatus(undefined), false);
  });
});
