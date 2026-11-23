# Spec Delta

## ADDED Requirements

### Requirement: Start a workout session
On the phone the user SHALL be able to start a session from a workout or empty. A session from a workout SHALL get the workout's name, its exercises in order, and its project, goal and habit (as resolved links). An empty session SHALL be named "Workout" and have no exercises or links. The session's start SHALL be the current time.

#### Scenario: Start from a workout
- **WHEN** the user starts the workout "Push day" (Bench press, Dips; habit "Gym") at 18:05
- **THEN** a running session "Push day" started at 18:05 with Bench press and Dips and the habit "Gym" opens

#### Scenario: Start empty
- **WHEN** the user starts an empty session
- **THEN** a running session "Workout" without exercises opens

### Requirement: One running session
At most one session SHALL run at a time. While one runs, the Workouts screen SHALL show it at the top with its name and running time and a Continue button that opens it, and SHALL NOT offer starting another. A running session SHALL stay running when the app is closed and reopened.

#### Scenario: Continue after reopening
- **WHEN** a session started at 18:05 is running and the app is closed and opened again at 18:40
- **THEN** the Workouts screen shows the session with a running time of 35 minutes and Continue

#### Scenario: No second start
- **WHEN** a session is running
- **THEN** the Workouts screen offers no button that starts a session

### Requirement: Session name
The session screen SHALL show the session's name, which the user can change. An empty name SHALL NOT be saved; the previous name is kept.

#### Scenario: Rename
- **WHEN** the user renames the running session "Workout" to "Morning swim"
- **THEN** the session is named "Morning swim"

### Requirement: Change the exercises of a session
In a session the user SHALL be able to add an exercise (to the end; only exercises not yet in the session and not deleted are offered), move an exercise up or down, replace an exercise that has no sets with another one in its place, and remove an exercise. Removing an exercise that has sets SHALL ask for confirmation and delete its sets. These changes SHALL NOT change the workout the session started from.

#### Scenario: Add an exercise
- **WHEN** the running session has Bench press and the user adds Pull-ups
- **THEN** the session lists Bench press, Pull-ups and the workout is unchanged

#### Scenario: Replace
- **WHEN** Dips has no sets and the user replaces it with Push-ups
- **THEN** Push-ups is in the session at Dips' place and Dips is not

#### Scenario: Replace not offered with sets
- **WHEN** Bench press has a logged set
- **THEN** replacing Bench press is not offered

#### Scenario: Remove with sets
- **WHEN** the user removes Bench press, which has two sets, and confirms
- **THEN** Bench press and its two sets are no longer in the session

### Requirement: Log sets
The user SHALL be able to log sets for each exercise of a session, in order, and edit or delete a logged set. A strength set SHALL have reps (a whole number of at least 1) and a weight in kg (at least 0, decimals allowed). A bodyweight set SHALL have reps. An endurance set SHALL have a distance in the exercise's unit (more than 0, decimals allowed) and a duration entered as `m:ss` or `h:mm:ss` (more than 0). An invalid set SHALL NOT be logged and the input shows the error.

#### Scenario: Strength set
- **WHEN** the user logs 8 reps at 60 kg for Bench press
- **THEN** Bench press lists the set "8 × 60 kg"

#### Scenario: Endurance set
- **WHEN** the user logs 5.2 km in 28:40 for Run
- **THEN** Run lists the set "5.2 km in 28:40"

#### Scenario: Invalid reps
- **WHEN** the user logs 0 reps for Dips
- **THEN** no set is logged and the input shows "Enter at least 1 rep"

#### Scenario: Invalid duration
- **WHEN** the user logs 3 km with the duration "12" for Run
- **THEN** no set is logged and the input shows "Enter the time as m:ss or h:mm:ss"

### Requirement: Pace of endurance sets
An endurance set SHALL show its pace: minutes and seconds per km for an exercise in km, per 100 m for an exercise in m.

#### Scenario: Running pace
- **WHEN** a Run set (km) is 5 km in 27:30
- **THEN** it shows the pace "5:30 /km"

#### Scenario: Swimming pace
- **WHEN** a Swim set (m) is 1500 m in 30:00
- **THEN** it shows the pace "2:00 /100 m"

### Requirement: Last time
For each exercise of a session, "last time" SHALL be its sets in the most recently started finished session, other than this one, that has sets for it, in any workout. The session SHALL show last time's sets with that session's date. The input for the next set SHALL be filled in with last time's set at the same position, else with this session's last logged set of the exercise, else with last time's last set; without any of them it is empty.

#### Scenario: Prefill the first set
- **WHEN** last time Bench press had 8 × 60 kg and 6 × 62.5 kg, and no set is logged yet in this session
- **THEN** the input shows 8 reps and 60 kg, and last time's sets are shown

#### Scenario: Prefill past last time's sets
- **WHEN** last time had two sets, and three sets of 8 × 60 kg are already logged in this session
- **THEN** the input shows 8 reps and 60 kg (this session's last set)

#### Scenario: From another workout
- **WHEN** Bench press was last done in the workout "Full body" and the user now does it in "Push day"
- **THEN** last time shows the sets from "Full body"

#### Scenario: Never done
- **WHEN** an exercise has no sets in any finished session
- **THEN** no last time is shown and the input is empty

### Requirement: Finish a session
Finishing a session SHALL set its end to the current time and write one log entry with the source "workout". The entry starts at the session's start and lasts the session's length in whole minutes (rounded, at least 1). Its note is the session's name and it links to the session's project and goal. When the session has a habit, finishing SHALL also check that habit for the current local date. A session can be finished without sets.

#### Scenario: Finish
- **WHEN** the session "Push day" of project "Strength block", started at 18:05, is finished at 19:10
- **THEN** it ends at 19:10 and a workout log entry at 18:05 of 65 minutes with the note "Push day" and the project "Strength block" exists

#### Scenario: Habit checked
- **WHEN** a session linked to the habit "Gym" is finished
- **THEN** "Gym" is checked for today

#### Scenario: Short session
- **WHEN** a session is finished 20 seconds after it started
- **THEN** its log entry lasts 1 minute

### Requirement: Discard a session
Discarding a running session SHALL ask for confirmation and then remove the session, its exercises and its sets, without a log entry or a habit check.

#### Scenario: Discard
- **WHEN** the user discards the running session and confirms
- **THEN** no session is running, no log entry was written and the Workouts screen offers starting a session again

### Requirement: Recent sessions
The Workouts screen SHALL list the 10 most recently started finished sessions, newest first, each with its name, date, time range and length. Tapping one SHALL open it for editing.

#### Scenario: Listed after finishing
- **WHEN** the user finishes "Push day" on 2026-11-10 from 18:05 to 19:10
- **THEN** Recent sessions shows "Push day", 10-11-2026, 18:05–19:10 and 1 h 5 min at the top

### Requirement: Edit a finished session
A finished session SHALL be editable on the phone like a running one (name, exercises, sets), and also its start and end time. The end SHALL be after the start; otherwise the change is not saved and "End must be after start" is shown. Every change SHALL update its log entry's start, length and note.

#### Scenario: Correct the end
- **WHEN** the user changes the end of a session started at 18:05 from 21:00 to 19:10
- **THEN** its log entry lasts 65 minutes

#### Scenario: End before start
- **WHEN** the user sets the end of a session started at 18:05 to 17:50
- **THEN** the change is not saved and "End must be after start" is shown

### Requirement: Delete a session
Deleting a finished session SHALL ask for confirmation and remove the session, its exercises, its sets and its log entry. A habit check made when it was finished SHALL stay.

#### Scenario: Delete
- **WHEN** the user deletes the finished session "Push day" and confirms
- **THEN** it is not in Recent sessions and its log entry is gone

### Requirement: Exercise type locked once used
An exercise that has sets in a session that is not deleted SHALL keep its type and distance unit: the exercise form SHALL show them without letting them change, with the line "The type is fixed once the exercise has sets".

#### Scenario: Locked
- **WHEN** Run has a logged set and the user opens its form
- **THEN** the type and unit cannot be changed and the line is shown

#### Scenario: Not yet used
- **WHEN** Swim has no sets
- **THEN** its type can still be changed

### Requirement: Deleted exercises in sessions
A session SHALL keep showing an exercise that was deleted after it was added, with its name and sets. A deleted exercise SHALL NOT be offered for adding.

#### Scenario: Deleted after use
- **WHEN** Dips has sets in a finished session and is then deleted
- **THEN** the finished session still shows Dips with its sets

### Requirement: Session screen only in the phone layout
The session screen SHALL exist only in the phone layout. In a window 640 pixels or wider, its address SHALL lead to Home.

#### Scenario: Wide window
- **WHEN** a session's address is opened in a 1280 pixel wide window
- **THEN** Home is shown

## MODIFIED Requirements

### Requirement: Workouts screen on the phone
The phone SHALL have a Workouts screen with the running session (if any), then the sections Workouts, Recent sessions and Exercises. Workouts and Exercises are sorted by name, and each has a button that opens the form for a new one. A workout row SHALL show its name and its exercises' names, plus a start button when no session runs; an exercise row SHALL show its name and type. While no session runs, the screen SHALL also offer starting an empty session. Tapping a workout or exercise row SHALL open its form, which also offers deleting it after confirmation.

#### Scenario: Empty screen
- **WHEN** no exercises and no workouts exist and the user opens the Workouts screen
- **THEN** each section shows an icon, a short line and the button that creates the first one

#### Scenario: Edit an exercise
- **WHEN** the user taps the exercise row "Bench press"
- **THEN** the exercise form opens with the name "Bench press" and the type strength

#### Scenario: Start buttons
- **WHEN** no session runs and the workout "Push day" exists
- **THEN** the row of "Push day" has a start button and the screen offers starting an empty session
