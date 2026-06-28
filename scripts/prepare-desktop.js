// Finalize the standalone build for desktop packaging:
//  1. copy static assets + public into the standalone tree (Next requires this)
//  2. generate an empty schema-only SQLite DB the app copies on first launch
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true });
}

console.log("• copying static assets into standalone…");
copyDir(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"));
copyDir(path.join(root, "public"), path.join(standalone, "public"));

// Never ship secrets: Next copies the root .env into the standalone tree, but
// keys are per-user (entered in Settings). Strip any env files before packaging.
for (const f of [".env", ".env.local", ".env.production", ".env.development"]) {
  fs.rmSync(path.join(standalone, f), { force: true });
}

console.log("• generating empty DB template (build/template.db)…");
const buildDir = path.join(root, "build");
fs.mkdirSync(buildDir, { recursive: true });
const templateDb = path.join(buildDir, "template.db");
fs.rmSync(templateDb, { force: true });
// Forward slashes so the file: URL is valid on Windows runners too.
const dbUrl = `file:${templateDb.replace(/\\/g, "/")}`;
execSync("npx prisma db push --skip-generate", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: dbUrl },
});

console.log("• seeding reviewed lab explainers into the template…");
execSync("npx tsx scripts/seed-explainers.ts", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: dbUrl },
});

console.log("✓ desktop bundle ready");
