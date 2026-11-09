# Spec Delta

## ADDED Requirements

### Requirement: Show more key on Home
On Home, `A` SHALL expand the section of more tasks below To do when it is collapsed and collapse it when it is expanded (see home, "More tasks in To do"). While the section is hidden because there are no more tasks, `A` SHALL do nothing. Like the other shortcuts it SHALL NOT fire while typing in a field or while a dialog is open, SHALL be listed in the shortcut overlay under Home, and the toggle's tooltip SHALL show it, for example "Show 3 more (A)". It SHALL reach the Home screen like the other To do list keys.

#### Scenario: Expand and collapse with A
- **WHEN** two more tasks can be shown below To do and the user presses `A`, then `A` again
- **THEN** the two tasks were listed and are hidden again

#### Scenario: Nothing to show
- **WHEN** every open task of the active projects is a next step and the user presses `A`
- **THEN** nothing happens

#### Scenario: Not while typing
- **WHEN** the focus field has keyboard focus and the user types "a"
- **THEN** the section does not expand
