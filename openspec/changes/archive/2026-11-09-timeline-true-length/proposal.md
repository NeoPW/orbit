# Proposal

## Why

Every block on the day timeline is at least one line of its title high (20 px), so a 5-minute entry looks almost like a 20-minute one and long sessions do not stand out from short ones.

## What Changes

- A block's height follows its duration; only a thin floor (4 px) keeps the shortest ones visible and clickable.
- A block too short for a line of text shows no title; its label, time range, duration and note stay available on hover and focus and in its accessible name.
- Blocks that are shorter than a line no longer push neighbours into side lanes just because of the old minimum height: overlap is judged with the 4 px floor.

Relevant sections of docs/SPEC.md: §6.1 Home (Today timeline), §6.5 Review (days).

### Out of scope

- Changing the hour height or zoom of the timeline.
- Dots (entries without a duration) and the running block's behaviour.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `day-timeline`: the "Work blocks" requirement no longer promises a minimum of one title line, and a block too short for text shows no label.

## Impact

- `src/features/timeline/ui/DayTimeline.tsx`: the floor, the label rule and the overlap minimum (`LINE_PX` / `minBlockMinutes`).
- `docs/SPEC.md` §6.1 gets a one-line update at archive if it mentions the minimum.
- No schema, sync or dependency changes.
