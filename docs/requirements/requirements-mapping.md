# Requirements Mapping

> Audit of the technical assessment spec against implementation components.

---

## Feature Requirements

### Non-Technical User Features

| # | Requirement | Component | Notes / Ambiguities |
|---|---|---|---|
| 1 | Search for a movie by title and view its metadata | `CatalogService.search()` → GraphQL `query movies(q)` → Frontend search UI | Spec doesn't define "search" — substring match assumed. Exact match also supported via pre-built title map. |
| 2 | Top 5 genres by quantity | `CatalogService.stats.topGenres` → GraphQL `query stats` → Frontend stats panel | A movie with multiple genres counts toward each genre it belongs to. Pre-computed at ingestion. |
| 3 | Average rating | `CatalogService.stats.averageRating` → GraphQL `query stats` | Maintained as running sum + count, not re-computed per request. Movies without a rating excluded from average. |
| 4 | Total movie count | `CatalogService.stats.totalCount` → GraphQL `query stats` | Count of successfully ingested movies. Quarantined files not counted. |
| 5 | Count and list movies categorized by year | `CatalogService.stats.byYear` → GraphQL `query stats` | Movies without a year are excluded from year groupings but remain in the catalog. |
| 6 | Top-rated movies, displayed in order upon each click | `CatalogService.getTopRated()` → GraphQL `query topRated(limit)` → Frontend top-rated section | "Upon each click" interpreted as: returns the sorted list on demand, not a rotating/random result. Pre-sorted at ingestion, re-sorted on each add. |
| 7 | Add a new movie to the system (not Google Drive) | GraphQL `mutation addMovie(input)` → `CatalogService.add()` | In-memory only. Not persisted across restarts. All stats and views must reflect the addition immediately. |

### Technical User Features

| # | Requirement | Component | Notes / Ambiguities |
|---|---|---|---|
| 8 | Filter by genre, minimum rating, and year | GraphQL `query movies(filter)` with `genre`, `minRating`, `year` args | Filters are optional and composable — any combination valid. Spec says "consider building a robust API layer." |
| 9 | Robust API layer | GraphQL schema with typed inputs, validation via `class-validator`, response DTOs | GraphQL chosen over REST — see ADR-002. |

---

## Technical Constraints

| Constraint | Implication |
|---|---|
| No external databases — in-memory only | All state lives in `CatalogService`. No SQLite, Redis, etc. |
| Source data is `.json` files in nested Google Drive folders | Requires recursive Drive traversal. Folder structure varies — can't assume depth or naming. |
| JSON schema varies across files | Normalization layer required. Multiple field name candidates per field. Quarantine invalid files. |
| GCP project + OAuth2 required | `AuthModule` manages token lifecycle. Credentials stored locally, never committed. |
| Must run locally for the interview | Boot time matters. Startup output must be informative. |
| Folder ID: `1Z-Bqt69UgrGkwo0ArjHaNrA7uUmUm2r6` | Hardcoded as default env var `DRIVE_ROOT_FOLDER_ID`. |

---

## Ambiguities and Assumptions

| Ambiguity | Assumption Made | Rationale |
|---|---|---|
| "Search" — exact, prefix, or substring? | Substring (`title.includes(query)`) | Most natural user expectation for a search box |
| "Top-rated movies" — top N or all sorted? | Returns all sorted, optional `limit` param | Caller decides how many to display |
| "Upon each click" — does the result rotate or sort? | Always returns the same sorted order | "In order" implies deterministic sort, not random |
| Movies with null/missing rating | Excluded from average and top-rated | Can't meaningfully rank or average an absent value |
| Movies with null/missing year | Included in catalog, excluded from byYear grouping | Year is useful metadata but not required to be a valid movie |
| Movies with null/missing genres | Included in catalog, excluded from genre counts | Same reasoning as year |
| "Add a new movie to the system" — what fields are required? | `title` and `rating` required; `genres`, `year` optional | Minimum viable movie: searchable and rankable |
| What counts as a "duplicate" on add? | No deduplication on add — caller's responsibility | Keeping it simple; out of scope per spec |
| Drive folder structure — how nested? | Assume arbitrary depth, traverse fully | Spec says "deeply nested," BFS handles any depth |
| JSON schema variation — how extreme? | Field name aliases, type coercion, missing optional fields | See domain model for full normalization contract |

