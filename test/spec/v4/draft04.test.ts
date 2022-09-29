/* eslint max-len: 0 */
import { expect } from "chai";
import chalk from "chalk";
import { Draft04 } from "../../../lib/draft04";
import { addRemotes } from "../utils/addRemotes";
import { getDraftTests, FeatureTest } from "../../getDraftTests";
import draft04Remote from "../../../remotes/draft04.json";

const cache = new Draft04();
cache.addRemoteSchema("http://json-schema.org/draft-04/schema", draft04Remote);
addRemotes(cache);

/*
ref relative refs with absolute uris and defs invalid on inner field:
RangeError: Maximum call stack size exceeded
 */

const supportedTestCases = (t: FeatureTest) =>
    t.optional
        ? ![
              "ecmascript-regex",
              "format-date-time",
              "non-bmp-regex",
              "zeroTerminatedFloats",
              "float-overflow"
          ].includes(t.name)
        : true;
const draftFeatureTests = getDraftTests("4")
    // .filter(testcase => testcase.name === "float-overflow")
    .filter(supportedTestCases);

function runTestCase(tc: FeatureTest, skipTest: string[] = []) {
    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
        tc.testCases.forEach((testCase) => {
            const schema = testCase.schema;
            if (skipTest.includes(testCase.description)) {
                console.log(chalk.red(`Unsupported '${testCase.description}'`));
                return;
            }

            describe(testCase.description, () => {
                testCase.tests.forEach((testData) => {
                    const test = skipTest.includes(testData.description) ? it.skip : it;

                    test(testData.description, () => {
                        const validator = new Draft04(schema);
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
    describe("draft04", () => {
        draftFeatureTests.forEach((testCase) => runTestCase(testCase, skipTest));
    });
}

runAllTestCases();
