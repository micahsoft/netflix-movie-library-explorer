# Netflix Movie Library Explorer

A full-stack application for ingesting, exploring, and querying movie metadata
from a Google Drive folder. Built for the Netflix NTech SWE Technical Assessment.

## Project Structure

```
movie-explorer/
├── docs/
│   ├── requirements/     # Spec audit and feature-to-component mapping
│   ├── design/           # Domain model, API contract, data flow, error handling
│   ├── adr/              # Architecture Decision Records
│   └── testing/          # Test strategy
├── packages/
│   ├── types/            # Shared TypeScript interfaces and DTOs
│   ├── backend/          # NestJS + GraphQL API
│   └── frontend/         # React + Vite UI
├── package.json          # pnpm workspace root
└── pnpm-workspace.yaml
```

## Documentation Index

| Document | Description |
|---|---|
| [Requirements Mapping](docs/requirements/requirements-mapping.md) | Spec audit, feature-to-component mapping, ambiguities |
| [Domain Model](docs/design/domain-model.md) | Movie type, field definitions, normalization contract |
| [API Contract](docs/design/api-contract.md) | GraphQL schema — queries, mutations, types, inputs |
| [Data Flow](docs/design/data-flow.md) | End-to-end data movement and error boundaries |
| [Error Handling](docs/design/error-handling.md) | Failure modes and recovery strategy per layer |
| [ADR-001](docs/adr/001-nestjs-over-fastify.md) | Why NestJS over Fastify/Express |
| [ADR-002](docs/adr/002-graphql-over-rest.md) | Why GraphQL over REST |
| [ADR-003](docs/adr/003-blocking-startup-crawl.md) | Why blocking startup crawl over lazy/background |
| [ADR-004](docs/adr/004-pre-computed-aggregates.md) | Why pre-compute stats at ingestion time |
| [ADR-005](docs/adr/005-monorepo-shared-types.md) | Why monorepo with shared types package |
| [Test Strategy](docs/testing/test-strategy.md) | Unit, integration, mocking approach |

## Prerequisites

- Node.js 20+
- pnpm 9+
- Google Cloud project with Drive API enabled
- OAuth2 credentials (`credentials.json`)

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up GCP credentials (one-time)
#    a. Create a GCP project and enable the Google Drive API
#    b. Create OAuth2 credentials (Desktop app type)
#    c. Add http://localhost:3001/oauth2callback as an authorized redirect URI
#    d. Add your Gmail as a Test user on the OAuth consent screen
#    e. Download credentials.json → place in packages/backend/credentials.json

# 3. Configure environment
cp packages/backend/.env.example packages/backend/.env

# 4. Run (first run opens a browser window for OAuth authorization)
pnpm dev
```

The backend starts at **http://localhost:3000/graphql** (GraphQL Playground available).  
The frontend starts at **http://localhost:5173**.
