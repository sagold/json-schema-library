#!/usr/bin/env node
/**
 * Parses mocha JSON reporter output for each draft and writes
 * BADGE_DRAFTxx and COLOR_DRAFTxx env vars to $GITHUB_ENV.
 *
 * Mocha JSON reporter shape:
 * {
 *   stats: { passes: N, failures: N, pending: N },
 *   ...
 * }
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const drafts = [
  { key: "DRAFT04",   file: "test-result-spec4.json" },
  { key: "DRAFT06",   file: "test-result-spec6.json" },
  { key: "DRAFT07",   file: "test-result-spec7.json" },
  { key: "DRAFT2019", file: "test-result-spec2019-09.json" },
  { key: "DRAFT2020", file: "test-result-spec2020-12.json" },
];

const githubEnv = process.env.GITHUB_ENV;
const lines = [];

for (const { key, file } of drafts) {
  const filePath = path.resolve(process.cwd(), file);

  let message = "unknown";
  let color = "lightgrey";

  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const json = JSON.parse(raw);
      const passes = json?.stats?.passes ?? 0;
      const failures = json?.stats?.failures ?? 0;
      const total = passes + failures;

      if (total === 0) {
        message = "no tests";
        color = "lightgrey";
      } else if (failures === 0) {
        message = `${passes}/${total} passing`;
        color = "brightgreen";
      } else {
        const pct = Math.round((passes / total) * 100);
        message = `${passes}/${total} passing`;
        // Color scale: green >= 95%, yellow >= 80%, orange >= 60%, red < 60%
        color = pct >= 95 ? "green" : pct >= 80 ? "yellow" : pct >= 60 ? "orange" : "red";
      }
    } catch (e) {
      console.error(`Failed to parse ${file}:`, e.message);
      message = "parse error";
      color = "lightgrey";
    }
  } else {
    console.warn(`Result file not found: ${file}`);
    message = "not run";
    color = "lightgrey";
  }

  console.log(`${key}: ${message} (${color})`);
  lines.push(`BADGE_${key}=${message}`);
  lines.push(`COLOR_${key}=${color}`);
}

if (githubEnv) {
  fs.appendFileSync(githubEnv, lines.join(os.EOL) + os.EOL);
  console.log("Written to GITHUB_ENV");
} else {
  // Local debug
  console.log("\n--- Would write to GITHUB_ENV ---");
  lines.forEach((l) => console.log(l));
}