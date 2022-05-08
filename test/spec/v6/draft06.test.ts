/* eslint max-len: 0 */
import addSchema from "../../../lib/draft06/addSchema";
import chalk from "chalk";
import Draft06 from "../../../lib/cores/Draft06";
import draft06 from "../../../remotes/draft06.json";
import { addRemotes } from "../utils/addRemotes";
import { expect } from "chai";
import { getDraftTests, FeatureTest, TestCase, Test } from "../../getDraftTests"

addRemotes(addSchema);
addSchema("http://json-schema.org/draft-06/schema", draft06);

const supportedTestCases = t => t.optional ? !["ecmascript-regex", "float-overflow", "non-bmp-regex"].includes(t.name) : true;
const draftFeatureTests = getDraftTests("6")
    // .filter(testcase => testcase.name === "definitions")
    .filter(supportedTestCases);

function runTestCase(Core, tc: FeatureTest, skipTest = []) {

    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {

        tc.testCases.forEach((testCase: TestCase) => {

            const schema = testCase.schema;
            if (skipTest.includes(testCase.description)) {
                console.log(chalk.red(`Unsupported '${testCase.description}'`));
                return;
            }

            describe(testCase.description, () => {

                testCase.tests.forEach((testData: Test) => {

                    const test = skipTest.includes(testData.description) ? it.skip : it;
                    test(testData.description, () => {
                        const validator = new Core(schema);
                        const isValid = validator.isValid(testData.data);
                        expect(isValid).to.eq(testData.valid);
                    });
                });
            });
        });
    });
}

export default function runAllTestCases(Core, skipTest = []) {
    describe("draft06", () => {
        draftFeatureTests.forEach(testCase => runTestCase(Core, testCase, skipTest));
    });
}

runAllTestCases(Draft06);
