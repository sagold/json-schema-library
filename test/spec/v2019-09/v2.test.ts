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

const skipTestCase = (t: FeatureTest) =>
    ![
        "vocabulary", // must
        // optionals
        "cross-draft", // should
        "ecmascript-regex", // should
        "float-overflow",
        "format-idn-hostname",
        "format-iri",
        "format-iri-reference",
        "non-bmp-regex", // should
        "refOfUnknownKeyword"
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

function runTestCase(tc: FeatureTest) {
    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
        tc.testCases.forEach((testCase) => {
            // if (testCase.description !== "ref overrides any sibling keywords") {
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

export default function runAllTestCases() {
    describe("draft2019", () => {
        getDraftTests("2019-09")
            .filter((tc) => {
                const runTestCase = skipTestCase(tc);
                if (!runTestCase) {
                    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
                        tc.testCases.forEach((test) => it.skip(test.description, () => {}));
                    });
                }
                return runTestCase;
            })
            .forEach(runTestCase);
    });
}

runAllTestCases();
