# Domain Model

> Defines the canonical `Movie` type and the normalization contract.
> Everything in the system builds on this definition.

---

## Movie

The canonical `Movie` type lives in `packages/types`. It is serializable — safe to
send over GraphQL, consume in the frontend, and persist if needed. It contains no
implementation-specific types.

```typescript
// packages/types/src/movie.ts
interface Movie {
  id: string               // Drive file ID (primary) or UUID for manually added movies
  title: string            // required — movie is unsearchable without it
  rating: number           // required — movie can't participate in ranking or average
  genres: string[]         // optional — empty array if not present
  year: number | null      // optional — excluded from year groupings if null
  description: string | null
  source: 'drive' | 'manual'
}
```

## MovieRecord (internal, backend only)

`MovieRecord` extends `Movie` with a derived `genreSet` used by `CatalogService`
for O(1) genre lookups. It never leaves the backend — not sent over GraphQL,
not in the shared types package.

```typescript
// packages/backend/src/catalog/movie-record.ts
interface MovieRecord extends Movie {
  genreSet: Set<string>    // derived at normalization, O(1) lookup, not serializable
}
```

`genreSet` is computed once during normalization:
```typescript
genreSet: new Set(genres)  // O(g), paid once at ingestion time
```

At this scale — genres per movie bounded by a small constant — both are fast in practice.
They are not the same kind of O(1) though: Set.has() is a hard guarantee (one hash lookup
regardless of collection size); array.includes() over a bounded array is O(1) only by
assumption about the data. At millions of records the constant factor difference (up to 20x
per scan iteration) is meaningful in practice, though by that point the O(n) scan itself is
the primary concern and you'd address the architecture before the micro-optimisation.

The Set is preferred for two reasons: semantic fit (membership testing is a Set operation,
not an array operation) and defensive guarantee (if a poorly-normalised file produces a movie
with many genres, Set.has() remains O(1) whereas array.includes() degrades with g).

### Field rules

| Field | Required | Quarantine if absent? | Notes |
|---|---|---|---|
| `title` | Yes | Yes | No title = unsearchable. File is quarantined. |
| `rating` | Yes | Yes | No rating = can't rank or average. File is quarantined. |
| `genres` | No | No | Empty array if absent. Movie still participates in search and year views. |
| `year` | No | No | Null if absent. Movie excluded from byYear grouping only. |
| `description` | No | No | Null if absent. |

### ID strategy

- **Drive-sourced movies:** `id` = Drive file ID. Stable across restarts if Drive data hasn't changed.
- **Manually added movies:** `id` = UUID generated at add time. Lost on restart (in-memory only).

---

## Normalization Contract

The normalizer receives `unknown` input (raw JSON from Drive) and produces either
a valid `Movie` or `null` (with a quarantine entry).

```typescript
type NormalizeResult =
  | { ok: true; movie: Movie }
  | { ok: false; reason: QuarantineReason }

type QuarantineReason =
  | 'missing_title'
  | 'missing_rating'
  | 'invalid_rating_type'
  | 'invalid_json'
  | 'parse_error'
```

### Field extraction — candidate lists

The raw JSON schema varies across files. The normalizer tries each candidate
in order and takes the first non-null value.

| Field | Candidates tried in order |
|---|---|
| `title` | `title`, `name`, `movie_title`, `film_title`, `Title` |
| `rating` | `rating`, `score`, `vote_average`, `imdb_rating`, `Rating` |
| `genres` | `genres`, `genre`, `categories`, `category` |
| `year` | `year`, `release_year`, `releaseYear`, `release_date` |
| `id` | `id`, `movie_id`, `imdb_id` → fallback to Drive file ID |

### Type coercions

| Field | Input variations | Normalized to |
|---|---|---|
| `genres` | `string` → `"Action, Drama"` | Split on `,`, trim, deduplicate |
| `genres` | `string[]` | Deduplicate |
| `year` | `"2019-03-15"` | `parseInt(value.slice(0, 4))` |
| `year` | `number` | Direct use |
| `rating` | `string` → `"8.5"` | `parseFloat(value)` |
| `rating` | `number` | Direct use |

### Folder path as fallback signal

If `genres` or `year` cannot be extracted from the JSON, the normalizer falls back
to the Drive folder path. A file at `Action/2019/movie.json` yields:
- `genres: ['Action']` (if not present in JSON)
- `year: 2019` (if not present in JSON)

JSON fields always take priority over path inference.

### Rating scale assumption

All ratings are assumed to be on the same scale. No scale detection or normalization
is performed. If the source data mixes scales (e.g., 0-5 and 0-10), the average rating
will be misleading. This is documented as a known assumption; the normalization layer
is the right place to add scale detection if the data warrants it.

---

## CatalogStats

Pre-computed aggregate views maintained by `CatalogService`.
Updated incrementally on every `addMovie`.

```typescript
interface CatalogStats {
  totalCount: number
  ratingSum: number        // with ratedCount, used to compute average
  ratedCount: number
  genreCounts: Map<string, number>
  byYear: Map<number, Movie[]>
  byRating: Movie[]        // sorted descending by rating
  topGenres: GenreCount[]  // top 5, re-derived from genreCounts on each update
}

interface GenreCount {
  genre: string
  count: number
}
```

---

## QuarantinedFile

```typescript
interface QuarantinedFile {
  driveFileId: string
  folderPath: string[]
  reason: QuarantineReason
  rawSnippet: string   // first 200 chars of raw content for debugging
  timestamp: Date
}
```
