import { globSync } from "glob";
import path from "path";
import fs from "fs";
function readTestFile(filepath) {
    const contents = fs.readFileSync(filepath, "utf-8").toString();
    const testCaseData = JSON.parse(contents);
    return testCaseData;
}
function getFilenameAttributes(filename) {
    let relative = filename.split(/draft[^/]+\//).pop();
    if (relative == null) {
        throw new Error(`Error in spec generation. Failed parsing filename '${filename}'`);
    }
    relative = relative.replace(".json", "").replace(/^\//, "");
    const attributes = relative.replace(".json", "").split("/");
    let optional = false;
    if (attributes[0] === "optional") {
        attributes.shift();
        optional = true;
    }
    return { optional, name: attributes.join("-") };
}
export function getDraftTests(draft) {
    const source = path.resolve(`./node_modules/json-schema-test-suite/tests/draft${draft}`);
    const filenames = globSync(`${source}/**/*.json`);
    const testCases = filenames.map((filename) => {
        const testCaseData = readTestFile(filename);
        const { optional, name } = getFilenameAttributes(filename);
        return {
            name,
            testCases: testCaseData,
            optional
        };
    });
    return testCases;
}
