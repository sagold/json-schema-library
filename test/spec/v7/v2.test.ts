/* eslint max-len: 0 */
import draft07Meta from "../../../remotes/draft07.json";
import path from "path";
import { compileSchema } from "../../../v2/compileSchema";
import { Draft07 } from "../../../lib/draft07";
import { expect } from "chai";
import { getDraftTests, FeatureTest } from "../../getDraftTests";
import { globSync } from "glob";
import { SchemaNode } from "../../../v2/compiler/types";

const supportedTestCases = (t: FeatureTest) =>
    t.optional === false && !["ref", "dependencies", "definitions", "refRemote"].includes(t.name);
// [
//     "defs",
//     "additionalItems",
//     "additionalProperties",
//     "allOf",
//     "anchor",
//     "anyOf",
//     "boolean_schema",
//     "const",
//     "contains",
//     "content",
//     "default",
//     "dependentRequired",
//     "dependentSchemas",
//     "enum",
//     "exclusiveMaximum",
//     "exclusiveMinimum",
//     "format",
//     "if-then-else",
//     "infinite-loop-detection",
//     "items",
//     "maxContains",
//     "maximum",
//     "maxItems",
//     "maxLength",
//     "maxProperties",
//     "minContains",
//     "minimum",
//     "minItems",
//     "minLength",
//     "minProperties",
//     "multipleOf",
//     "not",
//     "oneOf",
//     "oneOf",
//     "pattern",
//     "patternProperties",
//     "properties",
//     "propertyNames",
//     "recursiveRef",
//     "ref",
//     "refRemote",
//     "required",
//     "type",
//     "uniqueItems",
//     "unknownKeyword",
//     "unevaluatedProperties",
//     "unevaluatedItems"
// ].includes(t.name);

/*
~ not - expect for uncle-schema support
~ unevaluatedProperties - expect for uncle-schema and recursiveRef support
~ unevaluatedItems - expect for ref-merge order, uncle-schema and recursiveRef support
✓ additionalItems
✓ additionalProperties
✓ allOf
✓ anchor
✓ anyOf
✓ boolean_schema
✓ const
✓ contains
✓ content
✓ default
✓ defs
✓ dependentRequired
✓ enum
✓ exclusiveMaximum
✓ exclusiveMinimum
✓ format
✓ if-then-else
✓ infinite-loop-detection
✓ items
✓ maxContains
✓ maximum
✓ maxItems
✓ maxLength
✓ maxProperties
✓ minContains
✓ minimum
✓ minItems
✓ minLength
✓ minProperties
✓ multipleOf
✓ oneOf
✓ pattern
✓ patternProperties
✓ properties
✓ propertyNames
✓ recursiveRef
✓ ref
✓ refRemote
✓ required
✓ type
✓ uniqueItems
✓ unknownKeyword

✖ vocabulary - skipped evaluation of meta-schema
*/

const postponedTestcases: string[] = [];

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
        node.addRemote(remoteId, file);
    });
}

function runTestCase(tc: FeatureTest, skipTest: string[] = []) {
    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
        tc.testCases.forEach((testCase) => {
            // if (testCase.description !== "unevaluatedItems with $recursiveRef") {
            //     return;
            // }

            // if (testCase.description !== "remote ref, containing refs itself") { return; }

            const schema = testCase.schema;
            if (skipTest.includes(testCase.description)) {
                console.log(`Unsupported '${testCase.description}'`);
                return;
            }

            describe(testCase.description, () => {
                testCase.tests.forEach((testData) => {
                    const test = skipTest.includes(testData.description) ? it.skip : it;

                    if (postponedTestcases.includes(testCase.description)) {
                        it.skip(testData.description, () => {});
                        return;
                    }

                    test(testData.description, () => {
                        const validator = new Draft07();
                        // console.log(
                        //     testData.description,
                        //     JSON.stringify(schema, null, 2),
                        //     JSON.stringify(testData.data, null, 2)
                        // );
                        const node = compileSchema(validator, schema);
                        addRemotes(node);
                        const errors = node.validate(testData.data);
                        expect(errors.length === 0).to.eq(testData.valid);
                    });
                });
            });
        });
    });
}

export default function runAllTestCases(skipTest: string[] = []) {
    describe("draft07", () => {
        getDraftTests("7")
            .filter(supportedTestCases)
            .forEach((testCase) => runTestCase(testCase, skipTest));
    });
}

runAllTestCases();
