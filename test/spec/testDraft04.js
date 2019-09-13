/* eslint max-len: 0 */
const expect = require("chai").expect;
const glob = require("glob");
const path = require("path");
const chalk = require("chalk");
const flattenArray = require("../../lib/utils/flattenArray");
const addSchema = require("../../lib/addSchema");

// setup remote files
addSchema("http://localhost:1234/integer.json", require("json-schema-test-suite/remotes/integer.json"));
addSchema("http://localhost:1234/subSchemas.json", require("json-schema-test-suite/remotes/subSchemas.json"));
addSchema("http://localhost:1234/name.json", require("json-schema-test-suite/remotes/name.json"));
addSchema("http://localhost:1234/folder/folderInteger.json", require("json-schema-test-suite/remotes/folder/folderInteger.json"));

// fetch TestCases
const globPattern = path.join(__dirname, "..", "..", "node_modules", "json-schema-test-suite", "tests", "draft4", "**", "*.json");
// const globPattern = path.join(__dirname, "..", "..", "node_modules", "json-schema-test-suite", "tests", "draft4", "ref.json");
let draft04TestCases = glob.sync(globPattern);
if (draft04TestCases.length === 0) {
    throw new Error(`Failed retrieving tests from ${globPattern}`);
}

// load TestCases
draft04TestCases = flattenArray(draft04TestCases.map(require));


function runTests(Core, skipTest = []) {
    draft04TestCases.forEach((testCase) => {
        const schema = testCase.schema;
        if (skipTest.includes(testCase.description)) {
            console.log(chalk.red(`Unsupported '${testCase.description}'`));
            return;
        }

        describe(testCase.description, () => {
            testCase.tests.forEach((testData) => {
                const test = skipTest.includes(testData.description) ? it.skip : it;

                test(testData.description, () => {
                    const testSchema = JSON.parse(JSON.stringify(schema));
                    const validator = new Core(testSchema);
                    const isValid = validator.isValid(testSchema, testData.data);
                    expect(isValid).to.eq(testData.valid);
                });
            });
        });
    });
}


module.exports = runTests;
