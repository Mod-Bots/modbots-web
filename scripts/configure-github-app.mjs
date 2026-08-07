import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const option = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1]?.trim();
};

const appId = option("--app-id");
const installationId = option("--installation-id");
const privateKeyPath = option("--private-key");

if (
  !appId ||
  !installationId ||
  !privateKeyPath ||
  !/^\d+$/.test(appId) ||
  !/^\d+$/.test(installationId)
) {
  console.error(
    "Usage: node scripts/configure-github-app.mjs --app-id <id> --installation-id <id> --private-key <pem path>",
  );
  process.exit(1);
}

const privateKey = await readFile(path.resolve(privateKeyPath), "utf8");
if (!privateKey.includes("BEGIN") || !privateKey.includes("PRIVATE KEY")) {
  console.error("The selected file is not a GitHub App private key.");
  process.exit(1);
}

const environmentPath = path.join(process.cwd(), ".env.local");
const existing = await readFile(environmentPath, "utf8").catch(() => "");
const managedKeys = new Set([
  "MODBOTS_GITHUB_APP_ID",
  "MODBOTS_GITHUB_APP_INSTALLATION_ID",
  "MODBOTS_GITHUB_APP_PRIVATE_KEY_BASE64",
  "MODBOTS_GITHUB_ISSUES_TOKEN",
]);
const retainedLines = existing
  .split(/\r?\n/)
  .filter((line) => !managedKeys.has(line.split("=", 1)[0]));

while (retainedLines.at(-1) === "") {
  retainedLines.pop();
}

const configured = [
  ...retainedLines,
  ...(retainedLines.length > 0 ? [""] : []),
  `MODBOTS_GITHUB_APP_ID=${appId}`,
  `MODBOTS_GITHUB_APP_INSTALLATION_ID=${installationId}`,
  `MODBOTS_GITHUB_APP_PRIVATE_KEY_BASE64=${Buffer.from(privateKey).toString("base64")}`,
  "",
].join("\n");

await writeFile(environmentPath, configured, { encoding: "utf8", mode: 0o600 });
console.log("GitHub App credentials were saved to .env.local.");
