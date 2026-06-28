"use client";

import { useEffect, useState } from "react";
import { KeyRound, Check } from "lucide-react";
import { Provider } from "@/lib/types";
import { useLang } from "@/lib/i18n";

interface Status {
  anthropic: { configured: boolean; fromUser: boolean };
  openai: { configured: boolean; fromUser: boolean };
  defaultProvider: Provider | null;
}

export function SettingsModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useLang();
  const [status, setStatus] = useState<Status | null>(null);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [defaultProvider, setDefaultProvider] = useState<Provider | "">("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Status) => {
        setStatus(s);
        setDefaultProvider(s.defaultProvider ?? "");
      });
  }, []);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Only send keys the user actually typed (blank = keep existing).
          ...(anthropicKey ? { anthropicKey } : {}),
          ...(openaiKey ? { openaiKey } : {}),
          defaultProvider: defaultProvider || null,
        }),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function StatusBadge({ s }: { s: { configured: boolean; fromUser: boolean } }) {
    if (!s.configured) return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-green-soft)] px-1.5 py-0.5 text-[10.5px] font-medium text-[#236b48]">
        <Check size={11} /> {s.fromUser ? t("keyConfigured") : t("keyFromEnv")}
      </span>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-[#1f2421]/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="card relative max-h-[92vh] w-full max-w-md overflow-y-auto p-6 soft-shadow fade-up">
        <div className="mb-1 flex items-center gap-2">
          <KeyRound size={17} className="text-[var(--color-accent)]" />
          <h3 className="font-display text-[21px]">{t("aiKeysTitle")}</h3>
        </div>
        <p className="mb-4 text-[12.5px] leading-relaxed text-[var(--color-muted)]">{t("aiKeysHint")}</p>

        <div className="space-y-4">
          <label className="block text-[12.5px] text-[var(--color-muted)]">
            <span className="mb-1 flex items-center gap-2">
              {t("anthropicKey")} {status && <StatusBadge s={status.anthropic} />}
            </span>
            <input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder={status?.anthropic.fromUser ? t("keyPlaceholderSet") : "sk-ant-..."}
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[13px]"
            />
          </label>

          <label className="block text-[12.5px] text-[var(--color-muted)]">
            <span className="mb-1 flex items-center gap-2">
              {t("openaiKey")} {status && <StatusBadge s={status.openai} />}
            </span>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder={status?.openai.fromUser ? t("keyPlaceholderSet") : "sk-..."}
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[13px]"
            />
          </label>

          <label className="block text-[12.5px] text-[var(--color-muted)]">
            {t("defaultProviderLabel")}
            <select
              value={defaultProvider}
              onChange={(e) => setDefaultProvider(e.target.value as Provider | "")}
              className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-[14px]"
            >
              <option value="">—</option>
              <option value="anthropic">Claude (Sonnet 4.6)</option>
              <option value="openai">OpenAI</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--color-line)] py-2 text-[14px] text-[var(--color-muted)]"
          >
            {t("cancel")}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-lg bg-[var(--color-accent)] py-2 text-[14px] font-medium text-white disabled:opacity-50"
          >
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
