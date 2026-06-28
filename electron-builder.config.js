// electron-builder config. Kept in JS (not package.json) so macOS signing +
// notarization can be CONDITIONAL: when Apple credentials are present in the
// environment we produce a signed + notarized .dmg (no Gatekeeper warning);
// otherwise we fall back to an unsigned build (still works, one-time warning).
//
// To produce a signed + notarized macOS build, set these before `npm run dist`:
//   APPLE_ID                     your Apple Developer account email
//   APPLE_APP_SPECIFIC_PASSWORD  app-specific password (appleid.apple.com)
//   APPLE_TEAM_ID                your 10-char Team ID
//   CSC_LINK                     path to (or base64 of) your Developer ID .p12
//   CSC_KEY_PASSWORD             the .p12 export password
//
// With none of these set, the build is unsigned and these mac signing keys are
// omitted entirely.

const hasAppleCreds =
  !!process.env.APPLE_ID && !!process.env.APPLE_APP_SPECIFIC_PASSWORD && !!process.env.APPLE_TEAM_ID;

/** @type {import('electron-builder').Configuration} */
const config = {
  appId: "com.ongoinghealthcheck.app",
  productName: "Ongoing Health Check",
  afterPack: "scripts/after-pack.js",
  asar: true,
  files: ["electron/**/*", "package.json"],
  extraResources: [
    { from: ".next/standalone", to: ".next/standalone", filter: ["**/*", "!**/.env", "!**/.env.*"] },
    { from: "build/template.db", to: "build/template.db" },
  ],
  directories: { output: "release" },
  mac: {
    target: "dmg",
    category: "public.app-category.healthcare-fitness",
    // Signing + notarization only when credentials are available.
    ...(hasAppleCreds
      ? {
          hardenedRuntime: true,
          gatekeeperAssess: false,
          entitlements: "build/entitlements.mac.plist",
          entitlementsInherit: "build/entitlements.mac.plist",
          notarize: { teamId: process.env.APPLE_TEAM_ID },
        }
      : {}),
  },
  win: { target: "nsis" },
  linux: { target: "AppImage", category: "Utility" },
};

module.exports = config;
