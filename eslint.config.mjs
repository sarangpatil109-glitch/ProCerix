import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Supabase/generic CRUD helpers use `any` extensively throughout the codebase.
      "@typescript-eslint/no-explicit-any": "warn",
      // Unused imports are widespread; keep as warn.
      "@typescript-eslint/no-unused-vars": "warn",
      // Unescaped entities are stylistic — off to avoid noise from pre-existing content.
      "react/no-unescaped-entities": "off",
      // Several legacy files use require() for compatibility reasons.
      "@typescript-eslint/no-require-imports": "warn",
      // {} empty object type — warn only.
      "@typescript-eslint/no-empty-object-type": "warn",
      // Async data-fetching functions called from effects (e.g. loadPartners()) are standard React practice.
      // Downgrade to warn so the common data-loading pattern doesn't block builds.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
