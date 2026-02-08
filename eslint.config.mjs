// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
    eslint.configs.recommended,
    tseslint.configs.strict,
    tseslint.configs.stylistic,
    {
        files: ["!src/**/*.test.ts", "!src/tests/**/*.ts"],
        rules: {
            "@typescript-eslint/consistent-type-definitions": "off", // we prefer type, but need interface sometimes
            "@typescript-eslint/no-non-null-assertion": "off", // we make assertions in different keyword functions
            "@typescript-eslint/unified-signatures": "off" // readability
        }
    },
    {
        files: ["src/**/*.test.ts", "src/tests/**/*.ts"],
        rules: {
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-explicit-any": "off"
        }
    }
]);
