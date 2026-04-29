# Test Strategy

> What gets tested, how, and why.

---

## Philosophy

Test the parts of the system where logic lives and where mistakes are expensive.
Don't test framework wiring, configuration, or things that would only break if
NestJS itself broke.

The two layers worth testing carefully:
1. **Normalization** — logic is complex, input is adversarial, mistakes silently corrupt the catalog
2. **CatalogService** — aggregates must stay consistent across all operations

Everything else (resolvers, DTOs) can be covered by integration tests or left to
type-checking, which is already doing significant work.

---

## Unit Tests

### Normalizer (`packages/backend/src/ingestion/normalizer.spec.ts`)

The normalizer is the most important unit to test. It receives `unknown` input
and must produce correct output or a specific quarantine reason.

Key test cases:
- Valid input with all fields present → `{ ok: true, movie }`
- Valid input with field name aliases (`name` instead of `title`) → normalizes correctly
- Valid input with string rating → coerces to number
- Valid input with string genres → splits and trims
- Valid input with date string year → extracts year integer
- Missing title → `{ ok: false, reason: 'missing_title' }`
- Missing rating → `{ ok: false, reason: 'missing_rating' }`
- Rating as non-numeric string → `{ ok: false, reason: 'invalid_rating_type' }`
- Null input → `{ ok: false, reason: 'parse_error' }`
- Folder path fallback for genre → uses path when JSON has no genre
- Folder path fallback for year → uses path when JSON has no year
- Genre deduplication → `["Action", "Action"]` normalizes to `["Action"]`

### CatalogService (`packages/backend/src/catalog/catalog.service.spec.ts`)

Test that aggregates stay consistent as movies are added.

Key test cases:
- `populate([])` → all stats are zero/empty
- `populate(movies)` → totalCount, averageRating, topGenres, byYear all correct
- `add(movie)` → totalCount increments
- `add(movie)` → averageRating updates correctly (including first movie edge case)
- `add(movie)` → genreCounts update for each genre on the new movie
- `add(movie)` → byYear map updates correctly
- `add(movie)` → byRating remains sorted descending
- `getTopRated(5)` → returns top 5 by rating
- `search('inception')` → returns movies whose title includes the query (case-insensitive)
- `filter({ genre: 'Action', minRating: 7 })` → correct subset

---

## Integration Tests

### Ingestion with mock Drive client (`packages/backend/src/ingestion/ingestion.spec.ts`)

Test the full ingestion pipeline without hitting Drive.

The `DriveClient` interface is injected via DI. In tests, a `MockDriveClient` is
registered in the test module that returns fixture JSON files from a local directory.

Key test cases:
- Crawl a fixture folder tree → correct movies indexed
- Fixture includes invalid files → correct quarantine count and reasons
- Fixture includes files missing required fields → quarantined, valid files still indexed
- Folder path used as fallback → genre/year extracted from path when absent from JSON

```typescript
// Test module setup pattern
const module = await Test.createTestingModule({
  imports: [IngestionModule],
})
  .overrideProvider(DriveClient)
  .useClass(MockDriveClient)
  .compile()
```

---

## What is NOT tested

- **GraphQL resolvers** — they're thin wrappers over CatalogService. CatalogService
  is tested; the resolver just delegates. Type-checking covers the DTO shapes.
- **AuthModule** — OAuth2 token lifecycle is Drive SDK behavior, not our logic.
- **Frontend components** — out of scope for this assessment's testing bar.
- **End-to-end with real Drive** — requires credentials. Manual verification only.

---

## Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov
```

Coverage targets (enforced in CI if configured):
- Normalizer: 100% — adversarial input, no room for surprise
- CatalogService: 90%+ — all aggregate operations covered
