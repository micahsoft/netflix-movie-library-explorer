# ADR-005: Monorepo with Shared Types Package

**Status:** Accepted  
**Date:** 2026-04

---

## Context

The project has a TypeScript backend and a TypeScript frontend. Both need to agree
on the shape of `Movie`, filter inputs, and API response types. There are two ways
to manage this: separate packages that duplicate types, or a monorepo with a shared
types package.

## Options Considered

**Option A: pnpm workspace monorepo with `packages/types`**
A single `types` package defines all shared interfaces. Backend and frontend import
from `@movie-explorer/types`. One source of truth.

**Option B: Separate backend and frontend repos/folders**
Each side defines its own types. Types are kept in sync manually or via code generation.

## Decision

**Option A: pnpm workspace monorepo.**

## Rationale

With TypeScript on both sides, duplicating types is unnecessary and creates a
maintenance burden — when the `Movie` interface changes, you update it in two places
and hope both compilations catch the divergence.

A shared `packages/types` package means:
- The `Movie` interface, `MovieFilter` input, and `CatalogStats` type are defined once
- The backend's GraphQL schema and the frontend's query hooks both consume the same types
- A type error in either side catches a contract mismatch at compile time

This is a small investment (one extra `package.json`, a workspace config) with
a clear payoff during the interview walkthrough: "I defined the domain model once
and both sides of the system consume it — here's the import."

## Trade-offs

**Cost:** pnpm workspace setup. Slightly more initial configuration.  
**Benefit:** Single source of truth for all shared types. Compile-time contract enforcement.
Visible architectural coherence in the walkthrough.

## Package structure

```
packages/
├── types/        # @movie-explorer/types — Movie, MovieFilter, CatalogStats, etc.
├── backend/      # @movie-explorer/backend — imports from types
└── frontend/     # @movie-explorer/frontend — imports from types
```
