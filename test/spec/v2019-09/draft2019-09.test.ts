/* eslint max-len: 0 */
import { expect } from "chai";
import { Draft2019 } from "../../../lib/draft2019";
import { addRemotes } from "../utils/addRemotes";
import draft2019Meta from "../../../remotes/draft2019-09.json";
import { getDraftTests, FeatureTest } from "../../getDraftTests";

const cache = new Draft2019();
cache.addRemoteSchema("http://json-schema.org/draft-2019-09/schema", draft2019Meta);
addRemotes(cache);

const supportedTestCases = (t: FeatureTest) => !t.optional && t.name === "unevaluatedItems"
const draftFeatureTests = getDraftTests("2019-09")
    .filter(supportedTestCases);

/*
✓ additionalItems
✓ additionalProperties
✓ allOf
✓ anyOf
✓ boolean_schema
✓ const
✓ contains
✓ content
✓ default
✓ enum
✓ exclusiveMaximum
✓ exclusiveMinimum
✓ format
✓ if-then-else
✓ infinite-loop-detection
✓ items
✓ maximum
✓ maxItems
✓ maxLength
✓ maxProperties
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
✓ required
✓ type
✓ unevaluatedProperties - expect for one test
✓ uniqueItems
✓ unknownKeyword
✖ anchor
✖ defs
✖ dependentRequired
✖ dependentSchemas
✖ id
✖ maxContains
✖ minContains
✖ not
✖ recursiveRef
✖ ref
✖ refRemote
✖ unevaluatedItems
✖ vocabulary - skipped evaluation of meta-schema
*/


const postPonedTestcases = [
    // @todo vocabulary
    // we need to evaluate meta-schema for supported validation methods
    // we currently do not have the logic for this
    "schema that uses custom metaschema with with no validation vocabulary",
    // @todo unevaluatedProperties
    // https://stackoverflow.com/questions/66936884/deeply-nested-unevaluatedproperties-and-their-expectations
    // this tests expects knowledge of a parent-allOf statement
    // we currently do not have the logic for this
    "property is evaluated in an uncle schema to unevaluatedProperties",
    // @todo unevaluatedItems
    "item is evaluated in an uncle schema to unevaluatedItems",
    "when one schema matches and has no unevaluated items",
    // "unevaluatedItems with if/then/else",
    // @todo unevaluatedItems with nested tuple
    // this is a bug in mergeSchema, where we should not append items-array in allOf
    "unevaluatedItems with nested tuple",
    "unevaluatedItems with anyOf",
    "unevaluatedItems with oneOf",
    "unevaluatedItems with if/then/else",
    "unevaluatedItems with $ref"
];


function runTestCase(tc: FeatureTest, skipTest: string[] = []) {
    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
        tc.testCases.forEach((testCase) => {
            // if (testCase.description !== "unevaluatedItems with oneOf") {
            //     return;
            // }

            const schema = testCase.schema;
            if (skipTest.includes(testCase.description)) {
                console.log(`Unsupported '${testCase.description}'`);
                return;
            }

            describe(testCase.description, () => {
                testCase.tests.forEach((testData) => {
                    const test = skipTest.includes(testData.description) ? it.skip : it;

                    if (postPonedTestcases.includes(testCase.description)) {
                        it.skip(testData.description, () => {});
                        return;
                    }

                    test(testData.description, () => {
                        const validator = new Draft2019(schema);
                        Object.assign(validator.remotes, cache.remotes);
                        const isValid = validator.isValid(testData.data);
                        expect(isValid).to.eq(testData.valid);
                    });
                });
            });
        });
    });
}

export default function runAllTestCases(skipTest: string[] = []) {
    describe("draft2019", () => {
        draftFeatureTests.forEach((testCase) => runTestCase(testCase, skipTest));
    });
}

runAllTestCases();
