# API Contract — GraphQL Schema

> Defines all queries, mutations, types, and inputs.
> This schema is the contract between backend and frontend.
> Neither side should be implemented before this document is stable.

---

## Schema

```graphql
# ─── Types ───────────────────────────────────────────────────────────────────

type Movie {
  id: String!
  title: String!
  rating: Float!
  genres: [String!]!
  year: Int
  description: String
  source: MovieSource!
}

enum MovieSource {
  DRIVE
  MANUAL
}

type GenreCount {
  genre: String!
  count: Int!
}

type YearGroup {
  year: Int!
  count: Int!
  movies: [Movie!]!
}

type CatalogStats {
  totalCount: Int!
  averageRating: Float!
  topGenres: [GenreCount!]!
  byYear: [YearGroup!]!
}

type MovieConnection {
  items: [Movie!]!
  total: Int!
}

type QuarantineSummary {
  total: Int!
  byReason: [QuarantineReasonCount!]!
}

type QuarantineReasonCount {
  reason: String!
  count: Int!
}

# ─── Inputs ──────────────────────────────────────────────────────────────────

input MovieFilter {
  q: String          # title substring search
  genre: String      # exact genre match
  minRating: Float   # inclusive lower bound
  year: Int          # exact year match
}

input MovieSortInput {
  field: MovieSortField!
  direction: SortDirection!
}

enum MovieSortField {
  RATING
  YEAR
  TITLE
}

enum SortDirection {
  ASC
  DESC
}

input AddMovieInput {
  title: String!
  rating: Float!
  genres: [String!]
  year: Int
  description: String
}

# ─── Queries ─────────────────────────────────────────────────────────────────

type Query {
  # Search and filter movies
  # All filter fields are optional and composable
  movies(
    filter: MovieFilter
    sort: MovieSortInput
    limit: Int
    offset: Int
  ): MovieConnection!

  # Get a single movie by ID
  movie(id: String!): Movie

  # Aggregate stats (top genres, average rating, total count, by year)
  stats: CatalogStats!

  # Movies sorted by rating descending
  # Default limit: 10
  topRated(limit: Int): [Movie!]!

  # Summary of files that failed normalization
  quarantineSummary: QuarantineSummary!
}

# ─── Mutations ───────────────────────────────────────────────────────────────

type Mutation {
  # Add a movie to the in-memory catalog (not to Drive)
  addMovie(input: AddMovieInput!): Movie!

  # Trigger a manual re-ingestion from Drive
  reloadCatalog: CatalogStats!
}
```

---

## Query Examples

### Get stats dashboard data
```graphql
query Stats {
  stats {
    totalCount
    averageRating
    topGenres {
      genre
      count
    }
    byYear {
      year
      count
    }
  }
}
```

### Search by title
```graphql
query Search($q: String!) {
  movies(filter: { q: $q }) {
    items {
      id
      title
      rating
      genres
      year
    }
    total
  }
}
```

### Technical user filter (all params optional, composable)
```graphql
query Filter($filter: MovieFilter!) {
  movies(filter: $filter, sort: { field: RATING, direction: DESC }) {
    items {
      id
      title
      rating
      genres
      year
    }
    total
  }
}
# Variables: { "filter": { "genre": "Action", "minRating": 7.5, "year": 2022 } }
```

### Top-rated
```graphql
query TopRated {
  topRated(limit: 10) {
    id
    title
    rating
  }
}
```

### Add a movie
```graphql
mutation AddMovie($input: AddMovieInput!) {
  addMovie(input: $input) {
    id
    title
    rating
    genres
    year
    source
  }
}
# Variables: { "input": { "title": "Inception", "rating": 8.8, "genres": ["Sci-Fi"], "year": 2010 } }
```

---

## Validation Rules

Applied via `class-validator` on input DTOs before resolvers run.

| Field | Rule |
|---|---|
| `AddMovieInput.title` | Non-empty string |
| `AddMovieInput.rating` | Float, 0–10 inclusive |
| `AddMovieInput.genres` | Array of non-empty strings, if provided |
| `AddMovieInput.year` | Integer, 1888–current year + 5, if provided |
| `MovieFilter.minRating` | Float, 0–10 inclusive, if provided |
| `MovieFilter.year` | Integer, 1888–current year + 5, if provided |
| `movies.limit` | Integer, 1–1000, if provided |
| `movies.offset` | Non-negative integer, if provided |

---

## Error Handling in GraphQL

Errors surface in the `errors` array of the response, not via HTTP status codes.
HTTP 200 is returned for all domain errors.

| Scenario | GraphQL error code |
|---|---|
| Validation failure | `BAD_USER_INPUT` |
| Movie not found | `NOT_FOUND` |
| Catalog not ready | `SERVICE_UNAVAILABLE` |
| Drive API failure | `INTERNAL_SERVER_ERROR` (with sanitized message) |
