import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated desktop build output — not source, must not be linted.
    "release/**",
    // CommonJS Node files (Electron main + build scripts/config) legitimately
    // use require(); the Next/TS browser rules don't apply to them.
    "electron/**",
    "scripts/*.js",
    "electron-builder.config.js",
  ]),
]);

export default eslintConfig;
