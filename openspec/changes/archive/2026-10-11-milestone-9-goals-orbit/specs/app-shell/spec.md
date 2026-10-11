# Spec Delta

## ADDED Requirements

### Requirement: Dark theme
The app SHALL use a Material 3 dark theme built from the Orbit palette with Inter and Space Grotesk (see visual-design), whatever the system brightness setting.

#### Scenario: System in dark mode
- **WHEN** the operating system or browser is set to dark mode
- **THEN** the app uses its dark theme

#### Scenario: System in light mode
- **WHEN** the operating system or browser is set to light mode
- **THEN** the app still uses its dark theme

### Requirement: Former objective and key result addresses
Addresses of objective pages SHALL open the page of the goal with the same ID. Addresses of key result pages and key result forms SHALL open the page of the goal the measure with the same ID belongs to. When no such goal or measure exists, the page SHALL say that the goal was not found.

#### Scenario: Old objective link
- **WHEN** the app is opened at the former address of the objective "Get fit"
- **THEN** the goal page of "Get fit" is shown

#### Scenario: Old key result link
- **WHEN** the app is opened at the former address of the key result "Run 100 km" of "Get fit"
- **THEN** the goal page of "Get fit" is shown

#### Scenario: Unknown key result
- **WHEN** the app is opened at the former address of a key result that does not exist
- **THEN** a page says the goal was not found

## MODIFIED Requirements

### Requirement: Date display format
Every calendar date shown in the app SHALL be displayed as `dd-mm-yyyy` with leading zeros, independent of the device or browser locale. Date ranges SHALL be shown as `dd-mm-yyyy – dd-mm-yyyy`. Date fields SHALL show the selected date in the same format. This affects display only, not how dates are stored.

#### Scenario: Single date
- **WHEN** a project has deadline 2026-12-31
- **THEN** it is shown as `31-12-2026`

#### Scenario: Leading zeros
- **WHEN** a date is 5 March 2026
- **THEN** it is shown as `05-03-2026`

#### Scenario: Date range
- **WHEN** a goal runs from 2026-10-01 to 2026-12-31
- **THEN** its date range is shown as `01-10-2026 – 31-12-2026`

#### Scenario: Locale independent
- **WHEN** the device or browser locale is US English
- **THEN** dates are still shown as `dd-mm-yyyy`

#### Scenario: Selected date in a form
- **WHEN** the user picks 15 November 2026 as a deadline in a form
- **THEN** the date field shows `15-11-2026`

## REMOVED Requirements

### Requirement: Light and dark theme
**Reason**: The app is dark only.
**Migration**: See "Dark theme" above.
