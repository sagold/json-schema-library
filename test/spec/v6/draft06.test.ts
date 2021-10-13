/* eslint max-len: 0 */
import { expect } from "chai";
import chalk from "chalk";
import Draft06 from "../../../lib/cores/Draft06";
import addSchema from "../../../lib/draft07/addSchema";
import { addRemotes } from "../utils/addRemotes";
import TestSuite from "@json-schema-org/tests";
import draft06 from "../../../remotes/draft06.json";

addRemotes(addSchema);
addSchema("http://json-schema.org/draft-06/schema", draft06);

const testCases = TestSuite.draft6()
    .filter(testcase =>
        testcase.optional ? !["ecmascript-regex"].includes(testcase.name) : true
    );

// https://json-schema.org/understanding-json-schema/structuring.html#id
// const testCases = [testRefRemote];

function runTestCase(Core, tc, skipTest = []) {
    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
        tc.schemas.forEach(testCase => {
            const schema = testCase.schema;
            if (skipTest.includes(testCase.description)) {
                console.log(chalk.red(`Unsupported '${testCase.description}'`));
                return;
            }

            describe(testCase.description, () => {
                testCase.tests.forEach(testData => {
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
        testCases.forEach(testCase => runTestCase(Core, testCase, skipTest));
    });
}

runAllTestCases(Draft06);
