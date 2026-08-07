import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { POST as reportProblem } from "./report-problem/route.ts";
import { POST as requestFeature } from "./request-feature/route.ts";

const originalToken = process.env.MODBOTS_GITHUB_ISSUES_TOKEN;
const originalFetch = globalThis.fetch;

afterEach(() => {
  if (originalToken === undefined) {
    delete process.env.MODBOTS_GITHUB_ISSUES_TOKEN;
  } else {
    process.env.MODBOTS_GITHUB_ISSUES_TOKEN = originalToken;
  }
  globalThis.fetch = originalFetch;
});

const formRequest = (path, title, description) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, description }),
  });

test("both GitHub issue forms report missing configuration", async () => {
  delete process.env.MODBOTS_GITHUB_ISSUES_TOKEN;

  const problemResponse = await reportProblem(
    formRequest("/api/report-problem", "Problem", "Description"),
  );
  const featureResponse = await requestFeature(
    formRequest("/api/request-feature", "Feature", "Description"),
  );

  assert.equal(problemResponse.status, 503);
  assert.equal(featureResponse.status, 503);
});

test("the problem form creates a GitHub issue", async () => {
  process.env.MODBOTS_GITHUB_ISSUES_TOKEN = "test-token";
  globalThis.fetch = async (url, init) => {
    assert.equal(
      url,
      "https://api.github.com/repos/Mod-Bots/modbots-web/issues",
    );
    assert.equal(init.headers.Authorization, "Bearer test-token");
    assert.deepEqual(JSON.parse(init.body), {
      title: "Broken form",
      body: "The form should submit.",
    });
    return Response.json(
      {
        number: 41,
        html_url: "https://github.com/Mod-Bots/modbots-web/issues/41",
      },
      { status: 201 },
    );
  };

  const response = await reportProblem(
    formRequest(
      "/api/report-problem",
      "Broken form",
      "The form should submit.",
    ),
  );

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    number: 41,
    url: "https://github.com/Mod-Bots/modbots-web/issues/41",
  });
});

test("the feature form creates a GitHub issue", async () => {
  process.env.MODBOTS_GITHUB_ISSUES_TOKEN = "test-token";
  globalThis.fetch = async (_url, init) => {
    assert.deepEqual(JSON.parse(init.body), {
      title: "Memes",
      body: "Let bots create memes.",
    });
    return Response.json(
      {
        number: 42,
        html_url: "https://github.com/Mod-Bots/modbots-web/issues/42",
      },
      { status: 201 },
    );
  };

  const response = await requestFeature(
    formRequest("/api/request-feature", "Memes", "Let bots create memes."),
  );

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    number: 42,
    url: "https://github.com/Mod-Bots/modbots-web/issues/42",
  });
});
