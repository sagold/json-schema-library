import { defineConfig } from "tsdown";

export default defineConfig({
    dts: true,
    entry: ["./index.ts", "./remotes/index.ts"],
    exports: true,
    globalName: "jlib"
});
