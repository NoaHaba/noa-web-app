# API and Database Design

This document describes the database and API design for Parts 1 and 2.

## Part 1 - Tic-Tac-Toe (Misere)

### Database

**Table `games`** - stores completed games for each user.

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | Primary key, generated automatically |
| `owner_id` | `uuid` | Foreign key to `auth.users(id)`, not null |
| `moves` | `jsonb` | Not null, ordered list of moves |
| `result` | `text` | Not null, CHECK: `X`, `O`, or `draw` |
| `created_at` | `timestamptz` | Not null, default current time |

The server checks the moves and calculates the result before saving. It gets `owner_id` from the logged-in user. An index on `owner_id` and `created_at` helps load game history from newest to oldest.

### API

**`POST /api/games`** - Save a completed game.

- **Receives:** `{ moves }`, an array of positions from 0 to 8.
- **Success:** `201` with `{ id, moves, result, created_at }`.
- **Errors:** `400` for invalid moves or an unfinished game, `500` for a database error.
- **Table:** Writes to `games`.
- **Validation:** The server replays all moves using the shared game rules and calculates the result itself.

**`GET /api/games`** - Get the user's game history.

- **Receives:** No body.
- **Success:** `200` with the user's games, newest first.
- **Errors:** `500` for a database error.
- **Table:** Reads from `games`, filtered by the logged-in user's ID.

## Part 2 - NASA Space Pictures

### Database

**Table `nasa_explanations`** - stores one Hebrew explanation per NASA APOD date, shared by all users.

| Column | Type | Rules |
|---|---|---|
| `date` | `date` | Primary key |
| `hebrew_title` | `text` | Not null |
| `hebrew_summary` | `text` | Not null |
| `tags` | `jsonb` | Not null, 1-5 allowed tags checked with Zod |
| `created_at` | `timestamptz` | Not null, default current time |

Allowed tags: `galaxy`, `planet`, `nebula`, `earth`, `sun`.

The date is unique, so each picture has only one saved explanation.

### API

**`GET /api/nasa/pictures`** - Get random NASA pictures.

- **Receives:** Optional `count` parameter (1-20, default 10).
- **Success:** `200` with an array of pictures, including date, title, image URL and explanation.
- **Errors:** `400` for an invalid count, `502` for a bad NASA response, `503` if NASA is unavailable.
- **Tables:** None. The server fetches pictures directly from NASA.

**`POST /api/nasa/explanations`** - Get a Hebrew explanation.

- **Receives:** `{ date }` in `YYYY-MM-DD` format.
- **Success:** `200` with `{ date, hebrew_title, hebrew_summary, tags }`.
- **Errors:** `400` for an invalid date, `404` if NASA has no picture, `502` for an invalid NASA or Gemini response, `503` if an external service is unavailable, `500` for a database error.
- **Table:** Reads and writes `nasa_explanations`.
- **Process:** The server first checks the database. If no explanation exists, it gets the original text from NASA, asks Gemini for a Hebrew title, a simple 2-3 sentence summary and 1-5 allowed tags, validates the JSON with Zod, and saves it.
- **Security:** The browser sends only the date. NASA and Gemini API keys stay on the server.

## Design Trade-off - Caching Gemini Answers

I considered generating a new explanation for every request or saving explanations in the database.

Generating every time is simpler, but it is slower and uses more API requests.

I chose to save explanations by APOD date. This lets users reuse existing answers and reduces unnecessary Gemini calls. The disadvantage is extra database logic. The unique date prevents duplicate records, but simultaneous requests may still need special handling to avoid repeated Gemini calls.

## What changed and why

*To be completed after implementation. The original design will be kept unchanged.*