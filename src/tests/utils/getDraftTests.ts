import { globSync } from "glob";
import path from "path";
import fs from "fs";
import { JsonSchema } from "../../types";

type JsonSchemaTestFileContents = {
    description: string;
    schema: Record<string, any>;
    tests: {
        description: string;
        data: any;
        valid: boolean;
    }[];
}[];

function readTestFile(filepath: string): TestCase[] {
    const contents = fs.readFileSync(filepath, "utf-8").toString();
    const testCaseData: JsonSchemaTestFileContents = JSON.parse(contents);
    return testCaseData;
}

function getFilenameAttributes(filename: string) {
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

export type DraftVersion = "4" | "6" | "7" | "2019-09" | "2020-12";

export type FeatureTest = {
    /** name of feature being tests, e.g. additionalItems */
    name: string;
    /** if the test is retrieved from optional tests */
    optional?: boolean;
    /** list of test cases of feature */
    testCases: TestCase[];
};

export type TestCase = {
    description: string;
    schema: Record<string, any>;
    tests: Test[];
};

export type Test = {
    description: string;
    data: any;
    valid: boolean;
};

export type Setup = {
    logSchema?: boolean;
    only?: { name: string; description?: string };
    skipTestCase: (t: FeatureTest) => boolean;
    /** $schema string identifying draft, like https://json-schema.org/draft/2019-09/schema */
    metaSchema: JsonSchema;
    metaSchemaList?: JsonSchema[];
    skipTests?: string[];
};

export function getDraftTests(draft: DraftVersion): FeatureTest[] {
    const source = path.resolve(`./node_modules/json-schema-test-suite/tests/draft${draft}`);
    const filenames = globSync(`${source}/**/*.json`);
    const testCases: FeatureTest[] = filenames.map((filename) => {
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
