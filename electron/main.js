// Electron main process — wraps the Next.js standalone server as a one-click
// desktop app. Each install is fully local: the SQLite DB lives in the user's
// app-data dir, and AI keys are entered in-app (BYOK). No accounts, no cloud.
const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const net = require("node:net");
const { spawn } = require("node:child_process");

const isDev = !app.isPackaged;

// In a packaged app, files land under the app resources dir; in dev they're in
// the project. The standalone server is the same tree either way.
const appRoot = isDev ? path.join(__dirname, "..") : process.resourcesPath;
const standaloneDir = path.join(appRoot, ".next", "standalone");
const serverEntry = path.join(standaloneDir, "server.js");
const templateDb = path.join(appRoot, "build", "template.db");

let serverProc = null;
let win = null;

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForServer(port, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const sock = net.connect(port, "127.0.0.1");
      sock.on("connect", () => {
        sock.destroy();
        resolve();
      });
      sock.on("error", () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error("server did not start in time"));
        else setTimeout(tryOnce, 200);
      });
    };
    tryOnce();
  });
}

function ensureDatabase() {
  const dbPath = path.join(app.getPath("userData"), "health.db");
  // First launch: seed the user's private DB from the empty schema template.
  if (!fs.existsSync(dbPath) && fs.existsSync(templateDb)) {
    fs.copyFileSync(templateDb, dbPath);
  }
  return dbPath;
}

// Keep the tail of the server's output so a launch failure is diagnosable
// (a GUI app has no terminal — "inherit" would lose it). Also mirror to a file.
let lastServerLog = "";
function logServer(text) {
  lastServerLog = (lastServerLog + text).slice(-6000);
  try {
    fs.appendFileSync(path.join(app.getPath("userData"), "server.log"), text);
  } catch {
    /* best effort */
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}

function showFatal(msg) {
  if (!win || win.isDestroyed()) return;
  const log = lastServerLog
    ? `<pre style="white-space:pre-wrap;font-size:12px;color:#555;background:#fff;padding:12px;border-radius:8px;max-height:340px;overflow:auto">${escapeHtml(lastServerLog)}</pre>`
    : "";
  win.loadURL(
    "data:text/html;charset=utf-8," +
      encodeURIComponent(
        `<body style="font-family:-apple-system,system-ui,sans-serif;padding:36px;background:#f6f4ef;color:#1f2421">
         <h2>Couldn't start Ongoing Health Check</h2>
         <p>${escapeHtml(msg)}</p>${log}
         <p style="color:#888;font-size:12px">Full log: ~/Library/Application Support/Ongoing Health Check/server.log</p></body>`,
      ),
  );
}

async function startServer() {
  const dbPath = ensureDatabase();
  const port = await freePort();
  try {
    fs.writeFileSync(path.join(app.getPath("userData"), "server.log"), ""); // fresh log each launch
  } catch {
    /* best effort */
  }
  serverProc = spawn(process.execPath, [serverEntry], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1", // run the Electron binary as plain Node
      NODE_ENV: "production",
      // Forward slashes so the file: URL is valid on Windows too.
      DATABASE_URL: `file:${dbPath.replace(/\\/g, "/")}`,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
    },
    stdio: ["ignore", "pipe", "pipe"], // capture output instead of losing it
  });
  serverProc.stdout.on("data", (d) => logServer(d.toString()));
  serverProc.stderr.on("data", (d) => logServer(d.toString()));
  // Crash-proof: only act if the window is still alive; surface the real cause.
  serverProc.on("exit", (code) => {
    if (code && win && !win.isDestroyed()) showFatal(`The local server stopped unexpectedly (exit code ${code}).`);
  });
  serverProc.on("error", (err) => {
    if (win && !win.isDestroyed()) showFatal(`Could not launch the local server: ${err.message}`);
  });
  await waitForServer(port);
  return port;
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 860,
    minWidth: 880,
    minHeight: 640,
    title: "Ongoing Health Check",
    backgroundColor: "#f6f4ef",
    webPreferences: { contextIsolation: true },
  });
  // Open external links in the system browser, not inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });
  try {
    const port = await startServer();
    await win.loadURL(`http://127.0.0.1:${port}`);
  } catch (err) {
    showFatal(String(err && err.message ? err.message : err));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (serverProc) serverProc.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProc) serverProc.kill();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
