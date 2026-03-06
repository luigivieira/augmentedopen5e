# Augmented Open5e

<p align="left">
  <a href="README.md"><img src="https://flagcdn.com/w40/us.png" alt="English" width="32" style="opacity: 1;"></a>&nbsp;&nbsp;
  <a href="LEIAME.md"><img src="https://flagcdn.com/w40/br.png" alt="Português" width="22" style="opacity: 0.5;"></a>&nbsp;&nbsp;
  <a href="LEAME.md"><img src="https://flagcdn.com/w40/es.png" alt="Español" width="22" style="opacity: 0.5;"></a>
</p>

An open-source (MIT) REST API deployed on **Azion Edge Functions** that acts as an augmentation layer over the public [Open5e API](https://api.open5e.com/) for automatic translations via AI.

It serves Dungeons & Dragons 5th Edition System Reference Document (SRD) content, automatically extending it with AI-powered translations into different languages using the **Groq API** (powered by [llama-3.3-70b-versatile](https://console.groq.com/docs/models)).

> **Why Groq instead of Azion AI Inference?** This project is open source and runs on a free Azion account. At the time of this release, the free tier does not include access to [Azion AI Inference](https://www.azion.com/en/documentation/products/ai-inference/). In a paid setup, AI Inference would be a more direct and efficient choice — no external API dependency required. Groq was chosen as a practical alternative: it offers a generous free tier with fast inference and excellent multilingual support.

> **DISCLAIMER:** This project relies entirely on the open-source D&D 5e SRD, licensed under Creative Commons (CC-BY). **The translations provided by this API are strictly machine-generated (via AI/LLMs) on-the-fly and are NOT official translations.** This project is not affiliated with, endorsed by, or meant to reproduce the copyrighted translated works of Wizards of the Coast or any of its localized publishing partners.

## Core Value & Use Case

The primary goal of this API is **not** to replace the Open5e API, but to complement it. A client can use Open5e directly for search and pagination, and use this API strictly as a fast translation layer by slug.

Translations are fast because they run at the edge and are cached globally — low latency is guaranteed after the first access.

This project is also not meant to replace any existing official translations, but rather to serve as a community resource and as a demonstration of what can be built on the Azion Edge platform.

**Concrete Example:** A digital spellbook or character sheet UI that displays automatically translated spells. The client searches the spell on Open5e, extracts the slug, and calls this API to fetch the translation — all without the developer needing to manage their own translation infrastructure.

## Scope & Design Decisions

This API intentionally supports only individual spell lookups by slug. The Open5e API already handles search and pagination excellently — a client that has a spell's slug can use this API purely as a translation layer, requesting the content for a given locale without any additional infrastructure.

It is also worth noting that bulk translation is not supported. The edge computing model (V8 isolates with strict execution time limits) is not designed for long-running bulk processing; such operations would belong in a traditional cloud worker consuming a message queue.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/spells/:slug` | Returns a spell translated to the requested locale |
| `GET` | `/api/spells` | Returns all slugs currently cached for a given locale |

The `/api/spells` endpoint (no slug) is primarily intended for internal use and observability — it does not return spell data, only the list of slugs already cached for each locale.

**Locale format:** The `locale` query parameter must always follow the `language-region` format (e.g. `pt-br`, `en-us`, `es-es`). Single codes like `pt` or `en` are rejected with HTTP 400.

## Suggestions of Possible Improvements

The current architecture serves cached results well, but there are natural next steps if the project evolves:

- A **Cloud Worker** (e.g., Cloud Run, Lambda) consuming a message queue to process bulk translations asynchronously, outside of edge constraints.
- The `/api/spells` endpoint could automatically trigger a background translation job when a locale is first requested, making it the natural entry point to warm the cache for a new language.

## Development

This project uses [pnpm](https://pnpm.io/) as its package manager. If it is not installed, install it globally via `npm install -g pnpm`.

### Setup

Install dependencies:

```bash
pnpm install
```

Format and Lint:

```bash
pnpm format
pnpm lint
```

Deploying and managing this project also requires the [Azion CLI](https://www.azion.com/en/documentation/products/azion-cli/overview/). Install it for your platform:

**macOS/Linux:**

```bash
curl -fsSL https://cli.azion.app/install.sh | bash
```

**Windows (via Winget):**

```bash
winget install aziontech.azion
```

Then authenticate with your Azion account:

```bash
azion login
```

### Developing and Testing

#### Unit Tests

We use Vitest for unit testing:

```bash
pnpm test
```

#### Local Emulation & Documentation

You can emulate the Azion Edge Functions environment locally before deploying.

1. **Start the Emulator** — in your first terminal:

   ```bash
   pnpm emulate
   ```

2. **Open the local server** in your browser at `http://localhost:3333`. The home page provides project details, links to the interactive API docs (Scalar UI), and quick access to test the endpoints directly.

#### Local Emulator — Behaviour Notes

**KV Storage on disk:** When running locally, the Azion emulator persists KV data to `.edge/storage/<bucket-name>/` inside the project root. To reset the local cache, stop the emulator, delete the files in that directory, and restart:

```bash
rm .edge/storage/augmented_spells_kv-staging/*
```

**Groq API Key:** The local emulator calls the **real Groq API**. Create a `.env.local` file in the project root before running `pnpm emulate`:

```env
GROQ_API_KEY=your_key_here
```

This file is already listed in `.gitignore`. Get a free API key at [console.groq.com](https://console.groq.com).

### Deployment Strategy

This project uses a dual-environment configuration (Staging and Production) defined in `azion.config.ts`. Resources automatically receive a `-staging` or `-prod` suffix based on the environment.

The `azion.json` state files (in `azion/staging/` and `azion/production/`) are **committed to the repository** to ensure deployment consistency across environments and CI/CD pipelines.

#### 1. Setup for New Contributors

After cloning, run the reset command to generate bootstrap `azion.json` files for your own Azion account:

```bash
pnpm reset
```

Your first `pnpm deploy` will create the resources and update these files with the new IDs.

#### 2. Staging Deployment

```bash
pnpm deploy:staging
```

Builds and deploys to the `augmentedopen5e-staging` namespace. On the first run, the CLI creates the resources; on subsequent runs, it updates them using the committed IDs.

#### 3. Production Deployment

```bash
pnpm deploy:prod
```

Builds and deploys to the `augmentedopen5e-prod` namespace. **Note:** In most cases this is handled automatically by GitHub Actions on pushes to `main` — manual production deployment is generally not needed.

#### 4. Clearing the Remote Cache

```bash
pnpm delete:cache:staging
pnpm delete:cache:prod
```

Uses the Azion CLI to list and delete every object in the respective bucket. Useful to invalidate stale or outdated cached translations.

### Forking This Project

If you fork this repository, follow these steps before your first deployment:

1. Create a Personal Token in your Azion console.
2. In your GitHub repo, go to **Settings → Secrets and variables → Actions** and add a secret named `AZION_PERSONAL_TOKEN`.
3. Get your own Groq API key at [console.groq.com](https://console.groq.com) and add it as `GROQ_API_KEY` in your Azion application's Edge Functions environment variables (Azion Console → Edge Functions → your function → Environment Variables).
4. Run `pnpm reset` to generate new `azion.json` bootstrap files. Without this step, the CLI will attempt to update resources that don't exist in your account and fail.
5. After your first successful deployment, **commit the updated `azion.json` files**. These files now contain the IDs of your newly created Azion resources. Without committing them, future deployments may fail with a resource conflict error.

## License

The source code is licensed under the **MIT License**.

The content served by this API (including AI-generated translations) is derivative of the 5th Edition SRD and is licensed under **Creative Commons Attribution 4.0 International (CC-BY 4.0)**, matching the Open5e API license.

---

*Created with love and care by Luiz Carlos Vieira for the entire community.* ❤️
