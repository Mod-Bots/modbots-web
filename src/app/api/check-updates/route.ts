import packageJson from "../../../../package.json";

const githubReleasesEndpoint =
  "https://api.github.com/repos/Mod-Bots/modbots-web/releases?per_page=30";

interface GitHubRelease {
  draft: boolean;
  html_url: string;
  tag_name: string;
}

interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

const semanticVersion = (value: string): SemanticVersion | null => {
  const match = value
    .trim()
    .match(
      /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/,
    );

  if (match === null) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]?.split(".") ?? [],
  };
};

const compareIdentifiers = (left: string, right: string): number => {
  const leftNumber = /^\d+$/.test(left) ? Number(left) : null;
  const rightNumber = /^\d+$/.test(right) ? Number(right) : null;

  if (leftNumber !== null && rightNumber !== null) {
    return Math.sign(leftNumber - rightNumber);
  }

  if (leftNumber !== null) {
    return -1;
  }

  if (rightNumber !== null) {
    return 1;
  }

  return left.localeCompare(right);
};

const compareVersions = (left: string, right: string): number | null => {
  const leftVersion = semanticVersion(left);
  const rightVersion = semanticVersion(right);

  if (leftVersion === null || rightVersion === null) {
    return null;
  }

  for (const field of ["major", "minor", "patch"] as const) {
    if (leftVersion[field] !== rightVersion[field]) {
      return Math.sign(leftVersion[field] - rightVersion[field]);
    }
  }

  if (
    leftVersion.prerelease.length === 0 ||
    rightVersion.prerelease.length === 0
  ) {
    return Math.sign(
      Number(leftVersion.prerelease.length === 0) -
        Number(rightVersion.prerelease.length === 0),
    );
  }

  const identifierCount = Math.max(
    leftVersion.prerelease.length,
    rightVersion.prerelease.length,
  );

  for (let index = 0; index < identifierCount; index += 1) {
    const leftIdentifier = leftVersion.prerelease[index];
    const rightIdentifier = rightVersion.prerelease[index];

    if (leftIdentifier === undefined) {
      return -1;
    }

    if (rightIdentifier === undefined) {
      return 1;
    }

    const comparison = compareIdentifiers(leftIdentifier, rightIdentifier);

    if (comparison !== 0) {
      return comparison;
    }
  }

  return 0;
};

const isGitHubRelease = (value: unknown): value is GitHubRelease =>
  typeof value === "object" &&
  value !== null &&
  "draft" in value &&
  typeof value.draft === "boolean" &&
  "html_url" in value &&
  typeof value.html_url === "string" &&
  "tag_name" in value &&
  typeof value.tag_name === "string";

export async function GET(request: Request) {
  const currentVersion = new URL(request.url).searchParams
    .get("currentVersion")
    ?.trim();

  if (
    currentVersion === undefined ||
    semanticVersion(currentVersion) === null
  ) {
    return Response.json(
      { error: "The installed version could not be checked." },
      { status: 400 },
    );
  }

  const githubResponse = await fetch(githubReleasesEndpoint, {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "modbots-web",
      "X-GitHub-Api-Version": "2026-03-10",
    },
  }).catch(() => null);

  if (githubResponse === null || !githubResponse.ok) {
    return Response.json(
      { error: "GitHub could not be checked for updates." },
      { status: 502 },
    );
  }

  const releases = await githubResponse.json().catch(() => null);

  if (!Array.isArray(releases)) {
    return Response.json(
      { error: "GitHub could not be checked for updates." },
      { status: 502 },
    );
  }

  const latestRelease = releases
    .filter(isGitHubRelease)
    .filter((release) => !release.draft)
    .filter((release) => semanticVersion(release.tag_name) !== null)
    .sort(
      (left, right) => compareVersions(right.tag_name, left.tag_name) ?? 0,
    )[0];
  const installedVersion = packageJson.version;

  if (latestRelease === undefined) {
    return Response.json({
      currentVersion,
      installedVersion,
      latestVersion: null,
      releaseUrl: null,
      updateAvailable: false,
      updateReady: false,
    });
  }

  const updateAvailable =
    (compareVersions(latestRelease.tag_name, currentVersion) ?? 0) > 0;
  const updateReady =
    updateAvailable &&
    (compareVersions(installedVersion, currentVersion) ?? 0) > 0;

  return Response.json({
    currentVersion,
    installedVersion,
    latestVersion: latestRelease.tag_name.replace(/^v/, ""),
    releaseUrl: latestRelease.html_url,
    updateAvailable,
    updateReady,
  });
}
