# ADR-002: GraphQL over REST

**Status:** Accepted  
**Date:** 2026-04

---

## Context

The spec serves two user types with different needs: non-technical users via a UI, and
technical users integrating programmatically. The spec explicitly says "consider building
a robust API layer" and lists a filter endpoint with multiple composable parameters.

## Options Considered

**Option A: GraphQL**
Single endpoint, schema-driven, consumers request exactly the fields they need.
Composable queries and mutations. First-class NestJS support via `@nestjs/graphql`.

**Option B: REST**
Multiple endpoints, HTTP verbs, simpler mental model. More familiar to some consumers.

## Decision

**GraphQL.**

## Rationale

Three concrete arguments:

**1. Implementation cost is equivalent in NestJS.**
Whether writing controller methods or resolvers, the code volume is similar.
The framework abstracts the difference. This removes "effort" as a reason to choose REST.

**2. The filter requirement maps naturally to a typed input.**
`query movies(filter: MovieFilter)` with optional `genre`, `minRating`, `year` fields
is cleaner than `GET /movies?genre=X&minRating=Y&year=Z`. The schema enforces types;
`class-validator` on the input DTO handles validation; the resolver receives typed,
validated arguments. In REST, query param coercion and validation require explicit middleware.

**3. The schema is the contract.**
Technical users get a self-documenting API. The schema describes every query,
mutation, type, and input. No Swagger file to maintain separately.

## Trade-offs

**Cost:** GraphQL errors return HTTP 200 with an `errors` array — HTTP status codes
behave differently than REST consumers expect. Transport-level errors (e.g., rate limiting)
still use HTTP codes; domain errors surface in the response body.

**Benefit:** Flexible, typed, self-documenting. The UI and any technical integrations
share one schema and one endpoint.

## What would change this decision

If technical consumers were exclusively webhook-driven or required strict HTTP semantics
for error handling, REST would be more appropriate. For a query-and-mutation workload
with composable filters, GraphQL is the natural fit.
