/* eslint max-len: 0 */
import { expect } from "chai";
import { Draft2019 } from "../../../lib/draft2019";
import { addRemotes } from "../utils/addRemotes";
import draft2019Meta from "../../../remotes/draft2019-09.json";
import { getDraftTests, FeatureTest } from "../../getDraftTests";

const cache = new Draft2019();
cache.addRemoteSchema("https://json-schema.org/draft/2019-09/schema", draft2019Meta);
addRemotes(cache);

const supportedTestCases = (t: FeatureTest) => !t.optional
    // && t.name === "refRemote"
    && ![
        // todo list
        "not",
        "recursiveRef",
        "vocabulary"
    ].includes(t.name)
const draftFeatureTests = getDraftTests("2019-09")
    .filter(supportedTestCases);

/*
~ not
~ ref
~ refRemote
~ unevaluatedItems - expect for uncle-schema and recursiveRef support
~ unevaluatedProperties - expect for uncle-schema and recursiveRef support
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
✓ dependentRequired
✓ dependentSchemas
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
✓ required
✓ type
✓ uniqueItems
✓ unknownKeyword
✖ defs
✖ recursiveRef
✖ vocabulary - skipped evaluation of meta-schema
*/


const postponedTestcases = [
    // possible errors in tests
    "root ref in remote ref", // remoteRef
    // @todo validate $def-syntax against metaschema
    "validate definition against metaschema",
    // @todo evaluate support by meta-schema
    // we need to evaluate meta-schema for supported validation methods
    // we currently do not have the logic for this
    "schema that uses custom metaschema with with no validation vocabulary", // vocabulary
    "remote ref, containing refs itself", // ref
    "ref creates new scope when adjacent to keywords", // ref
    // @todo when recursiveRef is implemented
    "unevaluatedProperties with $recursiveRef",
    "unevaluatedItems with $recursiveRef",
    // @todo when anchor ref is implemented
    "URN base URI with URN and anchor ref", // ref
    "order of evaluation: $id and $anchor and $ref", // ref
    // @todo support uncle-schema
    // https://stackoverflow.com/questions/66936884/deeply-nested-unevaluatedproperties-and-their-expectations
    // this tests expects knowledge of a parent-allOf statement
    // we currently do not have the logic for this
    "property is evaluated in an uncle schema to unevaluatedProperties", // unevaluatedProperties
    "item is evaluated in an uncle schema to unevaluatedItems", // unevaluatedItems
];


function runTestCase(tc: FeatureTest, skipTest: string[] = []) {
    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
        tc.testCases.forEach((testCase) => {

            // if (testCase.description !== "retrieved nested refs resolve relative to their URI not $id") { return; }

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
