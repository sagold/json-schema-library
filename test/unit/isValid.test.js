/* eslint quote-props: 0, no-unused-expressions: 0 */
const expect = require("chai").expect;
const isValid = require("../../lib/isValid");
const step = require("../../lib/step");


describe("isValid", () => {

    it("should return true if value is valid", () => {
        const valid = isValid({ type: "number" }, 4, step);
        expect(valid).to.be.true;
    });

    it("should return false if value is invalid", () => {
        const valid = isValid({ type: "string" }, 4, step);
        expect(valid).to.be.false;
    });
});
