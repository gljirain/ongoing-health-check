# Contributing

Thanks for your interest! This project gets better the more eyes are on its **medical knowledge** and the more reports its parser learns to read. Contributions of all sizes are welcome.

> By contributing, you agree your contributions are licensed under the project's [MIT License](LICENSE), and you understand the project's [DISCLAIMER](DISCLAIMER.md) — this is an educational tool, not medical advice.

## Best first contributions (no deep coding needed)

The highest-value, most approachable contributions are to the **knowledge layer**:

1. **Review a lab explainer.** `lib/lab-explainers.ts` holds short, plain-language explainers for common markers. Improve wording, fix an inaccuracy, or mark one reviewed. Keep it to **settled, well-established facts** — calm and non-alarmist.
2. **Add a lab explainer** for a marker that's missing. Same file; follow the existing `{ slug, zh, en }` shape. Add the canonical slug to the parser's list in `lib/ai.ts` so values line up across reports.
3. **Add or refine a catalog item.** `lib/catalog.ts` is the body-region knowledge base — each item has first-principles / ROI / risk content in **both Chinese and English** (`{ zh, en }`). This is where you add a new screening or sharpen the reasoning on an existing one.
4. **Reference ranges by region/lab.** Ranges differ by country and lab. Help make the defaults sensible for where you live.
5. **Teach the importer a new report format.** Share an **anonymized** report layout (strip all personal data first) so the parser in `lib/ai.ts` reads your country's/hospital's format well.
6. **Encode a screening relationship** in `lib/status.ts` — e.g. a `supersededBy` rule (a recent colonoscopy covers FIT) or a findings-aware interval (a removed polyp shortens the next recheck). Cite the guideline.
7. **Add a scenario / screening set.** A risk profile or life situation that deserves tailored guidance (family history, post-menopausal, smoker, ancestry with a higher baseline rate) — encode which checks matter and why.
8. **Add a language.** Content is `{ zh, en }`; help extend the structure to a third language.

All medical content is **bilingual** (`{ zh, en }`) and should cite or be checkable against mainstream guidelines where possible. When in doubt, prefer the less alarming framing and note the uncertainty.

## Dev setup

```bash
npm install
npm run setup     # Prisma client + SQLite DB + demo seed
npm run dev       # http://localhost:3000
npm run test      # status-logic tests
npx tsc --noEmit  # type-check
```

The app runs fully offline; AI features need your own key in `.env` (see `.env.example`) or in ⚙️ Settings.

## Guidelines

- **Type-check and run the tests** before opening a PR (`npx tsc --noEmit && npm run test`).
- **Match the surrounding style** — bilingual content, the existing component/idiom patterns.
- **Never commit personal or real patient data.** The committed seed (`prisma/seed.ts`) is fictional; keep it that way. Your own data belongs in the gitignored `prisma/seed.local.ts` and your local DB.
- **Keep AI advisory.** The deterministic engine (`lib/status.ts`) is the source of truth for the traffic lights; AI features propose, the user confirms. Please preserve that boundary.
- Be especially careful and conservative with **medical claims**. When unsure, prefer the less alarming framing and note the uncertainty.

## Opening a PR

1. Fork → branch → make your change.
2. Describe *what* and *why*; for medical content, link a source if you can.
3. Open the PR. Small, focused PRs get reviewed fastest.

Questions or ideas? Open an issue — including "I'm not sure how to start" ones. 🙂
