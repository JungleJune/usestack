# UseStack

UseStack is a curated directory for discovering AI-native products, following product updates, and learning which tools builders combine into practical workflows.

Production: [usestack.ai](https://usestack.ai)

## Local Development

Requirements:

- Node.js 22
- npm 10
- A Supabase project

```bash
cp .env.example .env.local
npm ci --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality Checks

```bash
npm run check
npm run security:deps
npm run build
```

`npm run check` runs linting, TypeScript validation, unit tests, and a source secret scan. Pull requests run the same checks in GitHub Actions.

## Documentation

- [Requirements](docs/REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [SDLC](docs/SDLC.md)
- [Testing](docs/TESTING.md)
- [Deployment and maintenance](docs/DEPLOYMENT.md)
- [Supabase security](docs/SUPABASE_SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## Core Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Validate TypeScript |
| `npm test` | Run unit tests |
| `npm run security:secrets` | Scan source files for likely secrets |
| `npm run security:deps` | Fail on high or critical production advisories |
| `npm run build` | Create the production build |
| `npm run ci` | Run the full local CI sequence |

## Environments

Use `.env.local` for local secrets and Vercel Environment Variables for Preview and Production. Never commit credentials. `.env.example` is the authoritative variable inventory.
