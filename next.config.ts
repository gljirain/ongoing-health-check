import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the desktop (Electron) build — Electron
  // spawns `.next/standalone/server.js` and points DATABASE_URL at the user's
  // app-data dir. Harmless for normal `next dev` / `next start`.
  output: "standalone",
  // Make sure Next's dependency tracer bundles the Prisma query-engine binary
  // into the standalone output (it lives outside normal import graphs).
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/.prisma/client/**/*", "./node_modules/@prisma/engines/**/*"],
  },
};

export default nextConfig;
