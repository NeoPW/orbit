# Spec Delta

## Purpose

Lets the user define time-boxed goals they work toward, link projects, tasks, habits and work to them, track their progress through measures, and see on one page everything that serves a goal.

## ADDED Requirements

### Requirement: Create goal
The user SHALL be able to create a goal with a title, an optional description, a start date, an end date and a color. Title, start date and end date are required; the end date SHALL NOT be before the start date. New goals have status `active` and are added after existing goals.

#### Scenario: Create valid goal
- **WHEN** the user creates a goal "Get fit" from 2026-10-01 to 2026-12-31
- **THEN** the goal is saved with status active and appears in the Plan tab

#### Scenario: Missing title
- **WHEN** the user tries to save a goal without a title
- **THEN** the goal is not saved and the title field shows an error

#### Scenario: End before start
- **WHEN** the user picks an end date earlier than the start date
- **THEN** the goal is not saved and the date fields show an error

### Requirement: Edit goal
The user SHALL be able to edit a goal's title, description, dates, color and status (`active`, `completed`, `archived`), with the same validation as on creation.

#### Scenario: Change end date
- **WHEN** the user changes a goal's end date
- **THEN** the effective deadline of its projects without their own deadline changes accordingly

#### Scenario: Complete goal
- **WHEN** the user sets a goal's status to completed
- **THEN** the goal disappears from the Plan tab's goals section and appears in the Archive

### Requirement: Goal color
The goal form SHALL offer the colors of the space palette, shown as small planets, and "Auto". A goal with "Auto" SHALL get a palette color by its position in the goal order, so neighboring goals differ. The goal's color SHALL be used for its planet and for the progress rings of its measures.

#### Scenario: Pick a color
- **WHEN** the user picks the rose color for "Get fit" and saves
- **THEN** its planet and its measures' progress rings are rose

#### Scenario: Back to Auto
- **WHEN** the user chooses Auto for a goal with its own color and saves
- **THEN** the goal has no own color and uses the palette color of its position

### Requirement: Delete goal together with its measures
The user SHALL be able to delete a goal after confirming. The confirmation SHALL state that its measures (with their count) are deleted as well. Deleting SHALL soft-delete the goal and its measures; projects, tasks and habits linked to the goal SHALL keep existing without the goal link, and log entries SHALL stay.

#### Scenario: Confirmation names measures
- **WHEN** the user starts deleting a goal with 3 measures
- **THEN** the confirmation states that the goal and its 3 measures will be deleted

#### Scenario: Linked projects survive
- **WHEN** the user deletes a goal that an active project serves, and confirms
- **THEN** the goal and its measures are gone and the project appears under "Projects without a goal"

#### Scenario: Assigned task survives
- **WHEN** the user deletes a goal with an assigned open task, and confirms
- **THEN** the task still exists and is standalone

#### Scenario: Cancel delete
- **WHEN** the user cancels the delete confirmation
- **THEN** the goal and its measures are unchanged

### Requirement: Goal progress
A goal's progress SHALL be the average progress of its measures (see measures). A goal without measures SHALL have no progress and SHALL be shown without a percentage.

#### Scenario: Average
- **WHEN** a goal has measures at 40 % and 80 %
- **THEN** its progress is 60 %

#### Scenario: No measures
- **WHEN** a goal has no measures
- **THEN** it shows no percentage anywhere

### Requirement: Goal deadline badge
An active goal SHALL show a deadline badge for its end date wherever it is listed and on its page: amber when the end date is within the deadline lead time, red "Overdue" when the end date has passed, neutral otherwise. Completed and archived goals SHALL NOT be marked overdue.

#### Scenario: Overdue goal
- **WHEN** today is 2026-10-07 and an active goal ended on 2026-09-30
- **THEN** it shows a red "Overdue" badge

#### Scenario: Ending soon
- **WHEN** the lead time is 7 days and an active goal ends in 3 days
- **THEN** its badge is amber and reads "Due in 3 days"

#### Scenario: Completed goal
- **WHEN** a completed goal's end date has passed
- **THEN** it is not marked overdue

### Requirement: Goal page
Every goal SHALL have a page with its own URL. It SHALL show a header with the goal's planet and its moons, title, progress, date range, a status chip and the deadline badge, then the description and the sections for measures, projects, tasks and habits, and work. The page SHALL offer Edit and Delete; the status chip SHALL offer the other statuses and change the status immediately.

#### Scenario: Open from Plan
- **WHEN** the user taps the goal "Get fit" in the Plan tab on a phone
- **THEN** the goal page opens with its date range, measures, projects and work, not the edit form

#### Scenario: Complete from the status chip
- **WHEN** the user chooses "Completed" in the status chip of an active goal
- **THEN** the goal's status is completed and it is listed in the Archive

#### Scenario: Missing goal
- **WHEN** the page of a deleted goal is opened
- **THEN** it says the goal was not found

### Requirement: Projects on the goal page
The goal page SHALL list the projects serving the goal: active projects first (in Plan order), then backlog and paused projects with their status chip. Completed projects SHALL be counted ("3 completed") instead of listed. Tapping a project SHALL open its detail. An "Add project" action SHALL open the project form with this goal preselected.

#### Scenario: Order and status
- **WHEN** a goal has the active project "Marathon plan" and the paused project "Gym routine"
- **THEN** "Marathon plan" is listed first and "Gym routine" after it with a "Paused" chip

#### Scenario: Completed projects counted
- **WHEN** two projects serving the goal are completed
- **THEN** the page shows "2 completed" and does not list them

#### Scenario: Add project for the goal
- **WHEN** the user taps "Add project" on the page of "Get fit" and saves a project "Swim course"
- **THEN** "Swim course" serves "Get fit" and is listed on its page

### Requirement: Tasks and habits on the goal page
The goal page SHALL list the open tasks assigned to the goal and the habits linked to it. Tapping a task SHALL open its task page; tapping a habit SHALL open its edit form.

#### Scenario: Assigned task
- **WHEN** the open task "Book physio" is assigned to the goal
- **THEN** it is listed on the goal page and tapping it opens its task page

### Requirement: Work on a goal
Work on a goal SHALL be every log entry linked to the goal, to a project serving it, or to a task of the goal or of one of its projects. A project's work SHALL count for the goal it serves now. The goal page SHALL show the number of entries and total duration of its work in the current week and in total, and its most recent log entries, newest first.

#### Scenario: Work through a project
- **WHEN** 2 entries of 30 minutes were logged this week on "Marathon plan", which serves "Get fit"
- **THEN** the page of "Get fit" shows 2 entries and 1 h this week

#### Scenario: Work on an assigned task
- **WHEN** 45 minutes were logged on the task "Book physio", assigned to "Get fit"
- **THEN** the entry counts as work on "Get fit"

#### Scenario: Project linked later
- **WHEN** a project with 3 entries from last month is linked to "Get fit" today
- **THEN** its 3 entries count in the total work of "Get fit"

### Requirement: Goal page updates live
The goal page SHALL update immediately after changes to the goal, its measures, the projects serving it, its tasks and habits, and log entries.

#### Scenario: Measure changed
- **WHEN** the user raises a measure on the goal page
- **THEN** the goal's progress and its planet update without a reload
