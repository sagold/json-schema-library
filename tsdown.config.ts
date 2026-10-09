import { defineConfig } from "tsdown";

export default defineConfig({
    dts: true,
    entry: { index: "./index.ts", remotes: "./remotes/index.ts", formats: "./src/formats/additionalFormats.ts" },
    exports: true,
    globalName: "jlib",
    sourcemap: true,
    deps: {
        // Keep these deps inlined to avoid ESM->CJS interop edge cases in Node consumers.
        alwaysBundle: ["@hyperjump/json-schema-formats", "fast-uri"]
    }
});
