## MODIFIED Requirements

### Requirement: Global shortcuts
On the desktop and in the browser the app SHALL react to these keys on every screen: `T` opens New task, `L` opens Log work (both as sheets over the current screen), `F` goes to Home and puts the cursor in the focus field (also while a session is paused), or opens focus mode while a session runs, `Shift+H` Home, `Shift+P` Plan, `Shift+R` Review, `Shift+S` Stats, `Ctrl+,` Settings, `?` the shortcut overlay and `Ctrl+K` the command palette.

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

#### Scenario: Stats
- **WHEN** the user presses `Shift+S` on Home
- **THEN** Stats is shown

#### Scenario: Settings
- **WHEN** the user presses `Ctrl+,` on Home
- **THEN** Settings is shown

### Requirement: Shortcuts only when not typing
Single-key and `Shift` shortcuts SHALL NOT act while the cursor is in a text field, text area or dropdown, while a dialog, sheet, menu or the palette is open, or when `Ctrl`, `Alt` or `Meta` is held (except `Ctrl+K` and `Ctrl+,`). The key SHALL then do what it does there normally. `Ctrl+K` and `Ctrl+,` SHALL also work from a text field, but not while a dialog or sheet is open.

#### Scenario: Typing a T
- **WHEN** the cursor is in the focus field and the user types "t"
- **THEN** the letter is typed and no sheet opens

#### Scenario: Sheet open
- **WHEN** the New task sheet is open and the user presses `Shift+P` outside its fields
- **THEN** the screen does not change

#### Scenario: Browser shortcut kept
- **WHEN** the user presses `Ctrl+T` in the browser
- **THEN** Orbit does nothing

#### Scenario: Palette from a field
- **WHEN** the cursor is in the focus field and the user presses `Ctrl+K`
- **THEN** the command palette opens

#### Scenario: Settings over a sheet
- **WHEN** the New task sheet is open and the user presses `Ctrl+,`
- **THEN** the screen does not change
