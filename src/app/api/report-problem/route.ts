import { createGitHubIssue } from "../github-issues.ts";

interface ProblemReport {
  title: string;
  description: string;
}

const problemReport = (value: unknown): ProblemReport | null => {
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
  const report = problemReport(await request.json().catch(() => null));

  if (report === null) {
    return Response.json(
      { error: "Enter an issue title and description." },
      { status: 400 },
    );
  }

  const issueBody = `${report.description}\n\n---\nSubmission source: Public problem-report form.`;
  const result = await createGitHubIssue(report.title, issueBody);
  if (result.status === "not_configured") {
    return Response.json(
      { error: "Problem reporting is not configured." },
      { status: 503 },
    );
  }
  if (result.status === "github_unavailable") {
    return Response.json(
      { error: "GitHub could not create the issue. Please try again." },
      { status: 502 },
    );
  }

  return Response.json(result.issue, { status: 201 });
}
