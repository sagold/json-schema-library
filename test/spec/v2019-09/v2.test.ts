/* eslint max-len: 0 */
import { expect } from "chai";
import { Draft2019 } from "../../../lib/draft2019";
import draft2019Meta from "../../../remotes/draft2019-09.json";
import draft2019MetaApplicator from "../../../remotes/draft2019-09_meta_applicator.json";
import draft2019MetaContent from "../../../remotes/draft2019-09_meta_content.json";
import draft2019MetaCore from "../../../remotes/draft2019-09_meta_core.json";
import draft2019MetaFormat from "../../../remotes/draft2019-09_meta_format.json";
import draft2019MetaMetaData from "../../../remotes/draft2019-09_meta_meta-data.json";
import draft2019MetaValidation from "../../../remotes/draft2019-09_meta_validation.json";
import { getDraftTests, FeatureTest } from "../../getDraftTests";
import { compileSchema } from "../../../v2/compileSchema";

const supportedTestCases = (t: FeatureTest) =>
    [
        // "ref",
        // "exclusiveMaximum",
        // "exclusiveMinimum"
        "if-then-else"
        // "allOf"
        // "not"
        // "enum"
        // "additionalItems",
        // // "allOf",
        // "const",
        // "maximum",
        // "minimum",
        // "oneOf",
        // "additionalProperties",
        // "patternProperties",
        // // "contains",
        // // "items",
        // "maxContains",
        // "maxItems",
        // "maxLength",
        // "maxProperties",
        // "minContains",
        // "minItems",
        // "minLength",
        // "minProperties",
        // "multipleOf",
        // "properties",
        // "required",
        // "type"
        // "uniqueItems"
    ].includes(t.name);

const draftFeatureTests = getDraftTests("2019-09").filter(supportedTestCases);

/*
✓ additionalItems
✓ additionalProperties
✓ const
✓ exclusiveMaximum
✓ exclusiveMinimum
✓ enum
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
✓ patternProperties
✓ properties
✓ required
✓ type
✖ if-then-else
✖ not - expect for uncle-schema support
✓ allOf - expect anyOf combination
✖ contains
✖ items - ref $defs resolution missing
✖ ref - except meta-schema evaluation
✖ uniqueItems

✖ unevaluatedItems - expect for uncle-schema and recursiveRef support
✖ unevaluatedProperties - expect for uncle-schema and recursiveRef support
✖ anchor
✖ anyOf
✖ boolean_schema
✖ content
✖ default
✖ dependentRequired
✖ dependentSchemas
✖ format
✖ infinite-loop-detection
✖ pattern
✖ propertyNames
✖ refRemote
✖ unknownKeyword
✖ defs
✖ recursiveRef
✖ vocabulary - skipped evaluation of meta-schema
*/

const postponedTestcases = [
    // @todo when recursiveRef is implemented
    "unevaluatedProperties with $recursiveRef",
    "unevaluatedItems with $recursiveRef",
    // @vocabulary
    // @todo evaluate support by meta-schema
    // we need to evaluate meta-schema for supported validation methods we currently do not have the logic for this
    "schema that uses custom metaschema with with no validation vocabulary", // vocabulary
    "remote ref, containing refs itself", // ref
    "ref creates new scope when adjacent to keywords", // ref
    // @todo support uncle-schema
    // https://stackoverflow.com/questions/66936884/deeply-nested-unevaluatedproperties-and-their-expectations
    // this tests expects knowledge of a parent-allOf statement we currently do not have the logic for this
    "property is evaluated in an uncle schema to unevaluatedProperties", // unevaluatedProperties
    "item is evaluated in an uncle schema to unevaluatedItems", // unevaluatedItems
    "collect annotations inside a 'not', even if collection is disabled" // not
];

function runTestCase(tc: FeatureTest, skipTest: string[] = []) {
    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
        tc.testCases.forEach((testCase) => {
            // if (testCase.description !== "if with boolean schema false") {
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
                        const validator = new Draft2019();
                        console.log(
                            testData.description,
                            JSON.stringify(schema, null, 2),
                            JSON.stringify(testData.data, null, 2)
                        );
                        const node = compileSchema(validator, schema);
                        [
                            draft2019Meta,
                            draft2019MetaApplicator,
                            draft2019MetaCore,
                            draft2019MetaContent,
                            draft2019MetaFormat,
                            draft2019MetaMetaData,
                            draft2019MetaValidation
                        ].forEach((schema) => node.addRemote(schema.$id, schema));
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
        draftFeatureTests.forEach((testCase) => runTestCase(testCase, skipTest));
    });
}

runAllTestCases();
