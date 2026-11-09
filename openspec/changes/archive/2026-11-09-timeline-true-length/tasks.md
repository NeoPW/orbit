# Tasks

## 1. Timeline blocks

- [x] 1.1 In `src/features/timeline/ui/DayTimeline.tsx`, replace the one-line minimum (`LINE_PX` in `minBlockMinutes` and in `renderBlock`'s height) with a 4 px floor (`MIN_BLOCK_PX`), and render the title only when the block is at least `LINE_PX` high (the label, time range and note stay in the tooltip and `aria-label`). Verify with `npx tsc --noEmit` and `npx vitest run src/features/timeline`, adding a `layoutDay` case in `src/features/timeline/domain/day-timeline.test.ts` for the "Length shows" scenario if none covers a small minimum.
- [x] 1.2 Check the Home timeline and the review's week view in the app with a 5-minute, a 30-minute and a 90-minute entry: lengths differ clearly, the short block can still be hovered and clicked, and neighbouring blocks still sit in lanes only when they truly overlap.
- [x] 1.3 Run `npm run check` and fix any failures.
