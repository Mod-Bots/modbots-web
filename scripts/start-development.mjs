import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const environment = { ...process.env };

if (!environment.MODBOTS_GITHUB_ISSUES_TOKEN?.trim()) {
  const githubToken = spawnSync("gh", ["auth", "token"], {
    encoding: "utf8",
    windowsHide: true,
  });

  if (githubToken.status !== 0 || !githubToken.stdout.trim()) {
    console.error(
      "GitHub issue forms require an authenticated GitHub CLI. Run 'gh auth login' and start the web app again.",
    );
    process.exit(1);
  }

  environment.MODBOTS_GITHUB_ISSUES_TOKEN = githubToken.stdout.trim();
}

const concurrently = path.join(
  process.cwd(),
  "node_modules",
  "concurrently",
  "dist",
  "bin",
  "index.js",
);
const configuredPort = environment.PORT?.trim();

if (
  configuredPort &&
  (!/^[0-9]{1,5}$/.test(configuredPort) || Number(configuredPort) > 65535)
) {
  console.error("PORT must be a number between 1 and 65535.");
  process.exit(1);
}

const nextCommand = configuredPort
  ? `npm run dev:next -- -p ${configuredPort}`
  : "npm:dev:next";
const development = spawn(
  process.execPath,
  [
    concurrently,
    "--names",
    "styles,next",
    "--prefix-colors",
    "magenta,cyan",
    "npm:styles:watch",
    nextCommand,
  ],
  {
    env: environment,
    stdio: "inherit",
    windowsHide: true,
  },
);

development.on("error", (error) => {
  console.error(`Could not start the web app: ${error.message}`);
  process.exitCode = 1;
});

development.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
