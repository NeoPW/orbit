# Spec Delta

## MODIFIED Requirements

### Requirement: Record identity and timestamps
Every record SHALL have a client-generated UUID `id`, a `created_at` and `updated_at` timestamp in UTC, and a nullable `deleted_at`. The `id` SHALL be a random UUID v4, except for new habit checks and weekly reviews, whose `id` SHALL be a UUID v5 derived from their natural key (habit and date, week start). Creating a record SHALL set `created_at` and `updated_at` to the current time; every update SHALL set `updated_at` to the current time.

#### Scenario: Create sets identity and timestamps
- **WHEN** a record is created
- **THEN** it has a new UUID v4 `id`, `created_at` equals `updated_at`, both are UTC, and `deleted_at` is empty

#### Scenario: Update bumps updated_at
- **WHEN** an existing record is updated
- **THEN** its `updated_at` is later than before and its `created_at` is unchanged

#### Scenario: Deterministic habit check ID
- **WHEN** the same habit is checked for the same date on two devices
- **THEN** both checks get the same `id`
