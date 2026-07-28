const githubIssuesEndpoint =
  "https://api.github.com/repos/wsucauid798/modbots-web/issues";

interface FeatureRequest {
  title: string;
  description: string;
}

const featureRequest = (value: unknown): FeatureRequest | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const title = "title" in value ? value.title : null;
  const description = "description" in value ? value.description : null;

  if (typeof title !== "string" || typeof description !== "string") {
    return null;
  }

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  if (
    trimmedTitle.length === 0 ||
    trimmedTitle.length > 256 ||
    trimmedDescription.length === 0 ||
    trimmedDescription.length > 10000
  ) {
    return null;
  }

  return { title: trimmedTitle, description: trimmedDescription };
};

export async function POST(request: Request) {
  const token = process.env.MODBOTS_GITHUB_ISSUES_TOKEN?.trim();

  if (token === undefined || token.length === 0) {
    return Response.json(
      { error: "Feature requests are not configured." },
      { status: 503 },
    );
  }

  const report = featureRequest(await request.json().catch(() => null));

  if (report === null) {
    return Response.json(
      { error: "Enter a feature title and description." },
      { status: 400 },
    );
  }

  const githubResponse = await fetch(githubIssuesEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "modbots-web",
      "X-GitHub-Api-Version": "2026-03-10",
    },
    body: JSON.stringify({
      title: report.title,
      body: report.description,
    }),
  }).catch(() => null);

  if (githubResponse === null) {
    return Response.json(
      {
        error: "GitHub could not create the feature request. Please try again.",
      },
      { status: 502 },
    );
  }

  const githubIssue = (await githubResponse.json().catch(() => null)) as {
    html_url?: unknown;
    number?: unknown;
  } | null;

  if (
    !githubResponse.ok ||
    githubIssue === null ||
    typeof githubIssue.number !== "number" ||
    typeof githubIssue.html_url !== "string"
  ) {
    return Response.json(
      {
        error: "GitHub could not create the feature request. Please try again.",
      },
      { status: 502 },
    );
  }

  return Response.json(
    { number: githubIssue.number, url: githubIssue.html_url },
    { status: 201 },
  );
}
