# Spec Delta

## Purpose

Lets the user track workouts in Orbit on the phone: exercises of three types and workouts built from them, as the starting point for workout sessions.

## ADDED Requirements

### Requirement: Exercises
The user SHALL be able to create, edit and delete exercises. An exercise SHALL have a name and a type: strength (reps and weight), bodyweight (reps) or endurance (distance and duration). A name is required and, ignoring case and surrounding spaces, SHALL be unique among the exercises that are not deleted.

#### Scenario: Create a strength exercise
- **WHEN** the user creates the exercise "Bench press" with the type strength
- **THEN** it is saved with that name and type and appears in the exercise list

#### Scenario: Name required
- **WHEN** the user saves an exercise with an empty name
- **THEN** it is not saved and the form shows "Enter a name"

#### Scenario: Duplicate name
- **WHEN** the exercise "Bench press" exists and the user saves a new exercise named " bench press "
- **THEN** it is not saved and the form shows "An exercise with this name exists"

### Requirement: Distance unit of endurance exercises
An endurance exercise SHALL have a distance unit, km or m, defaulting to km. Exercises of the other types SHALL NOT store a distance unit.

#### Scenario: Swimming in meters
- **WHEN** the user creates the endurance exercise "Swim" with the unit m
- **THEN** it is saved with the type endurance and the unit m

#### Scenario: Unit dropped for other types
- **WHEN** the user changes the endurance exercise "Run" (unit km) to the type bodyweight and saves
- **THEN** it is saved with the type bodyweight and no distance unit

### Requirement: Workouts
The user SHALL be able to create, edit and delete workouts. A workout SHALL have a name (required) and an ordered list of at least one exercise, each exercise at most once.

#### Scenario: Create a workout
- **WHEN** the user creates the workout "Push day" with the exercises Bench press, Overhead press and Dips
- **THEN** it is saved with these exercises in this order

#### Scenario: No exercises
- **WHEN** the user saves a workout without exercises
- **THEN** it is not saved and the form shows "Add at least one exercise"

#### Scenario: Exercise only once
- **WHEN** Bench press is already in the workout being edited
- **THEN** Bench press is not offered when adding another exercise

### Requirement: Order of a workout's exercises
In the workout form, an added exercise SHALL go to the end of the list, and each exercise SHALL be movable one place up or down and removable.

#### Scenario: Move up
- **WHEN** the workout lists Bench press, Overhead press, Dips and the user moves Dips up and saves
- **THEN** the workout's exercises are Bench press, Dips, Overhead press

### Requirement: Links of a workout
A workout SHALL optionally link to a project, a goal and a habit. The form SHALL offer non-completed projects, active goals and active habits, plus the workout's current links. A link to an item that has been deleted SHALL be treated as no link.

#### Scenario: Link a habit
- **WHEN** the user picks the habit "Gym" for the workout "Push day" and saves
- **THEN** the workout is linked to the habit "Gym"

#### Scenario: Deleted habit
- **WHEN** the habit linked to a workout is deleted
- **THEN** the workout shows no habit and its form has no habit selected

### Requirement: Deleting an exercise
Deleting an exercise SHALL ask for confirmation, and SHALL remove it from every workout that contains it. The workouts themselves SHALL be kept.

#### Scenario: Removed from workouts
- **WHEN** the user deletes the exercise Dips, which is in the workout "Push day"
- **THEN** "Push day" lists only its other exercises

### Requirement: Workouts screen on the phone
The phone SHALL have a Workouts screen with two sections, Workouts and Exercises, each sorted by name and each with a button that opens the form for a new one. A workout row SHALL show its name and its exercises' names, an exercise row its name and type. Tapping a row SHALL open its form, which also offers deleting it after confirmation.

#### Scenario: Empty screen
- **WHEN** no exercises and no workouts exist and the user opens the Workouts screen
- **THEN** each section shows an icon, a short line and the button that creates the first one

#### Scenario: Edit an exercise
- **WHEN** the user taps the exercise row "Bench press"
- **THEN** the exercise form opens with the name "Bench press" and the type strength

### Requirement: Workouts only in the phone layout
The Workouts screen SHALL exist only in the phone layout. In a window 640 pixels or wider, its address SHALL lead to Home, and no workout entry SHALL appear in the sidebar.

#### Scenario: Wide window
- **WHEN** the Workouts screen's address is opened in a 1280 pixel wide window
- **THEN** Home is shown
