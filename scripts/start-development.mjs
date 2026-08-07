import { spawn } from "node:child_process";
import path from "node:path";

const environment = { ...process.env };

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
