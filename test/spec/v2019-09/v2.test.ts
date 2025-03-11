/* eslint max-len: 0 */
import draft2019Meta from "../../../remotes/draft2019-09.json";
import draft2019MetaApplicator from "../../../remotes/draft2019-09_meta_applicator.json";
import draft2019MetaContent from "../../../remotes/draft2019-09_meta_content.json";
import draft2019MetaCore from "../../../remotes/draft2019-09_meta_core.json";
import draft2019MetaFormat from "../../../remotes/draft2019-09_meta_format.json";
import draft2019MetaMetaData from "../../../remotes/draft2019-09_meta_meta-data.json";
import draft2019MetaValidation from "../../../remotes/draft2019-09_meta_validation.json";
import path from "path";
import { compileSchema } from "../../../v2/compileSchema";
import { expect } from "chai";
import { getDraftTests, FeatureTest } from "../../getDraftTests";
import { globSync } from "glob";
import { SchemaNode } from "../../../v2/types";

const supportedTestCases = (t: FeatureTest) =>
    // t.optional === false
    [
        "defs",
        "additionalItems",
        "additionalProperties",
        "allOf",
        "anchor",
        "anyOf",
        "boolean_schema",
        "const",
        "contains",
        "content",
        "default",
        "dependentRequired",
        "dependentSchemas",
        "enum",
        "exclusiveMaximum",
        "exclusiveMinimum",
        "format",
        "if-then-else",
        "infinite-loop-detection",
        "items",
        "maxContains",
        "maximum",
        "maxItems",
        "maxLength",
        "maxProperties",
        "minContains",
        "minimum",
        "minItems",
        "minLength",
        "minProperties",
        "multipleOf",
        "not",
        "oneOf",
        "oneOf",
        "pattern",
        "patternProperties",
        "properties",
        "propertyNames",
        "recursiveRef",
        "ref",
        "refRemote",
        "required",
        "type",
        "uniqueItems",
        "unknownKeyword",
        "unevaluatedProperties",
        "unevaluatedItems"
        // "vocabulary"
    ].includes(t.name);

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
    [
        draft2019Meta,
        draft2019MetaApplicator,
        draft2019MetaCore,
        draft2019MetaContent,
        draft2019MetaFormat,
        draft2019MetaMetaData,
        draft2019MetaValidation
    ].forEach((schema) => node.addRemote(schema.$id, schema));

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
                        // console.log(
                        //     testData.description,
                        //     JSON.stringify(schema, null, 2),
                        //     JSON.stringify(testData.data, null, 2)
                        // );
                        const node = compileSchema(schema);
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
    describe("draft2019", () => {
        getDraftTests("2019-09")
            .filter(supportedTestCases)
            .forEach((testCase) => runTestCase(testCase, skipTest));
    });
}

runAllTestCases();
