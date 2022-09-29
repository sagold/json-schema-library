/* eslint max-len: 0 */
import chalk from "chalk";
import { Draft06 } from "../../../lib/draft06";
import { addRemotes } from "../utils/addRemotes";
import { expect } from "chai";
import { getDraftTests, FeatureTest, TestCase, Test } from "../../getDraftTests";
import draft06Remote from "../../../remotes/draft06.json";

const cache = new Draft06();
cache.addRemoteSchema("http://json-schema.org/draft-06/schema", draft06Remote);
addRemotes(cache);

const supportedTestCases = (t: FeatureTest) =>
    t.optional
        ? !["ecmascript-regex", "format-date-time", "float-overflow", "non-bmp-regex"].includes(
              t.name
          )
        : true;
const draftFeatureTests = getDraftTests("6").filter(supportedTestCases);

function runTestCase(tc: FeatureTest, skipTest: string[] = []) {
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
                        const validator = new Draft06(schema);
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
    describe("draft06", () => {
        draftFeatureTests.forEach((testCase) => runTestCase(testCase, skipTest));
    });
}

runAllTestCases();
