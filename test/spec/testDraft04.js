const TestSuite = require("json-schema-test-suite");
const expect = require("chai").expect;
const chalk = require("chalk");

// setup remote files
const remotes = require("../../remotes");
remotes["http://localhost:1234/integer.json"] = require("json-schema-test-suite/remotes/integer.json");
remotes["http://localhost:1234/subSchemas.json"] = require("json-schema-test-suite/remotes/subSchemas.json");

// ignore theese tests
const skipTest = [
    "changed scope ref invalid" // not going to be supported (combination of id, folder, refs)
];

// filter test files
function filter(file, parent, optional) {
    if (file.includes("bignum")) {
        console.log(chalk.grey(`- ${optional ? "optional " : ""}bignum not supported`));
        return false;
    } else if (file.includes("zeroTerminatedFloats")) {
        console.log(chalk.grey("- zeroTerminatedFloats can not be satisfied with javascript"));
        return false;
    }

    return true;
}


function runTests(Core) {
    // generate tests
    const tests = TestSuite.testSync(validatorFactory, filter, "draft4");

    // wrap validator to fit test-suite
    function validatorFactory(schema) {
        const core = new Core(schema);
        return {
            validate: (data) => {
                const errors = core.validate(schema, data);
                return errors.length === 0 ? { valid: true } : { valid: false, errors };
            }
        };
    }

    function runTest(testCase, schema, test) {
        const testFunction = skipTest.includes(test.description) ? it.skip : it;
        testFunction(`${test.description} (${testCase.file})`, () => {
            // eslint-disable-next-line max-len
            expect(test.result.valid).to.eq(test.valid, `${test.description}\nschema: ${JSON.stringify(schema.schema)}\ndata: ${JSON.stringify(test.data)}`);
        });
    }

    // run assertions
    tests.forEach((testCase) => {
        testCase.schemas.forEach((schema) => {
            describe(`[${testCase.name}] ${schema.description}`, () => {
                schema.tests.forEach((test) => runTest(testCase, schema, test));
            });
        });
    });
}


module.exports = runTests;
