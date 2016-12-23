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

    describe("string", () => {

        it("should be valid if type is a string", () => {
            const valid = isValid({ type: "string" }, "4", step);
            expect(valid).to.be.true;
        });

        it("should be invalid if type is not a string", () => {
            const valid = isValid({ type: "string" }, 4, step);
            expect(valid).to.be.false;
        });
    });

    describe("number", () => {

        it("should be valid if type is a number", () => {
            const valid = isValid({ type: "number" }, 4, step);
            expect(valid).to.be.true;
        });

        it("should be invalid if type is not a number", () => {
            const valid = isValid({ type: "number" }, "4", step);
            expect(valid).to.be.false;
        });
    });

    describe("array", () => {

        it("should be valid if type is an array", () => {
            const valid = isValid({ type: "array" }, [], step);
            expect(valid).to.be.true;
        });

        it("should be invalid if type is not an array", () => {
            const valid = isValid({ type: "array" }, {}, step);
            expect(valid).to.be.false;
        });

        it("should test items", () => {
            const valid = isValid({ type: "array", items: {
                type: "string"
            } }, [1], step);

            expect(valid).to.be.false;
        });

        it("should return true if array is valid", () => {
            const valid = isValid({ type: "array", items: { type: "number" } }, [1], step);
            expect(valid).to.be.true;
        });
    });

    describe("object", () => {

        it("should be valid if type is an object", () => {
            const valid = isValid({ type: "object" }, {}, step);
            expect(valid).to.be.true;
        });

        it("should be invalid if type is not an object", () => {
            const valid = isValid({ type: "object" }, [], step);
            expect(valid).to.be.false;
        });

        it("should test properties", () => {
            const valid = isValid({ type: "object", maxProperties: 1, minProperties: 1, properties: {
                a: { type: "string" }
            } }, { a: 1 }, step);

            expect(valid).to.be.false;
        });

        it("should return true if object is valid", () => {
            const valid = isValid({ type: "object", maxProperties: 1, minProperties: 1, properties: {
                a: { type: "number" }
            } }, { a: 1 }, step);

            expect(valid).to.be.true;
        });
    });

    describe("boolean", () => {

        it("should be valid if type is a boolean", () => {
            const valid = isValid({ type: "boolean" }, false, step);
            expect(valid).to.be.true;
        });

        it("should be invalid if type is not a boolean", () => {
            const valid = isValid({ type: "boolean" }, "false", step);
            expect(valid).to.be.false;
        });
    });

    describe("null", () => {

        it("should be valid if type is null", () => {
            const valid = isValid({ type: "null" }, null, step);
            expect(valid).to.be.true;
        });

        it("should be invalid if type is not null", () => {
            const valid = isValid({ type: "null" }, "null", step);
            expect(valid).to.be.false;
        });
    });
});
