import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["./index.ts"],
    format: "iife",
    globalName: "jlib",
    platform: "browser",
    // Bundle anything that's not a relative/absolute path (=> node_modules)
    noExternal: (id) => !id.startsWith(".") && !id.startsWith("/")
});
