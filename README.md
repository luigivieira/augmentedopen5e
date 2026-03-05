# Augmented Open5e

<p align="left">
  <a href="README.md"><img src="https://flagcdn.com/w40/us.png" alt="English" width="32" style="opacity: 1;"></a>&nbsp;&nbsp;
  <a href="LEIAME.md"><img src="https://flagcdn.com/w40/br.png" alt="Português" width="22" style="opacity: 0.5;"></a>&nbsp;&nbsp;
  <a href="LEAME.md"><img src="https://flagcdn.com/w40/es.png" alt="Español" width="22" style="opacity: 0.5;"></a>
</p>

An open-source (MIT) REST API deployed on **Azion Edge Functions** that acts as an augmentation layer over the public [Open5e API](https://api.open5e.com/) for automatic translations from AI.

It serves Dungeons & Dragons 5th Edition System Reference Document (SRD) content, while automatically extending it with AI-powered translations into different languages using Hugging Face LLMs.

> **⚠️ CAUTION — Copyright Notice:** This project relies entirely on the open-source D&D 5e SRD (System Reference Document), which is licensed under Creative Commons (CC-BY). **The translations provided by this API are strictly machine-generated (via AI/LLMs) on-the-fly and are NOT official translations.** This project is not affiliated with, endorsed by, or meant to reproduce the copyrighted translated works of Wizards of the Coast or any of its localized publishing partners.

## Core Value & Use Case

The primary goal of this API is **not** to replace the Open5e API, but to complement it. A client can perfectly use Open5e directly for search and pagination (which is a distinct use case with its own UX), and use this API strictly as a fast translation layer by slug.

Translations are blazing fast because they run at the edge and are cached globally — low latency is guaranteed after the first access.

**Concrete Example:** A digital spellbook or character sheet UI that displays automatically translated spells for the user. The client searches the spell on Open5e, extracts the slug, and calls this API to fetch the translation—all without the developer needing to manage their own translation infrastructure.

## Current Limitations

The API currently supports **only individual spell lookups by slug**. There are no endpoints for search, pagination, or bulk translation operations.

**Why?** The edge computing model (based on V8 isolates and strict execution time limits) is fundamentally unsuitable for long-running bulk processing or orchestration. Such heavy operations belong in a traditional cloud worker consuming a message queue, not at the edge.

## Architecture Roadmap

The project's planned architecture separates the fast distribution of data from the slow generation of AI translations:

1. **The Edge Function** serves cached results and returns `202 Accepted` for content that hasn't been translated yet.
2. **A Cloud Worker** (e.g., Cloud Run, Lambda) consumes a message queue (e.g., SQS, Pub/Sub) and processes the translations in bulk asynchronously.
3. **Edge SQL** remains purely as a highly available, fast read cache in the hot path.

This separation respects the edge computing's main strength (serving with low latency) without abusing it for workloads it wasn't designed for.

Additionally, the `GET /api/spells?locale=<locale>` endpoint might, in the future, automatically trigger the background translation job when a locale is requested and no spells are cached — making it the natural entry point to begin warming the cache for a new language.

## Development

This project uses [pnpm](https://pnpm.io/) as its package manager. If it is not installed, install it globally via `npm install -g pnpm`.

Additionally, deploying and managing this project requires the [Azion CLI](https://www.azion.com/en/documentation/products/azion-cli/overview/).
Install it and authenticate before deploying:

**For macOS/Linux**:

```bash
curl -fsSL https://cli.azion.app/install.sh | bash
```

**For Windows (via Winget)**:

```bash
winget install aziontech.azion
```

After installation, log in to your account:

```bash
azion login
```

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

### Developing and Testing

#### Unit Tests

We use Vitest for unit testing. To run the test suite:

```bash
pnpm test
```

#### Local Emulation & Documentation

You can emulate the Azion Edge Functions environment locally to test changes through an interactive Scalar UI before deploying.

1. **Start the Emulator:**

   In your first terminal, run:

   ```bash
   pnpm emulate
   ```

   This command starts a local server mimicking the Edge environment (`azion dev`).

2. **Open the Interactive API Docs:**

   In a second terminal, run:

   ```bash
   pnpm open
   ```

   This will automatically open your default browser at `http://localhost:3333/docs` where you can view the specification and test endpoints directly.

### Deployment Strategy

This project uses a dual-environment configuration (Staging and Production) defined in `azion.config.ts`. Azion resources automatically receive a `-staging` or `-prod` suffix based on the environment.

The `azion.json` state files (in `azion/staging/` and `azion/production/`) are **committed to the repository** to ensure deployment consistency across different environments and CI/CD pipelines.

#### 1. Setup for New Contributors

If you have just cloned the repository and need to authorize your own Azion application resources, run the reset command:

```bash
pnpm reset
```

This generates the bootstrap `azion.json` files. Your first `pnpm deploy` will then create the resources and update these files with the new IDs.

#### 2. Local Staging Deployment

```bash
pnpm deploy:staging
```

Builds the edge function and deploys it to Azion under the `augmentedopen5e-staging` namespace. On the first run (after `pnpm reset`), the CLI creates the resources; on subsequent runs, it updates them using the IDs stored in `azion.json`.

#### 3. Production Deployment (Local or GitHub Actions)

```bash
pnpm deploy:prod
```

Builds and deploys the production edge function under the `augmentedopen5e-prod` namespace. It uses the IDs committed in the repository to ensure it always updates the correct application.

> **Important for Forks:**
>
> 1. Create a Personal Token in your Azion console.
> 2. In your GitHub repository go to **Settings → Secrets and variables → Actions** and add a secret named `AZION_PERSONAL_TOKEN` with the token value.

## License

The source code of this API is licensed under the **MIT License**.

The content served by this API (including the AI-generated translations) is derivative of the 5th Edition SRD and is licensed under the **Creative Commons Attribution 4.0 International (CC-BY 4.0)** license, matching the Open5e API license.
