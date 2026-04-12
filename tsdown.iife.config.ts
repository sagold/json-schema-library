import { defineConfig } from "tsdown";

export default defineConfig([
    {
        entry: { jlib: "./index.ts" },
        format: "iife",
        globalName: "jlib",
        platform: "browser",
        sourcemap: false,
        // Bundle anything that's not a relative/absolute path (=> node_modules)
        noExternal: (id) => !id.startsWith(".") && !id.startsWith("/")
    },
    {
        entry: { jlibRemote: "./remotes/index.ts" },
        format: "iife",
        globalName: "jlibRemotes",
        platform: "browser",
        sourcemap: false,
        // Bundle anything that's not a relative/absolute path (=> node_modules)
        noExternal: (id) => !id.startsWith(".") && !id.startsWith("/")
    },
    {
        entry: { jlibFormats: "./src/formats/additionalFormats.ts" },
        format: "iife",
        globalName: "jlibFormats",
        platform: "browser",
        sourcemap: false,
        // Bundle anything that's not a relative/absolute path (=> node_modules)
        noExternal: (id) => !id.startsWith(".") && !id.startsWith("/")
    }
]);
