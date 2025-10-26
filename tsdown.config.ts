import { defineConfig } from "tsdown";

console.log("RUNNING tsdown config");

export default defineConfig({
    dts: true,
    entry: ["./index.ts"],
    exports: true,
    globalName: "jlib"
});
