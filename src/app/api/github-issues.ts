import { createSign } from "node:crypto";

const githubApiVersion = "2026-03-10";
const githubIssuesEndpoint =
  "https://api.github.com/repos/Mod-Bots/modbots-web/issues";

interface GitHubAppConfiguration {
  appId: string;
  installationId: string;
  privateKey: string;
}

interface GitHubIssue {
  number: number;
  url: string;
}

export type CreateGitHubIssueResult =
  | { status: "created"; issue: GitHubIssue }
  | { status: "not_configured" }
  | { status: "github_unavailable" };

let cachedInstallationToken:
  | {
      appId: string;
      installationId: string;
      token: string;
      expiresAt: number;
    }
  | undefined;

const githubHeaders = (token: string) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "User-Agent": "modbots-web",
  "X-GitHub-Api-Version": githubApiVersion,
});

const configuration = (): GitHubAppConfiguration | null => {
  const appId = process.env.MODBOTS_GITHUB_APP_ID?.trim();
  const installationId = process.env.MODBOTS_GITHUB_APP_INSTALLATION_ID?.trim();
  const encodedPrivateKey =
    process.env.MODBOTS_GITHUB_APP_PRIVATE_KEY_BASE64?.trim();

  if (
    !appId ||
    !installationId ||
    !encodedPrivateKey ||
    !/^\d+$/.test(appId) ||
    !/^\d+$/.test(installationId)
  ) {
    return null;
  }

  const privateKey = Buffer.from(encodedPrivateKey, "base64").toString("utf8");
  if (!privateKey.includes("BEGIN") || !privateKey.includes("PRIVATE KEY")) {
    return null;
  }

  return { appId, installationId, privateKey };
};

const appJwt = (app: GitHubAppConfiguration): string => {
  const issuedAt = Math.floor(Date.now() / 1000) - 60;
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iat: issuedAt, exp: issuedAt + 9 * 60, iss: app.appId }),
  ).toString("base64url");
  const unsignedToken = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256")
    .update(unsignedToken)
    .end()
    .sign(app.privateKey, "base64url");

  return `${unsignedToken}.${signature}`;
};

const installationToken = async (
  app: GitHubAppConfiguration,
): Promise<string | null> => {
  const now = Date.now();
  if (
    cachedInstallationToken?.appId === app.appId &&
    cachedInstallationToken.installationId === app.installationId &&
    cachedInstallationToken.expiresAt > now + 60_000
  ) {
    return cachedInstallationToken.token;
  }

  let jwt: string;
  try {
    jwt = appJwt(app);
  } catch {
    return null;
  }

  const response = await fetch(
    `https://api.github.com/app/installations/${app.installationId}/access_tokens`,
    {
      method: "POST",
      headers: githubHeaders(jwt),
      body: JSON.stringify({
        repositories: ["modbots-web"],
        permissions: { issues: "write" },
      }),
    },
  ).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  const body = (await response.json().catch(() => null)) as {
    token?: unknown;
    expires_at?: unknown;
  } | null;
  if (
    body === null ||
    typeof body.token !== "string" ||
    typeof body.expires_at !== "string"
  ) {
    return null;
  }

  const expiresAt = Date.parse(body.expires_at);
  if (!Number.isFinite(expiresAt)) {
    return null;
  }

  cachedInstallationToken = {
    appId: app.appId,
    installationId: app.installationId,
    token: body.token,
    expiresAt,
  };
  return body.token;
};

export const createGitHubIssue = async (
  title: string,
  body: string,
): Promise<CreateGitHubIssueResult> => {
  const app = configuration();
  if (app === null) {
    return { status: "not_configured" };
  }

  const token = await installationToken(app);
  if (token === null) {
    return { status: "github_unavailable" };
  }

  const response = await fetch(githubIssuesEndpoint, {
    method: "POST",
    headers: githubHeaders(token),
    body: JSON.stringify({ title, body }),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return { status: "github_unavailable" };
  }

  const issue = (await response.json().catch(() => null)) as {
    html_url?: unknown;
    number?: unknown;
  } | null;
  if (
    issue === null ||
    typeof issue.number !== "number" ||
    typeof issue.html_url !== "string"
  ) {
    return { status: "github_unavailable" };
  }

  return {
    status: "created",
    issue: { number: issue.number, url: issue.html_url },
  };
};
