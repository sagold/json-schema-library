import glob from "glob";
import path from "path";
import fs from "fs";

type JsonSchemaTestFileContents = {
    description: string;
    schema: Record<string, any>;
    tests: {
        description: string;
        data: any;
        valid: boolean;
    }[]
}[];

function readTestFile(filepath: string): TestCase[] {
    const contents = fs.readFileSync(filepath, "utf-8").toString();
    const testCaseData : JsonSchemaTestFileContents = JSON.parse(contents);
    return testCaseData;
}

function getFilenameAttributes(filename: string) {
    let relative = filename.split(/draft[^/]+\//).pop();
    relative = relative.replace(".json", "").replace(/^\//, "");
    const attributes = relative.replace(".json", "").split("/");
    const optional = attributes[0] === "optional" ? (attributes.shift() && true) : false;
    return { optional, name: attributes.join("-") };
}

type Draft = "4"|"6"|"7"|"2019-09"|"2020-12";

export type FeatureTest = {
    /** name of feature being tests, e.g. additionalItems */
    name: string;
    /** if the test is retrieved from optional tests */
    optional?: boolean;
    /** list of test cases of feature */
    testCases: TestCase[]
}

export type TestCase = {
    description: string;
    schema: Record<string, any>;
    tests: Test[];
}

export type Test = {
    description: string;
    data: any;
    valid: boolean;
}

export function getDraftTests(draft: Draft): FeatureTest[] {
    const source = path.resolve(`./node_modules/json-schema-test-suite/tests/draft${draft}`);
    const filenames = glob.sync(`${source}/**/*.json`);
    const testCases: FeatureTest[] = filenames
        .map(filename => {
            const testCaseData = readTestFile(filename);
            const { optional, name } = getFilenameAttributes(filename);
            return {
                name,
                testCases: testCaseData,
                optional
            }
        });

    return testCases;
}
