const expect = require("chai").expect;
const getTypeOf = require("../../lib/getTypeOf");


describe("getTypeOf", () => {

    it("should return 'string' for \"\"", () => {
        expect(getTypeOf("")).to.eq("string");
    });

    it("should return 'boolean' for false", () => {
        expect(getTypeOf(false)).to.eq("boolean");
    });

    it("should return 'number' for 0", () => {
        expect(getTypeOf(0)).to.eq("number");
    });

    it("should return 'regexp' for /^/", () => {
        expect(getTypeOf(/^/)).to.eq("regexp");
    });

    it("should return 'regexp' for 'new RegExp()'", () => {
        expect(getTypeOf(new RegExp())).to.eq("regexp");
    });

    it("should return 'object' for {}", () => {
        expect(getTypeOf({})).to.eq("object");
    });

    it("should return 'array' for []", () => {
        expect(getTypeOf([])).to.eq("array");
    });

    it("should return 'null' for null", () => {
        expect(getTypeOf(null)).to.eq("null");
    });

    it("should return 'undefined' for undefined", () => {
        expect(getTypeOf()).to.eq("undefined");
    });
});
