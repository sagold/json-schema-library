/* eslint quote-props: 0, no-unused-expressions: 0 */
const expect = require("chai").expect;
const isValid = require("../../lib/isValid");
const step = require("../../lib/step");


describe("isValid", () => {

    it("should return schema if value is valid", () => {
        const valid = isValid(4, { type: "number" }, step);
        expect(valid).to.deep.eq({ type: "number" });
    });

    it("should return false if value is invalid", () => {
        const valid = isValid(4, { type: "string" }, step);
        expect(valid).to.be.false;
    });

    describe("string", () => {

        it("should be valid if type is a string", () => {
            const valid = isValid("4", { type: "string" }, step);
            expect(valid).to.be.an("object");
        });

        it("should be invalid if type is not a string", () => {
            const valid = isValid(4, { type: "string" }, step);
            expect(valid).to.be.false;
        });

        it("should be invalid if string is too short", () => {
            const valid = isValid("4", { type: "string", minLength: 2 }, step);
            expect(valid).to.be.false;
        });

        it("should be invalid if string is too long", () => {
            const valid = isValid("443", { type: "string", maxLength: 2 }, step);
            expect(valid).to.be.false;
        });

        it("should be valid if string length is in range", () => {
            const valid = isValid("44", { type: "string", maxLength: 2, minLength: 2 }, step);
            expect(valid).to.be.an("object");
        });
    });

    describe("number", () => {

        it("should be valid if type is a number", () => {
            const valid = isValid(4, { type: "number" }, step);
            expect(valid).to.be.an("object");
        });

        it("should be invalid if type is not a number", () => {
            const valid = isValid("4", { type: "number" }, step);
            expect(valid).to.be.false;
        });
    });

    describe("array", () => {

        it("should be valid if type is an array", () => {
            const valid = isValid([], { type: "array" }, step);
            expect(valid).to.be.an("object");
        });

        it("should be invalid if type is not an array", () => {
            const valid = isValid({}, { type: "array" }, step);
            expect(valid).to.be.false;
        });

        it("should test items", () => {
            const valid = isValid([1], { type: "array", items: {
                type: "string"
            } }, step);

            expect(valid).to.be.false;
        });

        it("should return schema if array is valid", () => {
            const valid = isValid([1], { type: "array", items: { type: "number" } }, step);
            expect(valid).to.be.an("object");
            expect(valid.type).to.eq("array");
        });
    });

    describe("object", () => {

        it("should be valid if type is an object", () => {
            const valid = isValid({}, { type: "object" }, step);
            expect(valid).to.be.an("object");
        });

        it("should be invalid if type is not an object", () => {
            const valid = isValid([], { type: "object" }, step);
            expect(valid).to.be.false;
        });

        it("should be invalid for too few properties", () => {
            const valid = isValid({}, { type: "object", minProperties: 1 }, step);
            expect(valid).to.be.false;
        });

        it("should be invalid for too many properties", () => {
            const valid = isValid({ a: 1, b: 2 }, { type: "object", maxProperties: 1 }, step);
            expect(valid).to.be.false;
        });

        it("should be valid if item count is in range", () => {
            const valid = isValid({ a: 1 }, { type: "object", maxProperties: 1, minProperties: 1 }, step);
            expect(valid).to.be.an("object");
        });

        it("should test properties", () => {
            const valid = isValid({ a: 1 }, { type: "object", maxProperties: 1, minProperties: 1, properties: {
                a: { type: "string" }
            } }, step);

            expect(valid).to.be.false;
        });

        it("should return schema if object is valid", () => {
            const valid = isValid({ a: 1 }, { type: "object", maxProperties: 1, minProperties: 1, properties: {
                a: { type: "number" }
            } }, step);

            expect(valid).to.be.an("object");
            expect(valid.type).to.eq("object");
        });
    });

    describe("boolean", () => {

        it("should be valid if type is a boolean", () => {
            const valid = isValid(false, { type: "boolean" }, step);
            expect(valid).to.be.an("object");
        });

        it("should be invalid if type is not a boolean", () => {
            const valid = isValid("false", { type: "boolean" }, step);
            expect(valid).to.be.false;
        });
    });

    describe("null", () => {

        it("should be valid if type is null", () => {
            const valid = isValid(null, { type: "null" }, step);
            expect(valid).to.be.an("object");
        });

        it("should be invalid if type is not null", () => {
            const valid = isValid("null", { type: "null" }, step);
            expect(valid).to.be.false;
        });
    });
});
