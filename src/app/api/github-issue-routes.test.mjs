import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { afterEach, test } from "node:test";
import { POST as reportProblem } from "./report-problem/route.ts";
import { POST as requestFeature } from "./request-feature/route.ts";

const environmentKeys = [
  "MODBOTS_GITHUB_APP_ID",
  "MODBOTS_GITHUB_APP_INSTALLATION_ID",
  "MODBOTS_GITHUB_APP_PRIVATE_KEY_BASE64",
  "MODBOTS_GITHUB_ISSUES_TOKEN",
];
const originalEnvironment = new Map(
  environmentKeys.map((key) => [key, process.env[key]]),
);
const originalFetch = globalThis.fetch;
const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { format: "pem", type: "pkcs8" },
  publicKeyEncoding: { format: "pem", type: "spki" },
});
const encodedPrivateKey = Buffer.from(privateKey).toString("base64");

afterEach(() => {
  for (const [key, value] of originalEnvironment) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  globalThis.fetch = originalFetch;
});

const configureGitHubApp = (appId, installationId) => {
  process.env.MODBOTS_GITHUB_APP_ID = appId;
  process.env.MODBOTS_GITHUB_APP_INSTALLATION_ID = installationId;
  process.env.MODBOTS_GITHUB_APP_PRIVATE_KEY_BASE64 = encodedPrivateKey;
  delete process.env.MODBOTS_GITHUB_ISSUES_TOKEN;
};

const formRequest = (path, title, description) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, description }),
  });

const mockGitHub = ({ appId, installationId, issueNumber, title, body }) => {
  let requestNumber = 0;
  globalThis.fetch = async (url, init) => {
    requestNumber += 1;

    if (requestNumber === 1) {
      assert.equal(
        url,
        `https://api.github.com/app/installations/${installationId}/access_tokens`,
      );
      assert.match(init.headers.Authorization, /^Bearer [^.]+\.[^.]+\.[^.]+$/);
      const jwtPayload = JSON.parse(
        Buffer.from(
          init.headers.Authorization.split(".")[1],
          "base64url",
        ).toString("utf8"),
      );
      assert.equal(jwtPayload.iss, appId);
      assert.deepEqual(JSON.parse(init.body), {
        repositories: ["modbots-web"],
        permissions: { issues: "write" },
      });
      return Response.json(
        {
          token: `installation-token-${appId}`,
          expires_at: new Date(Date.now() + 3_600_000).toISOString(),
        },
        { status: 201 },
      );
    }

    assert.equal(
      url,
      "https://api.github.com/repos/Mod-Bots/modbots-web/issues",
    );
    assert.equal(
      init.headers.Authorization,
      `Bearer installation-token-${appId}`,
    );
    assert.deepEqual(JSON.parse(init.body), { title, body });
    return Response.json(
      {
        number: issueNumber,
        html_url: `https://github.com/Mod-Bots/modbots-web/issues/${issueNumber}`,
      },
      { status: 201 },
    );
  };
};

test("both forms reject a personal token without a GitHub App", async () => {
  for (const key of environmentKeys) {
    delete process.env[key];
  }
  process.env.MODBOTS_GITHUB_ISSUES_TOKEN = "personal-token";
  globalThis.fetch = async () => {
    throw new Error("A personal token must never be used");
  };

  const problemResponse = await reportProblem(
    formRequest("/api/report-problem", "Problem", "Description"),
  );
  const featureResponse = await requestFeature(
    formRequest("/api/request-feature", "Feature", "Description"),
  );

  assert.equal(problemResponse.status, 503);
  assert.equal(featureResponse.status, 503);
});

test("the problem form creates an issue as a GitHub App", async () => {
  configureGitHubApp("1001", "2001");
  mockGitHub({
    appId: "1001",
    installationId: "2001",
    issueNumber: 41,
    title: "Broken form",
    body: "The form should submit.\n\n---\nSubmission source: Public problem-report form.",
  });

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

test("the feature form creates an issue as a GitHub App", async () => {
  configureGitHubApp("1002", "2002");
  mockGitHub({
    appId: "1002",
    installationId: "2002",
    issueNumber: 42,
    title: "Memes",
    body: "Let bots create memes.\n\n---\nSubmission source: Public feature-request form.",
  });

  const response = await requestFeature(
    formRequest("/api/request-feature", "Memes", "Let bots create memes."),
  );

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    number: 42,
    url: "https://github.com/Mod-Bots/modbots-web/issues/42",
  });
});
