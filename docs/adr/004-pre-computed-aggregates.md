# ADR-004: Pre-Computed Aggregates at Ingestion Time

**Status:** Accepted  
**Date:** 2026-04

---

## Context

Several features require aggregate views of the catalog: top 5 genres by count,
average rating, total count, movies grouped by year, movies sorted by rating.
These can be computed at ingestion time (once) or at request time (per request).

## Options Considered

**Option A: Pre-compute at ingestion**
Aggregates are built once when the catalog is populated and updated incrementally
on each `addMovie`. Stats endpoints read from pre-computed structures in O(1).

**Option B: Compute at request time**
Each stats request scans the full movie list and computes the result.

## Decision

**Option A: Pre-compute at ingestion.**

## Rationale

At thousands of records, an O(n) scan takes under 2ms — so this decision is less
about performance and more about architectural clarity.

Pre-computing aggregates enforces a clean separation:
- **Ingestion time:** produce the catalog and all derived views
- **Request time:** read from pre-computed structures, serve immediately

This separation makes each layer easier to reason about and test independently.
The stats endpoint doesn't need to know anything about the movie data structure —
it reads from a `CatalogStats` object that `CatalogService` maintains.

The `CatalogStats` structure maintained:
- `totalCount: number`
- `ratingSum: number` + `ratedCount: number` (average computed from these)
- `genreCounts: Map<string, number>`
- `byYear: Map<number, Movie[]>`
- `byRating: Movie[]` (pre-sorted descending)

On `addMovie`, each of these is updated incrementally in O(1) or O(log n) time.

## Trade-offs

**Cost:** Slightly more memory (duplicated views of the data). More state to keep
consistent on writes.  
**Benefit:** O(1) stats reads. Clean ingestion/serving boundary. Easier to test.

## What would change this decision

If writes were extremely frequent and memory was constrained, computing on demand
avoids the maintenance burden of keeping multiple derived structures in sync.
At this scale and write frequency, pre-computing is clearly the right call.
