import { prisma } from "./db";
import { Provider } from "./types";

// ── Setting keys ─────────────────────────────────────────────────────────────
export const KEYS = {
  anthropicKey: "anthropic_api_key",
  openaiKey: "openai_api_key",
  defaultProvider: "default_provider",
  aiMode: "ai_mode", // "byok" (default) | "hosted" (future)
} as const;

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string | null): Promise<void> {
  if (value == null || value === "") {
    await prisma.setting.deleteMany({ where: { key } });
    return;
  }
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

/**
 * Resolve the API key for a provider. THE SEAM for BYOK ↔ hosted:
 * order is (1) user's own key saved in-app, then (2) server env fallback.
 * A future hosted mode would branch here on aiMode === "hosted" and route
 * through a server-side proxy instead of returning a raw key.
 */
export async function getApiKey(provider: Provider): Promise<string | null> {
  const settingKey = provider === "anthropic" ? KEYS.anthropicKey : KEYS.openaiKey;
  const fromSettings = await getSetting(settingKey);
  if (fromSettings) return fromSettings;
  return provider === "anthropic"
    ? process.env.ANTHROPIC_API_KEY || null
    : process.env.OPENAI_API_KEY || null;
}

/** Which providers have a usable key right now (settings ∪ env), DEFAULT FIRST.
 *  The UI picks providers[0] as the initial choice, so ordering = the default. */
export async function availableProviders(): Promise<Provider[]> {
  const out: Provider[] = [];
  if (await getApiKey("anthropic")) out.push("anthropic");
  if (await getApiKey("openai")) out.push("openai");
  const def = (await getSetting(KEYS.defaultProvider)) as Provider | null;
  if (def && out.includes(def)) return [def, ...out.filter((p) => p !== def)];
  return out;
}

/** Non-secret status for the UI — never returns the key values themselves. */
export async function settingsStatus() {
  const [anthropicSetting, openaiSetting, defaultProvider] = await Promise.all([
    getSetting(KEYS.anthropicKey),
    getSetting(KEYS.openaiKey),
    getSetting(KEYS.defaultProvider),
  ]);
  return {
    anthropic: { configured: !!(anthropicSetting || process.env.ANTHROPIC_API_KEY), fromUser: !!anthropicSetting },
    openai: { configured: !!(openaiSetting || process.env.OPENAI_API_KEY), fromUser: !!openaiSetting },
    defaultProvider: (defaultProvider as Provider | null) ?? null,
  };
}
