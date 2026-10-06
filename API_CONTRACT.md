# Campus Equipment Booking API Contract

## Base URLs

| Environment | Base URL |
| --- | --- |
| Production | `https://midterm-booking-api.wirakorn-6731503120.workers.dev` |
| Local | `http://localhost:8787` |

All paths below are relative to the selected base URL. The API accepts and
returns JSON. Error responses use the following common format:

```json
{
  "error": "Description of the error"
}
```

## Data Models

### Equipment

```json
{
  "id": "eq-1",
  "name": "Projector A",
  "location": "Building 1"
}
```

### Booking

```json
{
  "id": "bk-1720000000000",
  "equipmentId": "eq-1",
  "borrowerName": "Midterm Tester",
  "startAt": "2099-01-10T09:00:00Z",
  "endAt": "2099-01-10T11:00:00Z",
  "purpose": "API verification"
}
```

`startAt` and `endAt` must be valid ISO date-time values, and `startAt` must
be earlier than `endAt`.

## Status Code Summary

| Status | Meaning | Used by |
| --- | --- | --- |
| `200 OK` | Request completed successfully and returns JSON data | `GET /equipment`, `GET /bookings/:id` |
| `201 Created` | Booking was created successfully | `POST /bookings` |
| `400 Bad Request` | JSON is invalid, required fields are missing, or the date range is invalid | `POST /bookings` |
| `404 Not Found` | The requested booking or equipment does not exist | `GET /bookings/:id`, `DELETE /bookings/:id`, `POST /bookings` |
| `409 Conflict` | The requested equipment is already booked during the requested time range | `POST /bookings` |
| `204 No Content` | Booking was deleted successfully; the response has no body | `DELETE /bookings/:id` |

## 1. Get All Equipment

Returns all equipment available for booking.

### Request

```http
GET /equipment
```

No request body is required.

### Successful Response - `200 OK`

```json
[
  {
    "id": "eq-1",
    "name": "Projector A",
    "location": "Building 1"
  },
  {
    "id": "eq-2",
    "name": "Camera B",
    "location": "Building 2"
  }
]
```

## 2. Create a Booking

Creates a booking when the equipment exists and the requested time range does
not overlap an existing booking for that equipment.

### Request

```http
POST /bookings
Content-Type: application/json
```

### Request Body

```json
{
  "equipmentId": "eq-1",
  "borrowerName": "Midterm Tester",
  "startAt": "2099-01-10T09:00:00Z",
  "endAt": "2099-01-10T11:00:00Z",
  "purpose": "API verification"
}
```

All request fields are required:

| Field | Type | Description |
| --- | --- | --- |
| `equipmentId` | `string` | ID of an existing equipment record |
| `borrowerName` | `string` | Name of the person making the booking |
| `startAt` | `string` | ISO start date-time |
| `endAt` | `string` | ISO end date-time after `startAt` |
| `purpose` | `string` | Reason for the booking |

### Successful Response - `201 Created`

The API generates the booking `id` and returns the complete created booking.

```json
{
  "id": "bk-1720000000000",
  "equipmentId": "eq-1",
  "borrowerName": "Midterm Tester",
  "startAt": "2099-01-10T09:00:00Z",
  "endAt": "2099-01-10T11:00:00Z",
  "purpose": "API verification"
}
```

### Error Response - `400 Bad Request`

Returned for malformed JSON, missing required fields, invalid ISO dates, or a
date range where `startAt` is not earlier than `endAt`.

Malformed JSON or an invalid JSON request:

```json
{
  "error": "Invalid JSON request format"
}
```

Missing fields:

```json
{
  "error": "Missing required fields"
}
```

Invalid date range:

```json
{
  "error": "startAt must be before endAt and valid ISO date"
}
```

### Error Response - `404 Not Found`

Returned when `equipmentId` does not identify an existing equipment record.

```json
{
  "error": "Equipment not found"
}
```

### Error Response - `409 Conflict`

Returned when another booking for the same equipment overlaps the requested
time range. The overlap rule is:

```text
requested startAt < existing endAt
AND
requested endAt > existing startAt
```

```json
{
  "error": "Equipment is already booked for the selected time range"
}
```

## 3. Get a Booking by ID

Returns one booking identified by its booking ID.

### Request

```http
GET /bookings/:id
```

Example:

```http
GET /bookings/bk-1720000000000
```

### Successful Response - `200 OK`

```json
{
  "id": "bk-1720000000000",
  "equipmentId": "eq-1",
  "borrowerName": "Midterm Tester",
  "startAt": "2099-01-10T09:00:00Z",
  "endAt": "2099-01-10T11:00:00Z",
  "purpose": "API verification"
}
```

### Error Response - `404 Not Found`

Returned when no booking exists with the requested ID.

```json
{
  "error": "Booking not found"
}
```

## 4. Delete a Booking by ID

Deletes one booking identified by its booking ID.

### Request

```http
DELETE /bookings/:id
```

Example:

```http
DELETE /bookings/bk-1720000000000
```

No request body is required.

### Successful Response - `204 No Content`

The booking is deleted successfully. The response has no JSON body.

### Error Response - `404 Not Found`

Returned when no booking exists with the requested ID.

```json
{
  "error": "Booking not found"
}
```

## Example `curl` Requests

The following commands work in Windows Command Prompt after setting the
production base URL:

```cmd
set BASE_URL=https://midterm-booking-api.wirakorn-6731503120.workers.dev
curl -i "%BASE_URL%/equipment"
curl -i -X POST "%BASE_URL%/bookings" -H "Content-Type: application/json" -d "{\"equipmentId\":\"eq-1\",\"borrowerName\":\"Midterm Tester\",\"startAt\":\"2099-01-10T09:00:00Z\",\"endAt\":\"2099-01-10T11:00:00Z\",\"purpose\":\"API verification\"}"
curl -i "%BASE_URL%/bookings/bk-1720000000000"
curl -i -X DELETE "%BASE_URL%/bookings/bk-1720000000000"
```
