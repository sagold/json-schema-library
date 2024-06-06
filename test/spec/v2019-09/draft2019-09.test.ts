/* eslint max-len: 0 */
import { expect } from "chai";
import { Draft2019 } from "../../../lib/draft2019";
import { addRemotes } from "../utils/addRemotes";
import draft2019Meta from "../../../remotes/draft2019-09.json";
import draft2019MetaApplicator from "../../../remotes/draft2019-09_meta_applicator.json";
import draft2019MetaContent from "../../../remotes/draft2019-09_meta_content.json";
import draft2019MetaCore from "../../../remotes/draft2019-09_meta_core.json";
import draft2019MetaFormat from "../../../remotes/draft2019-09_meta_format.json";
import draft2019MetaMetaData from "../../../remotes/draft2019-09_meta_meta-data.json";
import draft2019MetaValidation from "../../../remotes/draft2019-09_meta_validation.json";
import { getDraftTests, FeatureTest } from "../../getDraftTests";

const cache = new Draft2019();
[
    draft2019Meta,
    draft2019MetaApplicator,
    draft2019MetaCore,
    draft2019MetaContent,
    draft2019MetaFormat,
    draft2019MetaMetaData,
    draft2019MetaValidation
].forEach((schema) => {
    cache.addRemoteSchema(schema.$id, schema);
});
addRemotes(cache);

const supportedTestCases = (t: FeatureTest) =>
    ![
        // TODO CORE FEATURES
        "vocabulary",
        // OPTIONAL FEATURES
        "cross-draft", // feature
        "ecmascript-regex", // should
        "float-overflow",
        "dependencies-compatibility", // should
        "format-iri",
        "format-iri-reference",
        "format-idn-hostname",
        "non-bmp-regex", // should
        "patterns always use unicode semantics with patternProperties"
    ].includes(t.name);

const draftFeatureTests = getDraftTests("2019-09")
    // .filter((testcase) => testcase.name === "dependencies-compatibility")
    // .filter((testcase) => testcase.name === "format-uuid")
    .filter(supportedTestCases);

/*
~ not - expect for uncle-schema support
~ ref - except meta-schema evaluation
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
✓ refRemote
✓ required
✓ type
✓ uniqueItems
✓ unknownKeyword
✓ defs
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
            // if (testCase.description !== "$recursiveRef with nesting") { return; }
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
