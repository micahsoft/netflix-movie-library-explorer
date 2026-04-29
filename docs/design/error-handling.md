# Error Handling Strategy

> Decisions about failure modes at each layer of the system.
> Made upfront, not retrofitted.

---

## Principles

1. **Fail loudly at startup, gracefully at runtime.**
   If Drive is unreachable or credentials are invalid, the app should not start.
   If an individual file fails normalization, the app should continue with the rest.

2. **Never lose a valid movie because of an invalid neighbor.**
   File-level errors are isolated. One bad JSON file does not abort the crawl.

3. **Make failure visible without being noisy.**
   Quarantined files are logged and queryable via `quarantineSummary`. They do not
   generate a log line per file — they generate a summary at the end of ingestion.

4. **Don't expose internal errors to clients.**
   Drive API errors, unexpected runtime exceptions, and stack traces are logged
   server-side but never returned to the client. GraphQL errors include a
   sanitized message only.

---

## Startup Failures — Fatal

These abort startup and exit the process.

| Scenario | Behavior |
|---|---|
| `credentials.json` missing or malformed | Log path and format error. Exit 1. |
| OAuth2 token exchange fails | Log Drive API error. Exit 1. |
| Root folder ID not found in Drive | Log folder ID. Exit 1. |
| Folder crawl returns 0 files | Log warning, continue (empty catalog is valid). |

---

## Ingestion Failures — Non-Fatal

These are isolated to the affected file. Ingestion continues.

| Scenario | Quarantine Reason | Logged? |
|---|---|---|
| File fetch fails (network/auth) | `fetch_error` | Yes — file ID and HTTP status |
| File content is not valid JSON | `invalid_json` | Yes — file ID |
| `title` field absent or empty | `missing_title` | Yes — file ID, folder path |
| `rating` field absent | `missing_rating` | Yes — file ID, folder path |
| `rating` field present but not a number | `invalid_rating_type` | Yes — file ID, raw value |
| Any unexpected parse error | `parse_error` | Yes — file ID, error message |

**End of ingestion summary log:**
```
[Ingestion] Complete. 1,247 indexed / 23 quarantined.
[Ingestion] Quarantine breakdown: missing_title (12), missing_rating (8), invalid_json (3)
[Ingestion] Run `query { quarantineSummary }` for details.
```

---

## Runtime Failures — Request Handling

| Scenario | Client sees | Server logs |
|---|---|---|
| Invalid input (validation) | `BAD_USER_INPUT` with field-level message | No (expected) |
| Movie not found by ID | `NOT_FOUND` | No (expected) |
| Catalog not ready (race condition) | `SERVICE_UNAVAILABLE` | Yes — timing info |
| Unexpected exception in resolver | `INTERNAL_SERVER_ERROR` — generic message | Yes — full stack trace |
| Drive API error during `reloadCatalog` | `INTERNAL_SERVER_ERROR` — sanitized | Yes — Drive error |

---

## The Quarantine Log

Available at runtime via `query { quarantineSummary }`. Each entry contains:
- Drive file ID
- Folder path
- Quarantine reason
- First 200 characters of raw content (for debugging)
- Timestamp

This makes normalization failures transparent and debuggable without grep-ing logs.

---

## What is NOT handled

- **Persistence across restarts** — in-memory only per spec. Manually added movies
  are lost on restart. This is a known, documented limitation.
- **Concurrent writes** — single-process, Node.js event loop handles one request
  at a time. No race conditions on the in-memory store.
- **Drive rate limiting during normal operation** — ingestion runs once at startup.
  If rate limited mid-crawl, the affected files are logged and skipped.
