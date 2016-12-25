const expect = require("chai").expect;
const validate = require("../../lib/validate");
const step = require("../../lib/step");


describe("validate", () => {

    describe("integer", () => {

        it("should suport type 'integer'", () => {
            const errors = validate({ type: "integer" }, 1, step);
            expect(errors).to.have.length(0);
        });

        it("should throw error if type 'integer' received a float", () => {
            const errors = validate({ type: "integer" }, 1.1, step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("TypeError");
        });
    });

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

        it("should be valid if property count is within range", () => {
            const errors = validate({ type: "object", maxProperties: 1, minProperties: 1 }, { a: 1 }, step);
            expect(errors).to.have.length(0);
        });

        it("should return AdditionalPropertiesError for an additional property", () => {
            const errors = validate({ type: "object", additionalProperties: false }, { a: 1 }, step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("NoAdditionalPropertiesError");
        });

        it("should be valid if 'additionProperties' is true", () => {
            const errors = validate({ type: "object", additionalProperties: true }, { a: 1 }, step);
            expect(errors).to.have.length(0);
        });

        it("should be valid if value matches 'additionProperties' schema", () => {
            const errors = validate({ type: "object", additionalProperties: { type: "number" } }, { a: 1 }, step);
            expect(errors).to.have.length(0);
        });

        it("should return AdditionalPropertiesError if value does not match 'additionProperties' schema", () => {
            const errors = validate({ type: "object", additionalProperties: { type: "string" } }, { a: 1 }, step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("AdditionalPropertiesError");
        });

        // @todo patternProperties

        it("should still be valid for missing type", () => {
            const errors = validate({ maxProperties: 1, minProperties: 1 }, { a: 1 }, step);
            expect(errors).to.have.length(0);
        });

        it("should be invalid if 'not' keyword does match", () => {
            const errors = validate(
                { type: "object", not: { type: "object", properties: { a: { type: "number" } } } },
                { a: 1 },
                step
            );
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("NotError");
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

        it("should be valid if item count is within range", () => {
            const errors = validate({ type: "array", minItems: 2, maxItems: 2 }, [1, 2], step);
            expect(errors).to.have.length(0);
        });

        it("should still be valid for missing type", () => {
            const errors = validate({ minItems: 2, maxItems: 2 }, [1, 2], step);
            expect(errors).to.have.length(0);
        });

        it("should return error for invalid index", () => {
            const errors = validate({ type: "array", items: [{ type: "string" }] }, [1], step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("TypeError");
        });

        it("should be valid for matching indices", () => {
            const errors = validate({ type: "array", items: [{ type: "string" }, { type: "number" }] }, ["1", 2], step);
            expect(errors).to.have.length(0);
        });

        it("should return error for prohibited additional items", () => {
            const errors = validate({ type: "array",
                items: [{ type: "string" }, { type: "number" }],
                additionalItems: false
            }, ["1", 2, "a"], step);

            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("AdditionalItemsError");
        });

        it("should be valid if additionalItems is true", () => {
            const errors = validate({ type: "array",
                items: [{ type: "string" }, { type: "number" }],
                additionalItems: true
            }, ["1", 2, "a"], step);

            expect(errors).to.have.length(0);
        });

        it("should also be valid if additionalItems is undefined", () => {
            const errors = validate({ type: "array",
                items: [{ type: "string" }, { type: "number" }]
            }, ["1", 2, "a"], step);

            expect(errors).to.have.length(0);
        });

        it("should return error for mismatching additionalItems schema", () => {
            const errors = validate({ type: "array",
                items: [{ type: "string" }, { type: "number" }],
                additionalItems: { type: "object" }
            }, ["1", 2, "a"], step);

            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("TypeError");
        });

        it("should be valid for matching additionalItems schema", () => {
            const errors = validate({ type: "array",
                items: [{ type: "string" }, { type: "number" }],
                additionalItems: { type: "object" }
            }, ["1", 2, {}], step);

            expect(errors).to.have.length(0);
        });

        it("should be invalid if 'not' keyword does match", () => {
            const errors = validate(
                { type: "array",
                    items: [{ type: "string" }, { type: "number" }],
                    additionalItems: { type: "object" },
                    not: { items: {} }
                },
                ["1", 2, {}],
                step
            );
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("NotError");
        });
    });

    describe("string", () => {

        it("should return MinLengthError if string is too short", () => {
            const errors = validate({ type: "string", minLength: 2 }, "a", step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinLengthError");
        });

        it("should return MaxLengthError if string is too long", () => {
            const errors = validate({ type: "string", maxLength: 2 }, "abc", step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaxLengthError");
        });

        it("should be valid if string is within range", () => {
            const errors = validate({ type: "string", minLength: 2, maxLength: 2 }, "ab", step);
            expect(errors).to.have.length(0);
        });

        it("should still be valid for missing type", () => {
            const errors = validate({ minLength: 2, maxLength: 2 }, "ab", step);
            expect(errors).to.have.length(0);
        });

        it("should return EnumError if value is not within enum list", () => {
            const errors = validate({ type: "string", "enum": ["a", "c"] }, "b", step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("EnumError");
        });

        it("should be valid if value is within enum list", () => {
            const errors = validate({ type: "string", "enum": ["a", "b", "c"] }, "b", step);
            expect(errors).to.have.length(0);
        });

        it("should be invalid if 'not' keyword does match", () => {
            const errors = validate({ type: "string", not: { type: "string", pattern: "^b$" } }, "b", step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("NotError");
        });
    });

    describe("number", () => {

        it("should return MinimumError if number is too small", () => {
            const errors = validate({ type: "number", minimum: 2 }, 1, step);
            expect(errors[0].name).to.eq("MinimumError");
        });

        it("should return MaximumError if number is too large", () => {
            const errors = validate({ type: "number", maximum: 1 }, 2, step);
            expect(errors[0].name).to.eq("MaximumError");
        });

        it("should be valid if number is within range", () => {
            const errors = validate({ type: "number", minimum: 1, maximum: 1 }, 1, step);
            expect(errors).to.have.length(0);
        });

        it("should still be valid for missing type", () => {
            const errors = validate({ minimum: 1, maximum: 1 }, 1, step);
            expect(errors).to.have.length(0);
        });

        it("should return EnumError if value is not within enum list", () => {
            const errors = validate({ type: "number", "enum": [21, 27, 42] }, 13, step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("EnumError");
        });

        it("should be valid if value is within enum list", () => {
            const errors = validate({ type: "number", "enum": [21, 27, 42] }, 27, step);
            expect(errors).to.have.length(0);
        });

        it("should return error if value is not multiple of 1.5", () => {
            const errors = validate({ type: "number", multipleOf: 1.5 }, 4, step);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MultipleOfError");
        });

        it("should be valid if value if a multiple of 1.5", () => {
            const errors = validate({ type: "number", multipleOf: 1.5 }, 4.5, step);
            expect(errors).to.have.length(0);
        });

        it("should be valid if 'multipleOf' is not a number", () => {
            const errors = validate({ type: "number", multipleOf: "non-number" }, 4.5, step);
            expect(errors).to.have.length(0);
        });

        it("should be invalid if 'not' keyword does match", () => {
            const errors = validate(
                { type: "number", not: { type: "number", minimum: 4 } }, 4.5, step
            );
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("NotError");
        });
    });
});
