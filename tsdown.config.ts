import { defineConfig } from "tsdown";

export default defineConfig({
    dts: true,
    entry: { index: "./index.ts", remotes: "./remotes/index.ts", formats: "./src/formats/additionalFormats.ts" },
    exports: true,
    globalName: "jlib",
    sourcemap: true,
    // Only bundle @hyperjump/json-schema-formats (used only in formats entry)
    noExternal: ["@hyperjump/json-schema-formats"]
});
