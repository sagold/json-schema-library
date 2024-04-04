/* eslint max-len: 0 */
import { expect } from "chai";
import { Draft2019 } from "../../../lib/draft2019";
import { addRemotes } from "../utils/addRemotes";
import draft2019Meta from "../../../remotes/draft2019-09.json";
import { getDraftTests, FeatureTest } from "../../getDraftTests";

const cache = new Draft2019();
cache.addRemoteSchema("http://json-schema.org/draft-2019-09/schema", draft2019Meta);
addRemotes(cache);

const supportedTestCases = (t: FeatureTest) => !t.optional &&
    // currently skip vocabulary support - this requires parsing metaschema for support validation methods
    // this will be an additional interface customizing json-schema-library
    t.name !== "vocabulary"
    && t.name === "unevaluatedProperties"
// refRemote
// t.optional
//     ? ![
//         "format-ecmascript-regex",
//         "content",
//         "ecmascript-regex",
//         "format-time",
//         "format-date-time",
//         "format-iri",
//         "format-iri-reference",
//         "format-idn",
//         "format-idn-reference",
//         "format-idn-hostname",
//         // "format-idn-email",
//         "float-overflow",
//         "non-bmp-regex"
//     ].includes(t.name)
//     : true;
const draftFeatureTests = getDraftTests("2019-09")
    // .filter(testcase => testcase.name === "definitions")
    .filter(supportedTestCases);

// https://json-schema.org/understanding-json-schema/structuring.html#id
// const testCases = [testRefRemote];

/*
  ✓ unevaluatedProperties
 */


const postPonedTestcases = [
    // @todo unevaluatedProperties
    // https://stackoverflow.com/questions/66936884/deeply-nested-unevaluatedproperties-and-their-expectations
    // this tests expects knowledge of a parent-allOf statement
    // we currently do not have the logic for this
    "property is evaluated in an uncle schema to unevaluatedProperties"
];


function runTestCase(tc: FeatureTest, skipTest: string[] = []) {
    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
        tc.testCases.forEach((testCase) => {
            // if (testCase.description !== "property is evaluated in an uncle schema to unevaluatedProperties") {
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
