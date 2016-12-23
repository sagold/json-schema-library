const expect = require("chai").expect;
const validate = require("../../lib/validate");
const step = require("../../lib/step");


describe("validate", () => {

    describe("object", () => {

        it("should return MinPropertiesError for too few properties", () => {
            const errors = validate({ type: "object", minProperties: 2 }, { a: 1 }, step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinPropertiesError");
        });

        it("should return MaxPropertiesError for too many properties", () => {
            const errors = validate({ type: "object", maxProperties: 1 }, { a: 1, b: 2 }, step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaxPropertiesError");
        });

        it("should return no error if prperty count is within range", () => {
            const errors = validate({ type: "object", maxProperties: 1 }, { a: 1, b: 2 }, step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaxPropertiesError");
        });
    });

    describe("array", () => {

        it("should return MinItemsError for too few items", () => {
            const errors = validate({ type: "array", minItems: 2 }, [1], step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinItemsError");
        });

        it("should return MaxItemsError for too many items", () => {
            const errors = validate({ type: "array", maxItems: 1 }, [1, 2], step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaxItemsError");
        });

        it("should return no error if item count is within range", () => {
            const errors = validate({ type: "array", minItems: 2, maxItems: 2 }, [1, 2], step);
            expect(errors).to.have.length(0);
        });
    });

    describe("string", () => {

        it("should return MinLengthError if string is too short", () => {
            const errors = validate({ type: "string", minLength: 2 }, "a");
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinLengthError");
        });

        it("should return MaxLengthError if string is too long", () => {
            const errors = validate({ type: "string", maxLength: 2 }, "abc");
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaxLengthError");
        });

        it("should be valid if string is within range", () => {
            const errors = validate({ type: "string", minLength: 2, maxLength: 2 }, "ab");
            expect(errors).to.have.length(0);
        });

        it("should return EnumError if value is not within enum list", () => {
            const errors = validate({ type: "string", "enum": ["a", "c"] }, "b");
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("EnumError");
        });

        it("should be vali if value is within enum list", () => {
            const errors = validate({ type: "string", "enum": ["a", "b", "c"] }, "b");
            expect(errors).to.have.length(0);
        });
    });

    describe("number", () => {

        it("should return MinimumError if number is too small", () => {
            const errors = validate({ type: "number", minimum: 2 }, 1);
            expect(errors[0].name).to.eq("MinimumError");
        });

        it("should return MaximumError if number is too large", () => {
            const errors = validate({ type: "number", maximum: 1 }, 2);
            expect(errors[0].name).to.eq("MaximumError");
        });

        it("should return no error if number is within range", () => {
            const errors = validate({ type: "number", minimum: 1, maximum: 1 }, 1);
            expect(errors).to.have.length(0);
        });
    });
});
