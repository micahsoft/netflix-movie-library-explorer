# ADR-003: Blocking Startup Crawl

**Status:** Accepted  
**Date:** 2026-04

---

## Context

The catalog must be populated from Google Drive before the API can serve meaningful responses.
The question is when and how this crawl runs relative to the HTTP server starting.

## Options Considered

**Option A: Blocking startup crawl**
The HTTP server does not open until the Drive crawl and catalog population complete.
`OnApplicationBootstrap` blocks; the readiness probe only passes after ingestion finishes.

**Option B: Background crawl (non-blocking)**
The HTTP server opens immediately. Ingestion runs in the background. A "catalog not ready"
state must be handled by all endpoints during the warmup window.

**Option C: Lazy/on-demand crawl**
The catalog is populated on first request. Subsequent requests are fast; the first request
is slow.

## Decision

**Option A: Blocking startup crawl.**

## Rationale

This is a local demo tool, not a production service with availability SLAs.

For a local demo:
- We run `pnpm dev` and wait for the server to be ready
- Blocking startup means: when the port opens, everything works
- Non-blocking startup means: the port opens, then some requests fail or return empty
  while ingestion runs — a worse demo experience

With blocking startup, the startup logs become a progress signal:

```
[Ingestion] Crawling Drive folder 1Z-Bqt69UgrGkwo0ArjHaNrA7uUmUm2r6...
[Ingestion] Discovered 47 JSON files across 12 folders
[Ingestion] Indexed 1,247 movies (23 quarantined) in 4.2s
[App] Listening on http://localhost:3000
```

This is better UX for a demo than an immediately-open port that serves empty results.

**The production counterargument is valid but irrelevant here:**
In production, you'd want non-blocking startup for fast restarts and partial availability.
That's a legitimate trade-off — the system architecture discussion details the rationale for the production
evolution path.

## Trade-offs

**Cost:** Slower time-to-first-request. If Drive is unavailable, the app never starts.  
**Benefit:** No "catalog not ready" state to handle. Clean startup narrative. Better demo UX.

## What would change this decision

A production deployment with uptime requirements, multiple instances, or a Drive
folder large enough that the crawl takes minutes rather than seconds.
In that case: non-blocking startup + readiness probe + periodic refresh.
