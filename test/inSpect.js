const expect = require("chai").expect;
const Core = require("../lib/cores/Draft04");
const addSchema = require("../lib/addSchema");

addSchema("http://localhost:1234/name.json", require("json-schema-test-suite/remotes/name.json"));

const TestCase = {
    description: "root ref in remote ref",
    schema: {
        id: "http://localhost:1234/object",
        type: "object",
        properties: {
            name: { $ref: "name.json#/definitions/orNull" }
        }
    },
    tests: [
        {
            description: "string is valid",
            data: {
                name: "foo"
            },
            valid: true
        },
        {
            description: "null is valid",
            data: {
                name: null
            },
            valid: true
        },
        {
            description: "object is invalid",
            data: {
                name: {
                    name: null
                }
            },
            valid: false
        }
    ]
};

describe(`[${TestCase.description}]`, () => {
    TestCase.tests.forEach((test) => {
        it(test.description, () => {
            const core = new Core(TestCase.schema);
            const errors = core.validate(TestCase.schema, test.data);
            const isValid = errors.length === 0;

            if (isValid !== test.valid) {
                console.log(JSON.stringify(errors, null, 4));
            }

            expect(isValid).to.eq(test.valid);
        });
    });
});
