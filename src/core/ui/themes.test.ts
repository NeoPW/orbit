import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { THEMES } from "./themes.ts";

const css = readFileSync(new URL("./theme.css", import.meta.url), "utf8");

/** The `--name: value` pairs of the block with this selector. */
function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  expect(start, `block ${selector}`).toBeGreaterThanOrEqual(0);
  const body = css.slice(start, css.indexOf("\n}", start));
  const vars: Record<string, string> = {};
  for (const match of body.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6});/g))
    vars[match[1] ?? ""] = match[2] ?? "";
  return vars;
}

function themeVars(id: string): Record<string, string> {
  return block(id === "slate" ? ":root" : `[data-theme='${id}']`);
}

/** The colour of a token; fails the test when it is missing. */
function hexOf(vars: Record<string, string>, name: string): string {
  const value = vars[name];
  if (value === undefined) throw new Error(`missing ${name}`);
  return value;
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe("themes", () => {
  describe.each(THEMES)("$name", ({ id, ground, accent }) => {
    const vars = themeVars(id);

    it("defines every base token and eight project colours", () => {
      for (const name of [
        "--color-bg",
        "--color-sidebar",
        "--color-surface",
        "--color-surface-raised",
        "--color-border",
        "--color-text",
        "--color-text-muted",
        "--color-primary",
        "--color-on-primary",
        "--color-red",
        "--color-overdue-bg",
        "--color-amber",
        "--color-soon-bg",
        ...Array.from({ length: 8 }, (_, i) => `--pc${i}`),
      ]) {
        expect(vars[name], name).toBeDefined();
      }
    });

    it("has swatch colours that match the CSS", () => {
      expect(hexOf(vars, "--color-bg")).toBe(ground);
      expect(hexOf(vars, "--color-primary")).toBe(accent);
    });

    // Scenario "Contrast in every theme".
    it("has readable text on bg, surface and raised", () => {
      for (const surface of [
        "--color-bg",
        "--color-surface",
        "--color-surface-raised",
      ]) {
        for (const text of ["--color-text", "--color-text-muted"]) {
          expect(
            contrast(hexOf(vars, text), hexOf(vars, surface)),
            `${text} on ${surface}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    });

    it("has project colours of at least 3:1 on the surface", () => {
      for (let i = 0; i < 8; i++) {
        expect(
          contrast(hexOf(vars, `--pc${i}`), hexOf(vars, "--color-surface")),
          `--pc${i}`,
        ).toBeGreaterThanOrEqual(3);
      }
    });

    it("has text on the accent and on the overdue and soon tints", () => {
      expect(
        contrast(
          hexOf(vars, "--color-on-primary"),
          hexOf(vars, "--color-primary"),
        ),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(hexOf(vars, "--color-red"), hexOf(vars, "--color-overdue-bg")),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(hexOf(vars, "--color-amber"), hexOf(vars, "--color-soon-bg")),
      ).toBeGreaterThanOrEqual(4.5);
    });
  });
});
