/* eslint quote-props: 0, no-unused-expressions: 0 */
const expect = require("chai").expect;
const isValid = require("../../lib/isValid");


describe("isValid", () => {

    it("should return schema if value is valid", () => {
        const valid = isValid(4, { type: "number" });
        expect(valid).to.deep.eq({ type: "number" });
    });

    it("should return false if value is invalid", () => {
        const valid = isValid(4, { type: "string" });
        expect(valid).to.be.false;
    });

});
