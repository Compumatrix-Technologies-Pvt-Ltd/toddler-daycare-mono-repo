/**
 * @repo/config — Shared ESLint configuration
 *
 * Provides TypeScript + React rules for all apps in the monorepo.
 * Usage in an app's .eslintrc.cjs / eslint.config.js:
 *
 *   // Legacy .eslintrc.cjs
 *   module.exports = { extends: ["@repo/config/eslint"] }
 *
 *   // Flat config (eslint.config.js)
 *   import config from "@repo/config/eslint";
 *   export default [...config.configs];
 */

/** @type {import("eslint").Linter.Config} */
const config = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    // TypeScript
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
    "@typescript-eslint/no-import-type-side-effects": "error",

    // React
    "react/react-in-jsx-scope": "off", // Not needed with React 17+ JSX transform
    "react/prop-types": "off", // TypeScript handles prop types
    "react/display-name": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    // General
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
    eqeqeq: ["error", "always", { null: "ignore" }],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    ".next/",
    "out/",
    "coverage/",
    "*.config.js",
    "*.config.ts",
    "*.config.cjs",
    "*.config.mjs",
  ],
};

export default config;
