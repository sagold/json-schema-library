/* eslint quote-props: 0, no-unused-expressions: 0 */
const expect = require("chai").expect;
const isValid = require("../../lib/isValid");
const Core = require("../../lib/cores/Draft04");


describe("isValid", () => {

    let core;
    before(() => (core = new Core()));

    it("should return true if value is valid", () => {
        const valid = isValid(core, { type: "number" }, 4);
        expect(valid).to.be.true;
    });

    it("should return false if value is invalid", () => {
        const valid = isValid(core, { type: "string" }, 4);
        expect(valid).to.be.false;
    });

    // taken from spec: oneOf (complex)
    // @fixme this is correct here, not when running tests through spec...
    it("should not validate multiple oneOf validations", () => {
        const valid = isValid(core,
            {
                oneOf: [
                    {
                        properties: { bar: { type: "integer" } },
                        required: ["bar"]
                    },
                    {
                        properties: { foo: { type: "string" } },
                        required: ["foo"]
                    }
                ]
            },
            {
                foo: "baz",
                bar: 2
            }
        );

        expect(valid).to.be.false;
    });
});
