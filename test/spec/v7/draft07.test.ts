/* eslint max-len: 0 */
import { expect } from "chai";
import chalk from "chalk";
import Draft07 from "../../../lib/cores/Draft07";
import addSchema from "../../../lib/draft06/addSchema";
import { addRemotes } from "../utils/addRemotes";
import TestSuite from "@json-schema-org/tests";
import draft07 from "../../../remotes/draft07.json";

addRemotes(addSchema);
addSchema("http://json-schema.org/draft-07/schema", draft07);

const supportedTestCases = t => t.optional ? !["ecmascript-regex", "content", "iri", "iri-reference", "idn", "idn-reference", "idn-hostname", "idn-email", "float-overflow", "non-bmp-regex"].includes(t.name) : true;

const testCases = TestSuite.draft7()
    // .filter(testcase => testcase.name === "refRemote")
    // .filter(testcase => testcase.optional)
    .filter(supportedTestCases);


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
    describe("draft07", () => {
        testCases.forEach(testCase => runTestCase(Core, testCase, skipTest));
    });
}

runAllTestCases(Draft07);
