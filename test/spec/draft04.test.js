/* eslint max-nested-callbacks: 0 */
const TestSuite = require("json-schema-test-suite");
const Draft04 = require("../../lib/cores/Draft04");
const expect = require("chai").expect;
const chalk = require("chalk");


// setup remote files
const remotes = require("../../remotes");
remotes["http://localhost:1234/integer.json"] = require("json-schema-test-suite/remotes/integer.json");
remotes["http://localhost:1234/subSchemas.json"] = require("json-schema-test-suite/remotes/subSchemas.json");


// filter test files
function filter(file, parent, optional) {
    // console.log("FILTER", file, parent, optional);
    if (file.includes("format")) {
        console.log(chalk.grey(`- ${optional ? "optional " : ""}specific format validations not supported`));
        return false;
    } else if (file.includes("dependencies")) {
        console.log(chalk.red(`- ${optional ? "optional " : ""}dependencies not yet supported`));
        return false;
    } else if (file.includes("refRemote")) {
        console.log(chalk.red(`- ${optional ? "optional " : ""}remote references not yet supported`));
        return false;
    } else if (file.includes("bignum")) {
        console.log(chalk.grey(`- ${optional ? "optional " : ""}bignum not supported`));
        return false;
    } else if (file.includes("zeroTerminatedFloats")) {
        console.log(chalk.grey("- zeroTerminatedFloats can not be satisfied with javascript"));
        return false;
    }

    return true;
}

// wrap validator to fit test-suite
function validatorFactory(schema) {
    const core = new Draft04(schema);
    return {
        validate: (data) => {
            const errors = core.validate(schema, data);
            return errors.length === 0 ? { valid: true } : { valid: false, errors };
        }
    };
}

// generate tests
const tests = TestSuite.testSync(validatorFactory, filter, "draft4");

// run assertions
tests.forEach((testCase) => {
    describe(testCase.name, () => {
        testCase.schemas.forEach((schema) => {

            describe(schema.description, () => {
                schema.tests.forEach((test) => {

                    it(`${test.description} (${testCase.file})`, () => {
                        // eslint-disable-next-line max-len
                        expect(test.result.valid).to.eq(test.valid, `${test.description}\nschema: ${JSON.stringify(schema.schema)}\ndata: ${JSON.stringify(test.data)}`);
                    });
                });
            });
        });
    });
});
