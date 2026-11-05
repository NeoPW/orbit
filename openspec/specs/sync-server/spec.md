# sync-server Specification

## Purpose

The sync server holds the server copy of the user's data so that devices can exchange their changes. It stores rows per table, enforces last-write-wins, lets only the user's own devices in, and also serves the browser build.

## Requirements

### Requirement: Device tokens
Every request to the sync API SHALL carry a device token as `Authorization: Bearer <token>`. The server SHALL accept a request only when the token is one of the configured device tokens, and SHALL answer any other request with status 401 without reading or changing data. There SHALL be no accounts and no way to sign up or create a token through the API.

#### Scenario: Missing token
- **WHEN** a pull is requested without an `Authorization` header
- **THEN** the server answers 401 and returns no rows

#### Scenario: Unknown token
- **WHEN** a push is sent with a token that is not configured
- **THEN** the server answers 401 and stores nothing

#### Scenario: Each device has its own token
- **WHEN** the tokens of the desktop and the browser are configured and each sends a request with its own token
- **THEN** both requests are accepted

#### Scenario: Removed device
- **WHEN** the browser's token is removed from the configured tokens
- **THEN** the browser's requests are answered with 401 and the desktop's requests are still accepted

### Requirement: Server tables
The server SHALL hold one table for each table the device syncs (areas, goals, measures, projects, tasks, habits, habit checks, log entries, timers, notes, weekly reviews, review measure snapshots), with the same columns as on the device. Local settings SHALL NOT exist on the server. Rows SHALL come back exactly as they were pushed, including empty values.

#### Scenario: Round trip
- **WHEN** a goal with the color rose and no end date and a measure with step 5 are pushed and then pulled
- **THEN** the pulled goal has the color rose and an empty end date, and the pulled measure has step 5

#### Scenario: Settings are not a server table
- **WHEN** a push contains rows for the table `settings`
- **THEN** the push is refused as containing an unknown table

### Requirement: Rows stored without business rules
The server SHALL store rows as they arrive, in any order, and SHALL NOT check references between rows or apply any rule other than last-write-wins.

#### Scenario: Child before parent
- **WHEN** a task that belongs to a project is pushed before that project
- **THEN** the task is stored, and the project is stored when it is pushed later

### Requirement: Last write wins on push
For each pushed row, the server SHALL store it when it has no row with that `id` in that table, or when the pushed `updated_at` is later than the stored one. Otherwise it SHALL keep the stored row unchanged. The response SHALL report how many rows were stored.

#### Scenario: New row
- **WHEN** a project that the server does not have is pushed
- **THEN** the server stores it

#### Scenario: Newer version
- **WHEN** a project stored with `updated_at` 10:00 is pushed with a new title and `updated_at` 10:05
- **THEN** the server holds the new title

#### Scenario: Older version
- **WHEN** a project stored with `updated_at` 10:05 is pushed with another title and `updated_at` 10:00
- **THEN** the server keeps the title from 10:05 and reports no stored row

#### Scenario: Same version again
- **WHEN** the same version of a row is pushed twice
- **THEN** the second push stores nothing and the row is not returned again by a pull after the first push

### Requirement: Soft deletes are synced
A pushed row with `deleted_at` set SHALL be stored and returned by pulls like any other row. The server SHALL NOT remove rows.

#### Scenario: Deleted task
- **WHEN** a task is pushed with `deleted_at` set and a later `updated_at` than the stored one
- **THEN** a pull returns the task with `deleted_at` set

### Requirement: Push is all or nothing
A push SHALL be refused with status 400, storing nothing, when it names an unknown table, when a row lacks one of its table's columns or has a column the table does not have, when `updated_at` is not a UTC timestamp in the app's format, or when a value is not accepted by its column (such as an empty required title). A push of more than 500 rows SHALL be refused with status 413, storing nothing.

#### Scenario: One invalid row
- **WHEN** a push contains a valid area and a task without `updated_at`
- **THEN** the server answers 400 and stores neither row

#### Scenario: Timestamp in another format
- **WHEN** a push contains an area whose `updated_at` is `2026-11-05 10:00`
- **THEN** the server answers 400 and stores nothing

#### Scenario: Unknown column
- **WHEN** a push contains a project with a column `next_step`
- **THEN** the server answers 400 and stores nothing

#### Scenario: Too many rows
- **WHEN** a push contains 501 rows
- **THEN** the server answers 413 and stores nothing

### Requirement: Pull by cursor
A pull SHALL return, from all tables, the rows stored after the given cursor, oldest first, at most 1000 rows per response, together with a new cursor and whether more rows are waiting. A pull without a cursor SHALL start from the beginning. Pulling again with each returned cursor SHALL return every stored change once.

#### Scenario: Pull everything
- **WHEN** a device pulls without a cursor from a server holding 3 areas and 2 projects, one of them deleted
- **THEN** it gets all 5 rows, a new cursor and no more rows waiting

#### Scenario: Only changes since the cursor
- **WHEN** a device pulls with the cursor from its last pull, after another device pushed a renamed project
- **THEN** it gets only that project, with the new name

#### Scenario: Ignored push is not a change
- **WHEN** a push is ignored because the stored row is newer, and a device then pulls with its last cursor
- **THEN** the pull returns no rows

#### Scenario: Several pages
- **WHEN** the server holds 2500 rows and a device pulls without a cursor and then with each returned cursor
- **THEN** it gets 1000, 1000 and 500 rows, more rows are waiting after the first two pulls and not after the third, and no row comes twice

### Requirement: Status
The server SHALL report whether it holds any rows (deleted rows included) and the schema version it expects. A device SHALL be able to use the status request to check its token.

#### Scenario: Empty server
- **WHEN** the status is requested from a server that has never received a row
- **THEN** it reports no data and its schema version

#### Scenario: Server with data
- **WHEN** the status is requested after one area was pushed and then pushed again as deleted
- **THEN** it reports that it holds data

### Requirement: Same schema version only
Every push and pull SHALL state the device's schema version. The server SHALL refuse a push or pull whose schema version differs from its own with status 409, storing and returning nothing, so that a device with fewer or more columns cannot overwrite or lose data.

#### Scenario: Older app
- **WHEN** a device with schema version 1 pushes to a server with schema version 2
- **THEN** the server answers 409 and stores nothing

#### Scenario: Matching version
- **WHEN** a device with the server's schema version pushes
- **THEN** the push is processed

### Requirement: Access from the apps
The sync API SHALL accept requests from any web origin, so the desktop app, the development server and the browser build can all reach it. Requests from other origins SHALL still need a valid device token.

#### Scenario: Desktop app
- **WHEN** the desktop app sends a pull with a valid token from its own origin
- **THEN** the browser engine allows the request and the app receives the rows

#### Scenario: Other origin without token
- **WHEN** a page on another origin sends a pull without a token
- **THEN** the server answers 401

### Requirement: Serving the browser build
The server SHALL serve the browser build at its address. Paths under `/api/` SHALL be the sync API. Any other path that is not a file of the build SHALL return the app's start page, and serving the app SHALL NOT need a token.

#### Scenario: Open the app
- **WHEN** the server's address is opened in Chrome or Firefox
- **THEN** the browser build starts with the title "Orbit"

#### Scenario: Deep link
- **WHEN** a path such as `/plan` is opened directly
- **THEN** the browser build starts

#### Scenario: Unknown API path
- **WHEN** an unknown path under `/api/` is requested with a valid token
- **THEN** the server answers 404 instead of the start page
