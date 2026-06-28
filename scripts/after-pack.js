const fs = require("node:fs");
const path = require("node:path");

// electron-builder strips `node_modules` out of anything in `extraResources`,
// so the Next.js standalone server would ship without its dependencies (incl.
// the Prisma native engine) and fail at launch. Copy it in ourselves, after the
// app is assembled. Runs per-OS in CI, so each platform gets its own native engine.
exports.default = async function afterPack(context) {
  const { appOutDir, packager, electronPlatformName } = context;
  const productName = packager.appInfo.productFilename;
  const resources =
    electronPlatformName === "darwin"
      ? path.join(appOutDir, `${productName}.app`, "Contents", "Resources")
      : path.join(appOutDir, "resources");

  const src = path.join(packager.projectDir, ".next", "standalone", "node_modules");
  const dest = path.join(resources, ".next", "standalone", "node_modules");
  if (!fs.existsSync(src)) throw new Error(`afterPack: standalone node_modules missing at ${src}`);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`  • afterPack: bundled standalone node_modules → ${dest}`);
};
