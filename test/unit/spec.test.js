const { expect } = require("chai");
const JsonEditor = require("../../lib/cores/JsonEditor");
const Draft04 = require("../../lib/cores/Draft04");


describe("benchmark spec tests", () => {

    // this is wanted fuzzy behaviour and collision on validation...
    it.skip("should correctly validate complex oneOf type", () => {
        const schema = {
            oneOf: [
                {
                    properties: {
                        bar: { type: "integer" }
                    },
                    required: ["bar"]
                },
                {
                    properties: {
                        foo: { type: "string" }
                    },
                    required: ["foo"]
                }
            ]
        };
        const core = new JsonEditor(schema);

        const errors = core.validate(schema, { foo: "baz", bar: 2 });
        console.log("errors", JSON.stringify(errors));
        expect(errors.length).to.eq(1, "both oneOf valid (complex)");
    });

    // this fails in benchmark...
    it("should invalidate wrong schema for remote schema", () => {
        const schema = { $ref: "http://json-schema.org/draft-04/schema#" };
        const core = new Draft04(schema);

        const isValid = core.isValid(schema, {
            definitions: {
                foo: { type: 1 }
            }
        });

        expect(isValid).to.eq(false, "data should not be valid");
    });

    it("should correctly validate remote schema", () => {
        const schema = { $ref: "http://json-schema.org/draft-04/schema#" };
        const core = new Draft04(schema);

        const isValid = core.isValid(schema, {
            definitions: {
                foo: { type: "integer" }
            }
        });

        expect(isValid).to.eq(true, "data should be valid");
    });
});
