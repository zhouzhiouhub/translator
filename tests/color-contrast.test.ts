import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const globals = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

function cssVar(name: string) {
  const match = globals.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `Missing --${name}`);
  return match[1];
}

function luminance(hex: string) {
  const [r, g, b] = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((part) => parseInt(part, 16) / 255)
    .map((channel) =>
      channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4),
    );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function blend(foreground: string, background: string, alpha: number) {
  const fg = foreground.slice(1).match(/.{2}/g)!.map((part) => parseInt(part, 16));
  const bg = background.slice(1).match(/.{2}/g)!.map((part) => parseInt(part, 16));
  const blended = fg.map((channel, index) =>
    Math.round(channel * alpha + bg[index] * (1 - alpha)),
  );

  return `#${blended.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

describe("theme color contrast", () => {
  it("keeps the primary button readable", () => {
    assert.ok(contrastRatio(cssVar("primary-foreground"), cssVar("primary")) >= 4.5);
    assert.ok(contrastRatio(cssVar("primary-foreground"), "#0b56c8") >= 4.5);
  });

  it("keeps primary text readable on selected light-blue controls", () => {
    const selectedBackground = blend(cssVar("primary"), cssVar("card"), 0.1);
    const selectedHoverBackground = blend(cssVar("primary"), cssVar("card"), 0.15);

    assert.ok(contrastRatio(cssVar("primary"), selectedBackground) >= 4.5);
    assert.ok(contrastRatio(cssVar("primary"), selectedHoverBackground) >= 4.5);
  });

  it("keeps semantic badges readable on their pale backgrounds", () => {
    assert.ok(contrastRatio(cssVar("success"), "#ecfdf5") >= 4.5);
    assert.ok(contrastRatio(cssVar("warning"), "#fffbeb") >= 4.5);
    assert.ok(contrastRatio(cssVar("danger"), "#fef2f2") >= 4.5);
  });

  it("keeps muted helper text readable on card backgrounds", () => {
    assert.ok(contrastRatio(cssVar("muted"), cssVar("card")) >= 4.5);
  });
});
