import { defineConfig } from "tsdown";

console.log("RUNNING tsdown config");

export default defineConfig({
    entry: ["./index.ts"],
    exports: true,
    globalName: "jlib"
});
