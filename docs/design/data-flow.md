# Data Flow

> End-to-end path data takes through the system, with error boundaries at each layer.

---

## Startup — Drive Ingestion

```
Google Drive API
      │
      │  OAuth2 token (managed by AuthModule)
      ▼
DriveClient.crawl(rootFolderId)
      │
      │  Parallel BFS — fan out each folder level with Promise.all
      │  Collect all .json file IDs
      ▼
DriveClient.fetchFile(fileId) × N  ←── batched, not serial
      │
      │  raw: unknown  (parsed JSON or parse error)
      ▼
Normalizer.normalize(raw, { driveFileId, folderPath })
      │
      ├── ok: true  ──────────────────────────────────────────────────────────┐
      │   movie: Movie                                                         │
      │                                                                        ▼
      └── ok: false                                                    CatalogService.populate(movies[])
          reason: QuarantineReason                                             │
          → QuarantineLog.append(entry)                                        │  Build primary store + all
                                                                               │  derived indexes in one pass
                                                                               ▼
                                                                       HTTP server opens
                                                                       (readiness probe passes)
```

---

## Request — GraphQL Query

```
Client (browser or API consumer)
      │
      │  HTTP POST /graphql
      ▼
NestJS HTTP layer
      │
      ▼
@nestjs/graphql — parses operation, validates against schema
      │
      ▼
ValidationPipe — validates input DTOs via class-validator
      │
      ├── invalid  ──────────────────────────────────────────────────────────┐
      │                                                                       │
      └── valid                                                     GraphQL errors array
              │                                                     { code: 'BAD_USER_INPUT' }
              ▼
        Resolver method
              │
              ▼
        CatalogService (read from pre-computed structures)
              │
              ▼
        Response DTO (class-transformer shapes output)
              │
              ▼
        HTTP 200 { data: { ... } }
```

---

## Request — addMovie Mutation

```
Client
      │
      │  mutation addMovie(input: AddMovieInput!)
      ▼
ValidationPipe
      │
      ▼
MoviesResolver.addMovie(input)
      │
      ▼
Normalizer.normalizeManualInput(input)   ←── same normalizer, different path
      │                                       (input is already typed, no field aliases needed)
      ▼
CatalogService.add(movie)
      │
      ├── updates primary Map
      ├── updates totalCount
      ├── updates ratingSum + ratedCount
      ├── updates genreCounts
      ├── updates byYear
      └── re-sorts byRating array
      │
      ▼
returns Movie (immediately reflected in all subsequent queries)
```

---

## Error Boundaries

| Layer | What can fail | Behavior |
|---|---|---|
| OAuth2 token fetch | Network error, invalid credentials | App fails to start. Error logged. |
| Drive folder crawl | Rate limit, network error, invalid folder ID | App fails to start. Error logged with folder ID. |
| Drive file fetch | Individual file unavailable | File skipped. Logged as quarantine reason `fetch_error`. |
| JSON parse | File is not valid JSON | File quarantined. Reason: `invalid_json`. |
| Normalization | Missing required fields, type errors | File quarantined. Reason: specific `QuarantineReason`. |
| Catalog population | (Cannot fail — normalizer guarantees valid input) | — |
| GraphQL validation | Invalid input from client | HTTP 200, `errors` array, code `BAD_USER_INPUT`. |
| Resolver | Unexpected runtime error | HTTP 200, `errors` array, code `INTERNAL_SERVER_ERROR`. Message sanitized. |

---

## Folder Path as Signal

The `folderPath` passed to the normalizer is used as a fallback for `genre` and `year`
when they cannot be extracted from the JSON:

```
Drive path: /Action/2019/some_movie.json
  → folderPath: ['Action', '2019']
  → genre fallback: 'Action'
  → year fallback: 2019
```

Path inference is lower priority than JSON content. If both exist, JSON wins.
