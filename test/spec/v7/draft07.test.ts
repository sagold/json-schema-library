/* eslint max-len: 0 */
import { expect } from "chai";
import { Draft07 } from "../../../lib/draft07";
import { addRemotes } from "../utils/addRemotes";
import { getDraftTests, FeatureTest } from "../../getDraftTests";
import draft07Meta from "../../../remotes/draft07.json";

const cache = new Draft07();
cache.addRemoteSchema("http://json-schema.org/draft-07/schema", draft07Meta);
addRemotes(cache);

const supportedTestCases = (t: FeatureTest) =>
    t.optional ? ![
        "format-ecmascript-regex",
        "content",
        // @draft 2020-12 todo
        // referenced 2020 draft vocabulary here - we do not have this ready yet
        // "refs to future drafts are processed as future drafts"
        "cross-draft",
        "ecmascript-regex",
        "format-time",
        "format-date-time",
        "format-iri",
        "format-iri-reference",
        "format-idn",
        "format-idn-reference",
        "format-idn-hostname",
        // "format-idn-email",
        "float-overflow",
        "non-bmp-regex"
    ].includes(t.name)
        : true;

const postponedTestcases: string[] = [];

const draftFeatureTests = getDraftTests("7")
    // .filter(testcase => testcase.name === "cross-draft")
    .filter(supportedTestCases)

function runTestCase(tc: FeatureTest, skipTest: string[] = []) {
    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
        tc.testCases.forEach((testCase) => {

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
                        const validator = new Draft07(schema);
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
    describe("draft07", () => {
        draftFeatureTests.forEach((testCase) => runTestCase(testCase, skipTest));
    });
}

runAllTestCases();
