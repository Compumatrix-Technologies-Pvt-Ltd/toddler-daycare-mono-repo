/**
 * @repo/config — Shared Prettier configuration
 *
 * Usage in an app's prettier.config.js / .prettierrc.js:
 *
 *   import prettierConfig from "@repo/config/prettier";
 *   export default prettierConfig;
 *
 * Or in .prettierrc.json (if using the JSON form):
 *   { "...": "see prettier docs for extending" }
 */

/** @type {import("prettier").Config} */
const config = {
  // Line length
  printWidth: 100,

  // Indentation
  tabWidth: 2,
  useTabs: false,

  // Semicolons
  semi: true,

  // Quotes
  singleQuote: false,
  jsxSingleQuote: false,
  quoteProps: "as-needed",

  // Trailing commas (ES5-compatible)
  trailingComma: "es5",

  // Brackets
  bracketSpacing: true,
  bracketSameLine: false,

  // Arrow function parens
  arrowParens: "always",

  // End of line
  endOfLine: "lf",

  // Embedded language formatting
  embeddedLanguageFormatting: "auto",

  // HTML whitespace sensitivity
  htmlWhitespaceSensitivity: "css",

  // Prose wrap (for markdown)
  proseWrap: "preserve",
};

export default config;
