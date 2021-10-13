/* eslint max-len: 0 */
import { expect } from "chai";
import chalk from "chalk";
import Draft04 from "../../../lib/cores/Draft04";
import addSchema from "../../../lib/addSchema";
import { addRemotes } from "../utils/addRemotes";
import TestSuite from "@json-schema-org/tests";
import draft04 from "../../../remotes/draft04.json";

addRemotes(addSchema);
addSchema("http://json-schema.org/draft-04/schema", draft04);

const testCases = TestSuite.draft4()
    .filter(testcase => !testcase.optional);

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
    describe("draft04", () => {
        testCases.forEach(testCase => runTestCase(Core, testCase, skipTest));
    });
}

runAllTestCases(Draft04);
