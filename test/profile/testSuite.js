/* eslint max-len: 0 */
const glob = require("glob");
const path = require("path");
const flattenArray = require("../../lib/utils/flattenArray");
const addSchema = require("../../lib/addSchema");
const Core = require("../../lib/cores/Draft04");

// setup remote files
addSchema("http://localhost:1234/integer.json", require("json-schema-test-suite/remotes/integer.json"));
addSchema("http://localhost:1234/subSchemas.json", require("json-schema-test-suite/remotes/subSchemas.json"));
addSchema("http://localhost:1234/name.json", require("json-schema-test-suite/remotes/name.json"));


const globPattern = path.join(__dirname, "..", "..", "node_modules", "json-schema-test-suite", "tests", "draft4", "**", "*.json");
let draft04TestCases = glob.sync(globPattern);
if (draft04TestCases.length === 0) {
    throw new Error(`Failed retrieving tests from ${globPattern}`);
}

// load TestCases
draft04TestCases = flattenArray(draft04TestCases.map(require));


function runTests() {
    draft04TestCases.forEach((testCase) => {
        const schema = testCase.schema;
        testCase.tests.forEach((testData) => {
            const testSchema = JSON.parse(JSON.stringify(schema));
            const validator = new Core(testSchema);
            validator.isValid(testSchema, testData.data);
        });
    });
}


runTests();
