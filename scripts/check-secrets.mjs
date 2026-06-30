import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" }
)
  .split("\n")
  .filter(Boolean)
  .filter(
    (file) =>
      !file.endsWith("package-lock.json") &&
      !file.endsWith("pnpm-lock.yaml") &&
      !file.startsWith("outputs/")
  );

const patterns = [
  { name: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "known default password", pattern: /\badmin123\b/i },
  {
    name: "Gmail app password",
    pattern:
      /(?:pass|password)\s*[:=]\s*["'][a-z]{4}\s[a-z]{4}\s[a-z]{4}\s[a-z]{4}["']/i,
  },
  {
    name: "hardcoded sensitive environment value",
    pattern:
      /(?:SUPABASE_SERVICE_ROLE_KEY|GEMINI_API_KEY|OPENROUTER_API_KEY|AGENT_API_KEY|SMTP_PASSWORD)\s*[:=]\s*["'][^"'$]{8,}["']/,
  },
];

const findings = [];

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const { name, pattern } of patterns) {
    if (pattern.test(content)) findings.push(`${file}: ${name}`);
  }
}

if (findings.length > 0) {
  console.error(`Potential secrets detected:\n${findings.join("\n")}`);
  process.exit(1);
}

console.log(`Secret scan passed (${files.length} tracked files checked).`);
