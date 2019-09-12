const { expect } = require("chai");
const JsonEditor = require("../../lib/cores/JsonEditor");


describe("spec: json-editor oneof", () => {

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
});
