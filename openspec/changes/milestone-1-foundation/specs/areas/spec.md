# Spec Delta

## Purpose

Lets the user maintain the list of life areas (such as Job, Personal, Sport, Uni) that projects are grouped by and that the backlog can be filtered by.

## ADDED Requirements

### Requirement: Area list
The app SHALL provide an Areas screen, reachable from the Plan tab, that lists all areas in their sort order, each with its name and color.

#### Scenario: Open areas
- **WHEN** the user opens Areas from the Plan tab
- **THEN** all non-deleted areas are listed in sort order with their color

### Requirement: Create area
The user SHALL be able to create an area with a name and a color chosen from a fixed palette. The name is required, is trimmed, and SHALL be unique among areas (case-insensitive). New areas are added at the end of the list.

#### Scenario: Create valid area
- **WHEN** the user creates an area named "Family" with a color
- **THEN** "Family" appears at the end of the area list with that color

#### Scenario: Empty name
- **WHEN** the user tries to save an area with an empty or whitespace-only name
- **THEN** the area is not saved and the name field shows an error

#### Scenario: Duplicate name
- **WHEN** the user tries to save an area named "sport" while an area "Sport" exists
- **THEN** the area is not saved and the name field shows that the name is already used

### Requirement: Edit area
The user SHALL be able to change an area's name and color, with the same validation as on creation. Changes SHALL be visible everywhere the area is shown.

#### Scenario: Rename area
- **WHEN** the user renames "Uni" to "University"
- **THEN** projects in that area show "University"

### Requirement: Delete area
The user SHALL be able to delete an area after confirming. Projects in a deleted area SHALL keep existing without an area.

#### Scenario: Confirm delete
- **WHEN** the user deletes the area "Sport" and confirms
- **THEN** "Sport" is removed from the list and its projects show no area

#### Scenario: Cancel delete
- **WHEN** the user starts deleting an area and cancels the confirmation
- **THEN** the area is unchanged
