/* eslint max-len: 0 */
import draft07Meta from "../../../remotes/draft07.json";
import path from "path";
import { compileSchema } from "../../../v2/compileSchema";
import { expect } from "chai";
import { getDraftTests, FeatureTest } from "../../getDraftTests";
import { globSync } from "glob";
import { SchemaNode } from "../../../v2/types";
import { isObject } from "../../../lib/utils/isObject";

const skipTestCase = (t: FeatureTest) =>
    ![
        "content",
        "ecmascript-regex",
        "float-overflow",
        "format-iri",
        "format-iri-reference",
        "format-idn-hostname",
        "non-bmp-regex"
    ].includes(t.name); //t.optional === false;

function addRemotes(node: SchemaNode, baseURI = "http://localhost:1234") {
    [draft07Meta].forEach((schema) => node.addRemote(schema.$id, schema));

    // setup remote files
    const remotesPattern = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "node_modules",
        "json-schema-test-suite",
        "remotes",
        "**",
        "*.json"
    );
    const remotes = globSync(remotesPattern);
    remotes.forEach((filepath: string) => {
        const file = require(filepath); // eslint-disable-line
        const remoteId = `${baseURI}/${filepath.split("/remotes/").pop()}`;
        node.addRemote(remoteId, { $schema: "/draft-07/schema", ...file });
    });
}

function runTestCase(tc: FeatureTest) {
    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
        tc.testCases.forEach((testCase) => {
            // if (testCase.description !== "base URI change - change folder") {
            //     return;
            // }
            const schema = testCase.schema;
            describe(testCase.description, () => {
                testCase.tests.forEach((testData) => {
                    it(testData.description, () => {
                        // console.log(
                        //     testData.description,
                        //     JSON.stringify(schema, null, 2),
                        //     JSON.stringify(testData.data, null, 2)
                        // );
                        const testSchema = isObject(schema) ? { $schema: "/draft-07/schema", ...schema } : schema;
                        const node = compileSchema(testSchema);
                        addRemotes(node);
                        const errors = node.validate(testData.data);
                        expect(errors.length === 0).to.eq(testData.valid);
                    });
                });
            });
        });
    });
}

export default function runAllTestCases() {
    describe("draft07", () => {
        getDraftTests("7")
            .filter((tc) => {
                const runTestCase = skipTestCase(tc);
                if (!runTestCase) {
                    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
                        tc.testCases.forEach((test) => it.skip(test.description, () => {}));
                    });
                }
                return runTestCase;
            })
            .forEach((testCase) => runTestCase(testCase));
    });
}

runAllTestCases();
