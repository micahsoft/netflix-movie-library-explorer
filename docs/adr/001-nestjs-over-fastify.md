# ADR-001: NestJS over Fastify/Express

**Status:** Accepted  
**Date:** 2026-04

---

## Context

The backend needs to serve a GraphQL API, manage an OAuth2 token lifecycle with Google,
run a Drive crawl at startup, and maintain an in-memory catalog. The choice of framework
affects how these concerns are structured, tested, and extended.

## Options Considered

**Option A: NestJS**
Opinionated framework with a DI container, module system, and first-class GraphQL support
via `@nestjs/graphql`.

**Option B: Fastify + hand-rolled structure**
Lightweight, fast, no DI overhead. Structure determined by the developer.

**Option C: Express**
Ubiquitous, minimal, well-understood.

## Decision

**NestJS.**

## Rationale

The problem decomposes into four bounded concerns that have different reasons to change:

1. **Auth** — OAuth2 token lifecycle with Google
2. **Ingestion** — Drive crawl, normalization, quarantine
3. **Catalog** — In-memory store and pre-computed indexes
4. **API** — GraphQL schema, resolvers, validation

NestJS's module system makes these seams explicit in the folder structure.
A flat Express or Fastify app would mix these concerns or require hand-rolling the same structure.

More concretely: NestJS's DI container lets `IngestionService` take `DriveClient` as a
constructor dependency. In tests, a `MockDriveClient` returning fixture JSON is swapped in
via a module override — no network calls, no credentials, 50ms test suite.

`OnApplicationBootstrap` on `CatalogService` provides a clean, idiomatic place for the
startup crawl. No ad-hoc orchestration in `main.ts`.

## Trade-offs

**Cost:** ~200ms additional boot time. Some decorator syntax. Framework opinions to learn.  
**Benefit:** Testable ingestion layer, clean module boundaries, idiomatic lifecycle hooks.

The cost is acceptable because the structure is load-bearing — the ingestion layer
is where complexity lives and where testability matters most.

## What would change this decision

If the project were a single endpoint with trivial logic, Fastify would be the right call.
The overhead is only justified when the structure it enforces is actually needed.
