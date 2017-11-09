/* eslint max-nested-callbacks: 0 */
const TestSuite = require("json-schema-test-suite");
const Draft04 = require("../../lib/cores/Draft04");
const expect = require("chai").expect;

// filter test files
function filter(file, parent, optional) {
    if (file.includes("anyOf")) {
        console.log("AnyOf not yet supported");
        return false;
    } else if (file.includes("allOf")) {
        console.log("allOf not yet supported");
        return false;
    } else if (file.includes("definitions")) {
        console.log("definitions not yet supported");
        return false;
    } else if (file.includes("format")) {
        console.log("specific format validations not yet supported");
        return false;
    } else if (file.includes("dependencies")) {
        console.log("dependencies not yet supported");
        return false;
    } else if (file.includes("refRemote")) {
        console.log("remote references not yet supported");
        return false;
    }


    // console.log("FILTER", file, parent, optional);
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
                        expect(test.result.valid).to.eq(test.valid,
                            `${test.description}\nschema: ${JSON.stringify(schema.schema)}\ndata: ${JSON.stringify(test.data)}`
                        );
                    });
                });
            });
        });
    });
});
