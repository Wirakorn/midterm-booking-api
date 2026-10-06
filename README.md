# Campus Equipment Booking API

## Executive Summary

The Campus Equipment Booking API is a REST API for viewing campus equipment and
creating, reading, updating, and deleting equipment bookings. It is implemented
with [Hono](https://hono.dev/) and deployed as a
[Cloudflare Worker](https://developers.cloudflare.com/workers/), with
[Cloudflare D1](https://developers.cloudflare.com/d1/) providing the
SQLite-compatible database.

The API validates required fields and ISO date values, verifies that referenced
equipment exists, and prevents overlapping bookings for the same equipment.
Errors are returned as JSON using the `{ "error": "..." }` response shape.

## Base URLs

| Environment | Base URL |
| --- | --- |
| Production | `https://midterm-booking-api.wirakorn-6731503120.workers.dev` |
| Local development | `http://localhost:8787` |

The production URL is the deployed Cloudflare Worker. The local URL is
available after starting Wrangler with `npx wrangler dev` or `npm run dev`.

## Tech Stack

- **Runtime and platform:** Cloudflare Workers
- **Web framework:** Hono
- **Database:** Cloudflare D1 (SQLite)
- **Language:** TypeScript
- **Development and deployment CLI:** Wrangler
- **Testing/verification:** `curl` from Windows Command Prompt (`cmd`)

## API Overview

| Method | Endpoint | Purpose | Success |
| --- | --- | --- | --- |
| `GET` | `/equipment` | List all equipment | `200 OK` |
| `GET` | `/bookings` | List all bookings | `200 OK` |
| `GET` | `/bookings/:id` | Get one booking | `200 OK` |
| `POST` | `/bookings` | Create a booking | `201 Created` |
| `PATCH` | `/bookings/:id` | Update a booking | `200 OK` |
| `DELETE` | `/bookings/:id` | Delete a booking | `204 No Content` |

Booking creation and updates can return `400 Bad Request` for invalid input,
`404 Not Found` when equipment or a booking does not exist, and
`409 Conflict` when the requested time range overlaps an existing booking.

## Database Schema Summary

The schema is defined in [`schema.sql`](./schema.sql). It creates two tables
and inserts the initial equipment records.

### `equipment`

Stores equipment that can be booked.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `TEXT` | Primary key | Equipment identifier, such as `eq-1` |
| `name` | `TEXT` | Not null | Equipment name |
| `location` | `TEXT` | Not null | Campus building or location |

### `bookings`

Stores reservations and links each reservation to one equipment record.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `TEXT` | Primary key | Generated booking identifier |
| `equipmentId` | `TEXT` | Not null, foreign key | References `equipment.id` |
| `borrowerName` | `TEXT` | Not null | Person making the booking |
| `startAt` | `TEXT` | Not null | Booking start as an ISO date-time |
| `endAt` | `TEXT` | Not null | Booking end as an ISO date-time |
| `purpose` | `TEXT` | Not null | Reason for the booking |

An overlap is rejected when the requested interval satisfies
`startAt < existing.endAt` and `endAt > existing.startAt` for the same
equipment. Adjacent bookings that end and start at the same time do not
overlap.

## How to Run Locally

From the project directory:

```cmd
npm install
npx wrangler d1 execute DB --local --file=./schema.sql
npx wrangler dev
```

After Wrangler starts, use `http://localhost:8787` as the local base URL.
The `DB` name in the D1 command is the binding configured in
[`wrangler.jsonc`](./wrangler.jsonc).

The equivalent package scripts are:

```cmd
npm run dev
npm run deploy
```

## How to Deploy to Cloudflare

Authenticate with Wrangler if necessary, then run these commands from the
project directory:

```cmd
npx wrangler d1 create midterm-db
npx wrangler d1 execute midterm-db --remote --file=./schema.sql
npx wrangler deploy
```

If the D1 database is newly created, copy its database ID into the
`database_id` field for the `DB` binding in
[`wrangler.jsonc`](./wrangler.jsonc) before deploying. The current project
configuration uses the database name `midterm-db`.

## Verified Test Cases

The following commands are written for **Windows Command Prompt (`cmd`)**.
Run them in order against the production URL, or replace
`%BASE_URL%` with `http://localhost:8787` after starting the local server.
The backslash-escaped quotes (`\"`) are required for the JSON body in `cmd`.

For convenient local testing, set the base URL first:

```cmd
set BASE_URL=https://midterm-booking-api.wirakorn-6731503120.workers.dev
```

### 1. List equipment - `GET /equipment` - 200 OK

```cmd
curl -i "%BASE_URL%/equipment"
```

Expected result: HTTP `200 OK` with the equipment list, including the seeded
records `eq-1` and `eq-2`.

### 2. Create a booking - `POST /bookings` - 201 Created

```cmd
curl -i -X POST "%BASE_URL%/bookings" -H "Content-Type: application/json" -d "{\"equipmentId\":\"eq-1\",\"borrowerName\":\"Midterm Tester\",\"startAt\":\"2099-01-10T09:00:00Z\",\"endAt\":\"2099-01-10T11:00:00Z\",\"purpose\":\"API verification\"}"
```

Expected result: HTTP `201 Created` with the created booking. The API
generates the booking `id`.

### 3. Overlapping booking - `POST /bookings` - 409 Conflict

Run this after the successful booking above, using the same equipment and an
overlapping time range:

```cmd
curl -i -X POST "%BASE_URL%/bookings" -H "Content-Type: application/json" -d "{\"equipmentId\":\"eq-1\",\"borrowerName\":\"Overlap Tester\",\"startAt\":\"2099-01-10T10:00:00Z\",\"endAt\":\"2099-01-10T12:00:00Z\",\"purpose\":\"Conflict verification\"}"
```

Expected result: HTTP `409 Conflict` with an error stating that the equipment
is already booked for the selected time range.

### 4. Invalid date range - `POST /bookings` - 400 Bad Request

Here, `startAt` is later than `endAt`:

```cmd
curl -i -X POST "%BASE_URL%/bookings" -H "Content-Type: application/json" -d "{\"equipmentId\":\"eq-2\",\"borrowerName\":\"Validation Tester\",\"startAt\":\"2099-02-10T15:00:00Z\",\"endAt\":\"2099-02-10T14:00:00Z\",\"purpose\":\"Validation verification\"}"
```

Expected result: HTTP `400 Bad Request` with an error explaining that
`startAt` must be before `endAt` and must be a valid ISO date.

### 5. Missing booking - `GET /bookings/not-found-id` - 404 Not Found

```cmd
curl -i "%BASE_URL%/bookings/not-found-id"
```

Expected result: HTTP `404 Not Found` with:

```json
{ "error": "Booking not found" }
```

## Deliverables

- [`API_CONTRACT.md`](./API_CONTRACT.md) - API routes, request formats,
  response formats, and status codes
- `QUALITY_GATE_REVIEW.md` - quality-gate
  findings, actions, and evidence
- [`AI_LOG.md`](./AI_LOG.md) - record of significant AI assistance and
  verification
- [`schema.sql`](./schema.sql) - D1 schema and seed equipment data
- `screenshots/` - screenshots supporting the API test
  evidence

## Project Structure

```text
midterm-booking-api/
|-- src/
|   `-- index.ts             Worker entry point and API routes
|-- schema.sql               D1 schema and seed data
|-- wrangler.jsonc           Worker and D1 binding configuration
|-- API_CONTRACT.md          API contract
|-- QUALITY_GATE_REVIEW.md   Quality-gate review record
|-- AI_LOG.md                AI assistance log
`-- screenshots/              Test evidence
```
