/* eslint quote-props: 0, no-unused-expressions: 0 */
const expect = require("chai").expect;
const isValid = require("../../lib/isValid");
const Core = require("../../lib/cores/draft04");


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
});
