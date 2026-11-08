## MODIFIED Requirements

### Requirement: Global shortcuts
On the desktop and in the browser the app SHALL react to these keys on every screen: `T` opens New task, `L` opens Log work (both as sheets over the current screen), `F` goes to Home and puts the cursor in the focus field (also while a session is paused), or opens focus mode while a session runs, `Shift+H` Home, `Shift+P` Plan, `Shift+R` Review, `Shift+S` Settings, `?` the shortcut overlay and `Ctrl+K` the command palette.

#### Scenario: New task from Plan
- **WHEN** the user presses `T` on the Plan screen
- **THEN** the New task sheet opens over Plan and saving it leaves Plan shown

#### Scenario: Log work
- **WHEN** the user presses `L` on a project page
- **THEN** the Log work sheet opens

#### Scenario: Focus field
- **WHEN** no session exists and the user presses `F` on the Review screen
- **THEN** Home is shown with the cursor in "What are you working on?"

#### Scenario: Focus mode with a session
- **WHEN** a session runs and the user presses `F`
- **THEN** focus mode opens

#### Scenario: Focus field while paused
- **WHEN** a session is paused and the user presses `F`
- **THEN** Home is shown with the cursor in "What are you working on?"

#### Scenario: Switch screens
- **WHEN** the user presses `Shift+P`, then `Shift+R`, then `Shift+H`
- **THEN** Plan, then Review, then Home is shown

## ADDED Requirements

### Requirement: Session keys on Home
On Home, while a session exists, `P` SHALL pause it when it runs, `R` SHALL resume it when it is paused and `C` SHALL open its Complete dialog (see work-timer, "Complete a session"), whether it runs or is paused. Without a session, `P`, `R` and `C` SHALL do nothing; `P` SHALL do nothing while the session is paused and `R` while it runs. Like the other shortcuts they SHALL NOT fire while typing in a field or while a dialog is open, and SHALL be listed in the shortcut overlay.

#### Scenario: Pause with P
- **WHEN** a session for "Thesis" runs and the user presses `P` on Home
- **THEN** the session is paused and the field to start something else is shown

#### Scenario: Resume with R
- **WHEN** a session for "Thesis" is paused and the user presses `R` on Home
- **THEN** the session runs again

#### Scenario: Complete with C
- **WHEN** a session for "Thesis" is paused and the user presses `C` on Home
- **THEN** the Complete dialog for "Thesis" opens

#### Scenario: No session
- **WHEN** no session exists and the user presses `P`, `R` or `C` on Home
- **THEN** nothing happens

