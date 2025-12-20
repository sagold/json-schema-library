// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(eslint.configs.recommended, tseslint.configs.strict, tseslint.configs.stylistic, {
    rules: {
        "@typescript-eslint/no-dynamic-delete": "off",
        "@typescript-eslint/prefer-for-of": "off",
        "@typescript-eslint/consistent-type-definitions": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "@typescript-eslint/no-require-imports": "off", // tests
        "@typescript-eslint/no-empty-function": "off", // tests
        "@typescript-eslint/unified-signatures": "off" // readability
    }
});
