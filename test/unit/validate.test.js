const expect = require("chai").expect;
const validate = require("../../lib/validate");
const Core = require("../../lib/cores/draft04");


describe("validate", () => {

    let core;
    before(() => (core = new Core()));

    describe("integer", () => {

        it("should support type 'integer'", () => {
            const errors = validate(core, { type: "integer" }, 1);
            expect(errors).to.have.length(0);
        });

        it("should throw error if type 'integer' received a float", () => {
            const errors = validate(core, { type: "integer" }, 1.1);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("TypeError");
        });
    });

    describe("object", () => {

        it("should return MinPropertiesError for too few properties", () => {
            const errors = validate(core, { type: "object", minProperties: 2 }, { a: 1 });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinPropertiesError");
        });

        it("should return MaxPropertiesError for too many properties", () => {
            const errors = validate(core, { type: "object", maxProperties: 1 }, { a: 1, b: 2 });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaxPropertiesError");
        });

        it("should be valid if property count is within range", () => {
            const errors = validate(core, { type: "object", maxProperties: 1, minProperties: 1 }, { a: 1 });
            expect(errors).to.have.length(0);
        });

        it("should return AdditionalPropertiesError for an additional property", () => {
            const errors = validate(core, { type: "object", additionalProperties: false }, { a: 1 });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("NoAdditionalPropertiesError");
        });

        it("should return all AdditionalPropertiesErrors", () => {
            const errors = validate(core, { type: "object", additionalProperties: false }, { a: 1, b: 2 });
            expect(errors).to.have.length(2);
            expect(errors[0].name).to.eq("NoAdditionalPropertiesError");
            expect(errors[1].name).to.eq("NoAdditionalPropertiesError");
        });

        it("should be valid if 'additionalProperties' is true", () => {
            const errors = validate(core, { type: "object", additionalProperties: true }, { a: 1 });
            expect(errors).to.have.length(0);
        });

        it("should be valid if value matches 'additionalProperties' schema", () => {
            const errors = validate(core, { type: "object", additionalProperties: { type: "number" } }, { a: 1 });
            expect(errors).to.have.length(0);
        });

        it("should return AdditionalPropertiesError if value does not match 'additionalProperties' schema", () => {
            const errors = validate(core, { type: "object", additionalProperties: { type: "string" } }, { a: 1 });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("AdditionalPropertiesError");
        });

        // @todo patternProperties

        it("should still be valid for missing type", () => {
            const errors = validate(core, { maxProperties: 1, minProperties: 1 }, { a: 1 });
            expect(errors).to.have.length(0);
        });

        it("should be invalid if 'not' keyword does match", () => {
            const errors = validate(core,
                { type: "object", not: { type: "object", properties: { a: { type: "number" } } } },
                { a: 1 }
            );
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("NotError");
        });

        it("should return all errors", () => {
            const errors = validate(core,
                {
                    type: "object", additionalProperties: false,
                    properties: { a: { type: "string" }, id: { type: "string", pattern: /^first$/ } }
                },
                { id: "first", a: "correct", b: "notallowed", c: false }
            );

            expect(errors).to.have.length(2);
            expect(errors[0].name).to.eq("NoAdditionalPropertiesError");
            expect(errors[1].name).to.eq("NoAdditionalPropertiesError");
        });

        it("shoud return errors for missing `required` properties", () => {
            const errors = validate(core,
                {
                    type: "object", required: ["id", "a", "aa", "aaa"]
                },
                { id: "first", a: "correct", b: "ignored" }
            );

            expect(errors).to.have.length(2);
            expect(errors[0].name).to.eq("RequiredPropertyError");
            expect(errors[1].name).to.eq("RequiredPropertyError");
        });
    });

    describe("array", () => {

        it("should return MinItemsError for too few items", () => {
            const errors = validate(core, { type: "array", minItems: 2 }, [1]);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinItemsError");
        });

        it("should return MaxItemsError for too many items", () => {
            const errors = validate(core, { type: "array", maxItems: 1 }, [1, 2]);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaxItemsError");
        });

        it("should be valid if item count is within range", () => {
            const errors = validate(core, { type: "array", minItems: 2, maxItems: 2 }, [1, 2]);
            expect(errors).to.have.length(0);
        });

        it("should still be valid for missing type", () => {
            const errors = validate(core, { minItems: 2, maxItems: 2 }, [1, 2]);
            expect(errors).to.have.length(0);
        });

        it("should return error for invalid index", () => {
            const errors = validate(core, { type: "array", items: [{ type: "string" }] }, [1]);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("TypeError");
        });

        it("should be valid for matching indices", () => {
            const errors = validate(core, { type: "array", items: [{ type: "string" }, { type: "number" }] }, ["1", 2]);
            expect(errors).to.have.length(0);
        });

        it("should return error for prohibited additional items", () => {
            const errors = validate(core, { type: "array",
                items: [{ type: "string" }, { type: "number" }],
                additionalItems: false
            }, ["1", 2, "a"]);

            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("AdditionalItemsError");
        });

        it("should be valid if 'additionalItems' is true", () => {
            const errors = validate(core, { type: "array",
                items: [{ type: "string" }, { type: "number" }],
                additionalItems: true
            }, ["1", 2, "a"]);

            expect(errors).to.have.length(0);
        });

        it("should also be valid if 'additionalItems' is undefined", () => {
            const errors = validate(core, { type: "array",
                items: [{ type: "string" }, { type: "number" }]
            }, ["1", 2, "a"]);

            expect(errors).to.have.length(0);
        });

        it("should return error for mismatching 'additionalItems' schema", () => {
            const errors = validate(core, { type: "array",
                items: [{ type: "string" }, { type: "number" }],
                additionalItems: { type: "object" }
            }, ["1", 2, "a"]);

            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("TypeError");
        });

        it("should be valid for matching 'additionalItems' schema", () => {
            const errors = validate(core, { type: "array",
                items: [{ type: "string" }, { type: "number" }],
                additionalItems: { type: "object" }
            }, ["1", 2, {}]);

            expect(errors).to.have.length(0);
        });

        it("should be invalid if 'not' keyword does match", () => {
            const errors = validate(core,
                { type: "array",
                    items: [{ type: "string" }, { type: "number" }],
                    additionalItems: { type: "object" },
                    not: { items: {} }
                },
                ["1", 2, {}]
            );
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("NotError");
        });

        it("should return all errors", () => {
            const errors = validate(core, { type: "array", items: { type: "string" }, maxItems: 1 }, ["1", 2]);

            expect(errors).to.have.length(2);
            expect(errors[0].name).to.eq("TypeError");
            expect(errors[1].name).to.eq("MaxItemsError");
        });

        describe("oneOf", () => {

            it("should return no error for valid oneOf items", () => {
                const errors = validate(core,
                    {
                        type: "array", items: { oneOf: [
                            { type: "number" },
                            { type: "object", properties: { a: { type: "string" } }, additionalProperties: false }
                        ] }
                    },
                    [100, { a: "string" }]
                );

                expect(errors).to.have.length(0);
            });

            it("should return OneOfError if no item does match", () => {
                const errors = validate(core,
                    {
                        type: "array", items: { oneOf: [
                            { type: "number" },
                            { type: "object", properties: { a: { type: "string" } }, additionalProperties: false }
                        ] }
                    },
                    [100, { a: "correct", b: "not correct" }]
                );
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("OneOfError");
            });
        });
    });

    describe("string", () => {

        it("should return MinLengthError if string is too short", () => {
            const errors = validate(core, { type: "string", minLength: 2 }, "a");
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinLengthError");
        });

        it("should return MaxLengthError if string is too long", () => {
            const errors = validate(core, { type: "string", maxLength: 2 }, "abc");
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaxLengthError");
        });

        it("should be valid if string is within range", () => {
            const errors = validate(core, { type: "string", minLength: 2, maxLength: 2 }, "ab");
            expect(errors).to.have.length(0);
        });

        it("should still be valid for missing type", () => {
            const errors = validate(core, { minLength: 2, maxLength: 2 }, "ab");
            expect(errors).to.have.length(0);
        });

        it("should return EnumError if value is not within enum list", () => {
            const errors = validate(core, { type: "string", "enum": ["a", "c"] }, "b");
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("EnumError");
        });

        it("should be valid if value is within enum list", () => {
            const errors = validate(core, { type: "string", "enum": ["a", "b", "c"] }, "b");
            expect(errors).to.have.length(0);
        });

        it("should be invalid if 'not' keyword does match", () => {
            const errors = validate(core, { type: "string", not: { type: "string", pattern: "^b$" } }, "b");
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("NotError");
        });
    });

    describe("number", () => {

        it("should return MinimumError if number is too small", () => {
            const errors = validate(core, { type: "number", minimum: 2 }, 1);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinimumError");
        });

        it("should return MinimumError if number is equal and exclusiveMinimum is set", () => {
            const errors = validate(core, { type: "number", minimum: 2, exclusiveMinimum: true }, 2);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinimumError");
        });

        it("should return MaximumError if number is too large", () => {
            const errors = validate(core, { type: "number", maximum: 1 }, 2);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaximumError");
        });

        it("should return MaximumError if number same and exclusiveMaximum is set", () => {
            const errors = validate(core, { type: "number", maximum: 2, exclusiveMaximum: true }, 2);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaximumError");
        });

        it("should be valid if number is within range", () => {
            const errors = validate(core, { type: "number", minimum: 1, maximum: 1 }, 1);
            expect(errors).to.have.length(0);
        });

        it("should still be valid for missing type", () => {
            const errors = validate(core, { minimum: 1, maximum: 1 }, 1);
            expect(errors).to.have.length(0);
        });

        it("should return EnumError if value is not within enum list", () => {
            const errors = validate(core, { type: "number", "enum": [21, 27, 42] }, 13);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("EnumError");
        });

        it("should be valid if value is within enum list", () => {
            const errors = validate(core, { type: "number", "enum": [21, 27, 42] }, 27);
            expect(errors).to.have.length(0);
        });

        it("should return error if value is not multiple of 1.5", () => {
            const errors = validate(core, { type: "number", multipleOf: 1.5 }, 4);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MultipleOfError");
        });

        it("should be valid if value if a multiple of 1.5", () => {
            const errors = validate(core, { type: "number", multipleOf: 1.5 }, 4.5);
            expect(errors).to.have.length(0);
        });

        it("should be valid if 'multipleOf' is not a number", () => {
            const errors = validate(core, { type: "number", multipleOf: "non-number" }, 4.5);
            expect(errors).to.have.length(0);
        });

        it("should be invalid if 'not' keyword does match", () => {
            const errors = validate(core,
                { type: "number", not: { type: "number", minimum: 4 } }, 4.5
            );
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("NotError");
        });
    });
});
