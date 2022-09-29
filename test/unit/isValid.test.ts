/* eslint quote-props: 0, no-unused-expressions: 0 */
import { expect } from "chai";
import isValid from "../../lib/isValid";
import { Draft04 as Core } from "../../lib/draft04";

describe("isValid", () => {
    let core: Core;
    before(() => (core = new Core()));

    it("should return true if value is valid", () => {
        const valid = isValid(core, 4, { type: "number" });
        expect(valid).to.be.true;
    });

    it("should return false if value is invalid", () => {
        const valid = isValid(core, 4, { type: "string" });
        expect(valid).to.be.false;
    });

    // taken from spec: oneOf (complex)
    // @fixme this is correct here, not when running tests through spec...
    it("should not validate multiple oneOf validations", () => {
        const valid = isValid(
            core,
            {
                foo: "baz",
                bar: 2
            },
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
            }
        );

        expect(valid).to.be.false;
    });
});
