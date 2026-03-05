# Augmented Open5e

<p align="left">
  <a href="README.md"><img src="https://flagcdn.com/w40/us.png" alt="English" width="32" style="opacity: 1;"></a>&nbsp;&nbsp;
  <a href="LEIAME.md"><img src="https://flagcdn.com/w40/br.png" alt="Português" width="22" style="opacity: 0.5;"></a>&nbsp;&nbsp;
  <a href="LEAME.md"><img src="https://flagcdn.com/w40/es.png" alt="Español" width="22" style="opacity: 0.5;"></a>
</p>

An open-source (MIT) REST API deployed on **Azion Edge Functions** that acts as an augmentation layer over the public [Open5e API](https://api.open5e.com/).

It serves Dungeons & Dragons 5th Edition System Reference Document (SRD) content, while automatically extending it with AI-powered translations into different languages using Hugging Face LLMs.

> **⚠️ CAUTION — Copyright Notice:** This project relies entirely on the open-source D&D 5e SRD (System Reference Document), which is licensed under Creative Commons (CC-BY). **The translations provided by this API are strictly machine-generated (via AI/LLMs) on-the-fly and are NOT official translations.** This project is not affiliated with, endorsed by, or meant to reproduce the copyrighted translated works of Wizards of the Coast or any of its localized publishing partners.

## Features

- **Edge Native**: Runs globally on V8 isolates via [Azion Edge Functions](https://www.azion.com/en/products/edge-functions/) for ultra-low latency.
- **Auto-Translation**: Automatically translates spells into requested locales using Hugging Face Inference endpoints (support for monsters and items is planned for future versions).
- **Asynchronous Translation Engine**: Prevents edge timeouts by returning partial data immediately while triggering background translations.
- **Edge SQL Caching**: Caches translated entities (and eventually raw Open5e English strings) directly at the edge in a globally replicated SQLite database via [Azion Edge SQL](https://www.azion.com/en/products/edge-sql/).

## Architecture & Trade-offs

During the design phase of this API, several deliberate architectural choices were made, tailored for serverless edge computing.

### 1. Monolith Router vs Micro-Functions

**Decision**: A single API entry point (`index.ts`) that routes traffic internally, rather than deploying dozens of separate Azion edge functions for each route (`/monsters`, `/spells`, etc.).

**Trade-offs**:

- **Pros**: Drastically reduces cold starts since any request to the API keeps the V8 isolate warm for all other routes. It also centralizes middleware (auth, JSON parsing, error handling) and reduces deployment complexity via Azion CLI.
- **Cons**: The final bundled script size is slightly larger than a single-purpose micro-function, though negligible for a Node/V8 environment.

### 2. Azion Edge SQL vs Azion KV Store

**Decision**: Azion Edge SQL (Distributed SQLite) is chosen over the Azion KV Store for the primary caching and translation storage layer.

**Trade-offs**:

- **Pros**: **Pagination flexibility.** If a KV Store were used, querying a paginated list of spells (`/api/spells?page=2`) would require caching _the entire page response as a single string_. If the user later adds a filter or changes the page size, the page-cache is broken. With Edge SQL, translations are cached at the **Entity Level** (e.g., `slug: acid-arrow_pt-br`). A fast `SELECT * WHERE slug IN (...)` command can be executed, allowing dynamic, robust API querying that adapts to any list variations.
- **Cons**: SQL storage requires slightly more setup compared to simple `get/put` commands in a KV store.

### 3. Asynchronous vs Synchronous Translations

**Decision**: Hugging Face LLM translation calls happen _asynchronously_ (in the background) rather than blocking the user's HTTP request.

**Trade-offs**:

- **Pros**: Edge functions have strict execution time limits. Waiting for an external AI model to translate a large block of JSON synchronously would invariably lead to `504 Gateway Timeout` errors. By returning the untranslated (or partially translated) list immediately and dispatching the translation task to the background (`event.waitUntil` / background queues), the API remains blazingly fast.
- **Cons**: The user must refresh or make a subsequent request a few seconds later to see the completed translations once they are cached in the Edge SQL database.

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

This project utilizes a dual-environment configuration (Staging and Production) mapped out in `azion.config.ts`. Resources created on Azion will automatically receive a suffix (`-staging` or `-prod`) appended to their names based on the deployed environment.

#### 1. Local Staging Deployment

To deploy a test version directly from your local machine to the Azion Edge:

```bash
pnpm deploy:staging
```

This ensures your test application and its associated edge functions are created under the `augmentedopen5e-staging` namespace.

#### 2. Production Deployment (GitHub Actions)

Production deployments are automated via GitHub Actions upon pushing to the `main` branch.

> **Important for Forks:** If you fork this project, the official deployment token is not transferred for security reasons. To enable the CI/CD pipeline on your fork:
>
> 1. Create a Personal Token in your Azion Console.
> 2. Go to your GitHub repository **Settings** -> **Secrets and variables** -> **Actions**.
> 3. Add a new repository secret named `AZION_PERSONAL_TOKEN` and paste your token.

The automated pipeline executes the equivalent of:

```bash
pnpm deploy:prod
```

This command deploys the finalized application live under the `augmentedopen5e-prod` namespace without interfering with your staging resources.

## License

The source code of this API is licensed under the **MIT License**.

The content served by this API (including the AI-generated translations) is derivative of the 5th Edition SRD and is licensed under the **Creative Commons Attribution 4.0 International (CC-BY 4.0)** license, matching the Open5e API license.
