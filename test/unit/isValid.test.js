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

    describe("string", () => {

        it("should be valid if type is a string", () => {
            const valid = isValid("4", { type: "string" });
            expect(valid).to.be.an("object");
        });

        it("should be invalid if type is not a string", () => {
            const valid = isValid(4, { type: "string" });
            expect(valid).to.be.false;
        });

        it("should be invalid if string is too short", () => {
            const valid = isValid("4", { type: "string", minLength: 2 });
            expect(valid).to.be.false;
        });

        it("should be invalid if string is too long", () => {
            const valid = isValid("443", { type: "string", maxLength: 2 });
            expect(valid).to.be.false;
        });

        it("should be valid if string length is in range", () => {
            const valid = isValid("44", { type: "string", maxLength: 2, minLength: 2 });
            expect(valid).to.be.an("object");
        });
    });

    describe("number", () => {

        it("should be valid if type is a number", () => {
            const valid = isValid(4, { type: "number" });
            expect(valid).to.be.an("object");
        });

        it("should be invalid if type is not a number", () => {
            const valid = isValid("4", { type: "number" });
            expect(valid).to.be.false;
        });

        it("should be invalid if number is too small", () => {
            const valid = isValid(1, { type: "number", minimum: 2 });
            expect(valid).to.be.false;
        });

        it("should be invalid if number is too large", () => {
            const valid = isValid(3, { type: "number", maximum: 2 });
            expect(valid).to.be.false;
        });

        it("should be valid if number is in range", () => {
            const valid = isValid(2, { type: "number", maximum: 2, minimum: 2 });
            expect(valid).to.be.an("object");
        });
    });

    describe("array", () => {

        it("should be valid if type is an array", () => {
            const valid = isValid([], { type: "array" });
            expect(valid).to.be.an("object");
        });

        it("should be invalid if type is not an array", () => {
            const valid = isValid({}, { type: "array" });
            expect(valid).to.be.false;
        });

        it("should be invalid for too few items", () => {
            const valid = isValid([], { type: "array", minItems: 1 });
            expect(valid).to.be.false;
        });

        it("should be invalid for too many items", () => {
            const valid = isValid([1, 2], { type: "array", maxItems: 1 });
            expect(valid).to.be.false;
        });

        it("should be valid if item count is in range", () => {
            const valid = isValid([1], { type: "array", maxItems: 1, minItems: 1 });
            expect(valid).to.be.an("object");
        });
    });

    describe("object", () => {

        it("should be valid if type is an object", () => {
            const valid = isValid({}, { type: "object" });
            expect(valid).to.be.an("object");
        });

        it("should be invalid if type is not an object", () => {
            const valid = isValid([], { type: "object" });
            expect(valid).to.be.false;
        });

        it("should be invalid for too few properties", () => {
            const valid = isValid({}, { type: "object", minProperties: 1 });
            expect(valid).to.be.false;
        });

        it("should be invalid for too many properties", () => {
            const valid = isValid({ a: 1, b: 2 }, { type: "object", maxProperties: 1 });
            expect(valid).to.be.false;
        });

        it("should be valid if item count is in range", () => {
            const valid = isValid({ a: 1 }, { type: "object", maxProperties: 1, minProperties: 1 });
            expect(valid).to.be.an("object");
        });
    });

    describe("boolean", () => {

        it("should be valid if type is a boolean", () => {
            const valid = isValid(false, { type: "boolean" });
            expect(valid).to.be.an("object");
        });

        it("should be invalid if type is not a boolean", () => {
            const valid = isValid("false", { type: "boolean" });
            expect(valid).to.be.false;
        });
    });

    describe("null", () => {

        it("should be valid if type is null", () => {
            const valid = isValid(null, { type: "null" });
            expect(valid).to.be.an("object");
        });

        it("should be invalid if type is not null", () => {
            const valid = isValid("null", { type: "null" });
            expect(valid).to.be.false;
        });
    });
});
