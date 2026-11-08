## MODIFIED Requirements

### Requirement: Focus panel on Home
Without a session or while the session is paused, Home's focus panel SHALL offer a text field "What are you working on?" (see "Start with a new task") and Start, with no choice of length. While the user types, the field SHALL suggest at most 8 open tasks and active habits whose title contains the text (ignoring case), each with its project's colour and name (a habit marked "Habit"); arrow keys and Enter or a click pick a suggestion, and Tab accepts the highlighted suggestion, or the first one when none is highlighted, without starting (Tab without suggestions moves focus on). With a session, the panel SHALL show what it runs for, the worked time (counting up every second while running, `m:ss`, from one hour on `h:mm:ss`), the time limit and overtime, Pause or Resume, Complete and "Focus mode"; a paused session SHALL be marked "Paused" and shown compactly above the text field and Start. Starting from the field while a session is paused SHALL end the paused session as in "One timer at a time" (its logged time stays, its task stays open) and start the new one.

#### Scenario: Running timer
- **WHEN** a timer for "Thesis" without a time limit has run for 1 hour, 5 minutes and 3 seconds
- **THEN** the focus panel shows "Thesis", "1:05:03", Pause, Complete and "Focus mode"

#### Scenario: Paused session
- **WHEN** a session for "Thesis" is paused at 25 minutes worked
- **THEN** the focus panel shows "Thesis", "Paused", "25:00", Resume, Complete and "Focus mode", and below them the text field and Start

#### Scenario: Overtime
- **WHEN** a session with a 30-minute limit has 32 minutes and 10 seconds worked
- **THEN** the panel shows that the 30 minutes are over and "+2:10" overtime, and the timer keeps running

#### Scenario: No timer
- **WHEN** no session exists
- **THEN** the focus panel offers the text field and Start, and no lengths

#### Scenario: Suggestions
- **WHEN** the user types "bench" and the open task "Rerun benchmarks" of "Chapter 4: Evaluation" exists
- **THEN** "Rerun benchmarks" is suggested with the colour and name of "Chapter 4: Evaluation"

#### Scenario: Tab completes
- **WHEN** the user types "bench" and presses Tab
- **THEN** the field shows "Rerun benchmarks" and no session starts

#### Scenario: Tab with the second highlighted
- **WHEN** two suggestions are shown, the second is highlighted and the user presses Tab
- **THEN** the second suggestion is chosen

#### Scenario: Habit suggested
- **WHEN** the user types "run" and the active habit "Run 5 km" of "Training block 3" exists
- **THEN** "Run 5 km" is suggested, marked "Habit", with the colour of "Training block 3"

#### Scenario: Pick with the keyboard
- **WHEN** suggestions are shown and the user presses the down arrow and Enter
- **THEN** the first suggestion is chosen and Start starts a session for it

#### Scenario: Start something else while paused
- **WHEN** a session for "Thesis" is paused and the user types "Call the bank" in the focus panel and starts
- **THEN** the session for "Thesis" ends without a further entry, the task "Call the bank" is created and a session for it runs

#### Scenario: No field while running
- **WHEN** a session runs
- **THEN** the focus panel shows no text field

### Requirement: Start with a new task
Text in the focus panel's field that is not a picked suggestion SHALL be read as `title # project`: the text before the last `#` is the title, the text after it names a project. After `#` the field SHALL suggest the active projects whose name contains the typed text, with their colours. Without `#` it SHALL suggest the matching open tasks and active habits, then the matching active projects marked "Project"; picking a project SHALL start on that project. Start SHALL then:
- use the open task whose title equals the title (ignoring case), else the active habit with that title, else (without `#`) the active project with that name, creating no duplicate;
- otherwise create a task with the title, assigned to the named project, or standalone without `#`;
- with `#` and an empty title, start on the project itself;
and start the session. A project name SHALL match an active project exactly (ignoring case), else the only active project starting with it; when none matches, the field SHALL show "No project named …" and Start SHALL be disabled.

#### Scenario: New task in a project
- **WHEN** the user types "implement new orbit feature # Orbit app rebuild" and starts
- **THEN** the task "implement new orbit feature" is created in "Orbit app rebuild" and a session for it runs

#### Scenario: New standalone task
- **WHEN** the user types "Call the bank" (no open task has that title) and starts
- **THEN** the standalone task "Call the bank" is created and a session for it runs

#### Scenario: Existing task typed
- **WHEN** the user types "rerun benchmarks" and the open task "Rerun benchmarks" exists, and starts
- **THEN** the session runs for "Rerun benchmarks" and no task is created

#### Scenario: Project only
- **WHEN** the user types "# Thesis" and starts
- **THEN** a session for the project "Thesis" runs and no task is created

#### Scenario: Project prefix
- **WHEN** the user types "draft intro # chap" and "Chapter 4: Evaluation" is the only active project starting with "chap"
- **THEN** the new task is assigned to "Chapter 4: Evaluation"

#### Scenario: Unknown project
- **WHEN** the user types "draft intro # garden" and no active project matches "garden"
- **THEN** the field shows "No project named garden" and Start is disabled

#### Scenario: Project suggestions
- **WHEN** the user types "draft intro # port"
- **THEN** "Portfolio site" is suggested with its colour

#### Scenario: Project suggested without #
- **WHEN** the user types "portf"
- **THEN** "Portfolio site" is suggested, marked "Project" with its colour, and picking it and starting runs a session for the project

#### Scenario: Project name typed
- **WHEN** the user types "portfolio site", no open task or habit has that title, and starts
- **THEN** a session for the project "Portfolio site" runs and no task is created
