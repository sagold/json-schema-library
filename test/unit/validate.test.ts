import _validate from "../../lib/validate";
import draft04Meta from "../../remotes/draft04.json";
import { createNode } from "../../lib/schemaNode";
import { Draft } from "../../lib/draft";
import { Draft04 as Core } from "../../lib/draft04";
import { expect } from "chai";
import { JsonSchema } from "../../lib/types";

function validate(draft: Draft, value: unknown, schema: JsonSchema = draft.rootSchema as JsonSchema) {
    return _validate(createNode(draft, schema), value);
}

describe("validate", () => {
    let draft: Core;
    before(() => (draft = new Core()));

    describe("integer", () => {
        describe("oneOf", () => {
            it("should validate on a matching oneOf definition", () => {
                const errors = validate(draft, 3, {
                    oneOf: [{ type: "integer" }, { type: "string" }]
                });
                expect(errors).to.have.length(0);
            });

            it("should return an error for multiple matching oneOf schemas", () => {
                const errors = validate(draft, 3, { oneOf: [{ type: "integer" }, { minimum: 2 }] });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MultipleOneOfError");
            });
        });

        describe("allOf", () => {
            it("should validate if all allOf-schemas are valid", () => {
                const errors = validate(draft, 3, { allOf: [{ type: "integer" }, { minimum: 2 }] });
                expect(errors).to.have.length(0);
            });

            it("should return error if not all schemas match", () => {
                const errors = validate(draft, 3, { allOf: [{ type: "integer" }, { minimum: 4 }] });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MinimumError");
            });

            it("should return all errors for each non-matching schemas", () => {
                const errors = validate(draft, 3, {
                    allOf: [{ type: "integer" }, { minimum: 4 }, { maximum: 2 }]
                });
                expect(errors).to.have.length(2);
                expect(errors[0].name).to.eq("MinimumError");
                expect(errors[1].name).to.eq("MaximumError");
            });
        });

        describe("anyOf", () => {
            it("should validate if one schemas in anyOf validates", () => {
                const errors = validate(draft, 3, { anyOf: [{ minimum: 4 }, { maximum: 4 }] });
                expect(errors).to.have.length(0);
            });

            it("should return error if not all schemas match", () => {
                const errors = validate(draft, 3, { anyOf: [{ minimum: 4 }, { maximum: 2 }] });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("AnyOfError");
            });

            it("should validate null", () => {
                const errors = validate(draft, null, { anyOf: [{ type: "null" }] });
                expect(errors).to.have.length(0);
            });

            it("should return error if invalid null", () => {
                const errors = validate(draft, 3, { anyOf: [{ type: "null" }] });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("AnyOfError");
            });

            it("should resolve references", () => {
                draft.setSchema({
                    definitions: { integer: { type: "integer" } }
                });
                const errors = validate(draft, 3, {
                    anyOf: [{ type: "null" }, { $ref: "#/definitions/integer" }]
                });
                expect(errors).to.have.length(0);
            });
        });
    });

    describe("object", () => {
        it("should still be valid for missing type", () => {
            const errors = validate(draft, { a: 1 }, { maxProperties: 1, minProperties: 1 });
            expect(errors).to.have.length(0);
        });

        it("should return all errors", () => {
            const errors = validate(
                draft,
                { id: "first", a: "correct", b: "notallowed", c: false },
                {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        a: { type: "string" },
                        id: { type: "string", pattern: /^first$/ }
                    }
                }
            );

            expect(errors).to.have.length(2);
            expect(errors[0].name).to.eq("NoAdditionalPropertiesError");
            expect(errors[1].name).to.eq("NoAdditionalPropertiesError");
        });

        describe("min/maxProperties", () => {
            it("should return MinPropertiesError for too few properties", () => {
                const errors = validate(draft, { a: 1 }, { type: "object", minProperties: 2 });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MinPropertiesError");
            });

            it("should return MaxPropertiesError for too many properties", () => {
                const errors = validate(draft, { a: 1, b: 2 }, { type: "object", maxProperties: 1 });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MaxPropertiesError");
            });

            it("should be valid if property count is within range", () => {
                const errors = validate(draft, { a: 1 }, { type: "object", maxProperties: 1, minProperties: 1 });
                expect(errors).to.have.length(0);
            });
        });

        describe("not", () => {
            it("should be invalid if 'not' keyword does match", () => {
                const errors = validate(
                    draft,
                    { a: 1 },
                    {
                        type: "object",
                        not: { type: "object", properties: { a: { type: "number" } } }
                    }
                );
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("NotError");
            });
        });

        describe("dependencies", () => {
            it("should ignore any dependencies if the property is no set", () => {
                const errors = validate(
                    draft,
                    { title: "Check this out" },
                    {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            url: { type: "string" },
                            target: { type: "string" }
                        },
                        dependencies: {
                            url: ["target"]
                        }
                    }
                );

                expect(errors).to.have.length(0);
            });

            it("should return a 'MissingDependencyError' if the dependent property is missing", () => {
                const errors = validate(
                    draft,
                    { title: "Check this out", url: "http://example.com" },
                    {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            url: { type: "string" },
                            target: { type: "string" }
                        },
                        dependencies: {
                            url: ["target"]
                        }
                    }
                );

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MissingDependencyError");
            });

            it("should return a 'MissingDependencyError' if the dependent counterpart is missing", () => {
                const errors = validate(
                    draft,
                    { title: "Check this out", target: "_blank" },
                    {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            url: { type: "string" },
                            target: { type: "string" }
                        },
                        dependencies: {
                            url: ["target"],
                            target: ["url"]
                        }
                    }
                );

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MissingDependencyError");
            });

            it("should be valid for a matching schema dependency", () => {
                const errors = validate(
                    draft,
                    { title: "Check this out", url: "http://example.com", target: "_blank" },
                    {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            url: { type: "string" },
                            target: { type: "string" }
                        },
                        dependencies: {
                            url: {
                                properties: {
                                    target: { type: "string" }
                                }
                            }
                        }
                    }
                );

                expect(errors).to.have.length(0);
            });

            it("should return validation error for a non-matching schema dependency", () => {
                const errors = validate(
                    draft,
                    { title: "Check this out", url: "http://example.com" },
                    {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            url: { type: "string" },
                            target: { type: "string" }
                        },
                        dependencies: {
                            url: {
                                required: ["target"],
                                properties: {
                                    target: { type: "string" }
                                }
                            }
                        }
                    }
                );

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("RequiredPropertyError");
            });
        });
    });

    describe("array", () => {
        it("should return error for invalid index", () => {
            const errors = validate(draft, [1], { type: "array", items: [{ type: "string" }] });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("TypeError");
        });

        it("should be valid for matching indices", () => {
            const errors = validate(draft, ["1", 2], {
                type: "array",
                items: [{ type: "string" }, { type: "number" }]
            });
            expect(errors).to.have.length(0);
        });

        it("should return all errors", () => {
            const errors = validate(draft, ["1", 2], {
                type: "array",
                items: { type: "string" },
                maxItems: 1
            });

            expect(errors).to.have.length(2);
            expect(errors[0].name).to.eq("TypeError");
            expect(errors[1].name).to.eq("MaxItemsError");
        });

        describe("min/maxItems", () => {
            it("should return MinItemsError for too few items", () => {
                const errors = validate(draft, [1], { type: "array", minItems: 2 });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MinItemsError");
            });

            it("should return MaxItemsError for too many items", () => {
                const errors = validate(draft, [1, 2], { type: "array", maxItems: 1 });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MaxItemsError");
            });

            it("should be valid if item count is within range", () => {
                const errors = validate(draft, [1, 2], { type: "array", minItems: 2, maxItems: 2 });
                expect(errors).to.have.length(0);
            });

            it("should still be valid for missing type", () => {
                const errors = validate(draft, [1, 2], { minItems: 2, maxItems: 2 });
                expect(errors).to.have.length(0);
            });
        });

        describe("not", () => {
            it("should be invalid if 'not' keyword does match", () => {
                const errors = validate(draft, ["1", 2, {}], {
                    type: "array",
                    items: [{ type: "string" }, { type: "number" }],
                    additionalItems: { type: "object" },
                    not: { items: {} }
                });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("NotError");
            });
        });

        describe("uniqueItems", () => {
            it("should not validate for duplicated values", () => {
                const errors = validate(draft, [1, 2, 3, 4, 3], {
                    type: "array",
                    uniqueItems: true
                });

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("UniqueItemsError");
            });

            it("should not validate for duplicated objects", () => {
                const errors = validate(draft, [{ id: "first" }, { id: "second" }, { id: "first" }], {
                    type: "array",
                    uniqueItems: true
                });

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("UniqueItemsError");
            });

            it("should validate for mismatching objects with equal properties", () => {
                const errors = validate(
                    draft,
                    [
                        { id: "first", val: 1 },
                        { id: "first", val: 2 },
                        { id: "first", val: 3 }
                    ],
                    { type: "array", uniqueItems: true }
                );

                expect(errors).to.have.length(0);
            });
        });

        describe("oneOf", () => {
            it("should return no error for valid oneOf items", () => {
                const errors = validate(draft, [100, { a: "string" }], {
                    type: "array",
                    items: {
                        oneOf: [
                            { type: "number" },
                            {
                                type: "object",
                                properties: { a: { type: "string" } },
                                additionalProperties: false
                            }
                        ]
                    }
                });

                expect(errors).to.have.length(0);
            });

            it("should return error if no item does match", () => {
                const errors = validate(draft, [100, { a: "correct", b: "not correct" }], {
                    type: "array",
                    items: {
                        oneOf: [
                            { type: "number" },
                            {
                                type: "object",
                                properties: { a: { type: "string" } },
                                additionalProperties: false
                            }
                        ]
                    }
                });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("NoAdditionalPropertiesError");
            });

            it("should return MultipleOneOfError if multiple oneOf definitions match the given value", () => {
                const errors = validate(draft, [3], {
                    type: "array",
                    items: { oneOf: [{ type: "integer" }, { minimum: 2 }] }
                });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MultipleOneOfError");
            });
        });
    });

    describe("string", () => {
        it("should return MinLengthError if string is too short", () => {
            const errors = validate(draft, "a", { type: "string", minLength: 2 });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinLengthError");
        });

        it("should return MaxLengthError if string is too long", () => {
            const errors = validate(draft, "abc", { type: "string", maxLength: 2 });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaxLengthError");
        });

        it("should be valid if string is within range", () => {
            const errors = validate(draft, "ab", { type: "string", minLength: 2, maxLength: 2 });
            expect(errors).to.have.length(0);
        });

        it("should still be valid for missing type", () => {
            const errors = validate(draft, "ab", { minLength: 2, maxLength: 2 });
            expect(errors).to.have.length(0);
        });

        it("should return EnumError if value is not within enum list", () => {
            const errors = validate(draft, "b", { type: "string", enum: ["a", "c"] });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("EnumError");
        });

        it("should be valid if value is within enum list", () => {
            const errors = validate(draft, "b", { type: "string", enum: ["a", "b", "c"] });
            expect(errors).to.have.length(0);
        });

        it("should be invalid if 'not' keyword does match", () => {
            const errors = validate(draft, "b", {
                type: "string",
                not: { type: "string", pattern: "^b$" }
            });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("NotError");
        });
    });

    describe("number", () => {
        it("should return MinimumError if number is too small", () => {
            const errors = validate(draft, 1, { type: "number", minimum: 2 });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinimumError");
        });

        it("should return MinimumError if number is equal and exclusiveMinimum is set", () => {
            const errors = validate(draft, 2, {
                type: "number",
                minimum: 2,
                exclusiveMinimum: true
            });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinimumError");
        });

        it("should return MaximumError if number is too large", () => {
            const errors = validate(draft, 2, { type: "number", maximum: 1 });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaximumError");
        });

        it("should return MaximumError if number same and exclusiveMaximum is set", () => {
            const errors = validate(draft, 2, {
                type: "number",
                maximum: 2,
                exclusiveMaximum: true
            });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaximumError");
        });

        it("should be valid if number is within range", () => {
            const errors = validate(draft, 1, { type: "number", minimum: 1, maximum: 1 });
            expect(errors).to.have.length(0);
        });

        it("should still be valid for missing type", () => {
            const errors = validate(draft, 1, { minimum: 1, maximum: 1 });
            expect(errors).to.have.length(0);
        });

        it("should validate NaN", () => {
            const errors = validate(draft, parseInt("a"), { type: "number" });
            expect(errors).to.have.length(0);
        });

        it("should return EnumError if value is not within enum list", () => {
            const errors = validate(draft, 13, { type: "number", enum: [21, 27, 42] });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("EnumError");
        });

        it("should be valid if value is within enum list", () => {
            const errors = validate(draft, 27, { type: "number", enum: [21, 27, 42] });
            expect(errors).to.have.length(0);
        });

        it("should return error if value is not multiple of 1.5", () => {
            const errors = validate(draft, 4, { type: "number", multipleOf: 1.5 });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MultipleOfError");
        });

        it("should be valid if value if a multiple of 1.5", () => {
            const errors = validate(draft, 4.5, { type: "number", multipleOf: 1.5 });
            expect(errors).to.have.length(0);
        });

        it("should be valid if 'multipleOf' is not a number", () => {
            const errors = validate(draft, 4.5, { type: "number", multipleOf: "non-number" });
            expect(errors).to.have.length(0);
        });

        it("should be invalid if 'not' keyword does match", () => {
            const errors = validate(draft, 4.5, {
                type: "number",
                not: { type: "number", minimum: 4 }
            });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("NotError");
        });
    });

    describe("arrays of types", () => {
        it("should not return an error for a valid type", () => {
            let errors = validate(draft, {}, { type: ["object", "null"] });
            expect(errors).to.have.length(0);
            errors = validate(draft, null, { type: ["object", "null"] });
            expect(errors).to.have.length(0);
        });

        it("should return a TypeError if passed type is not within array", () => {
            const errors = validate(draft, [], { type: ["object", "null"] });
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("TypeError");
        });

        it("should support 'integer' as a valid type within array", () => {
            const errors = validate(draft, 1, { type: ["integer", "null"] });
            expect(errors).to.have.length(0);
        });
    });

    describe("heterogeneous types", () => {
        describe("enum", () => {
            it("should validate a matching value within enum", () => {
                const errors = validate(draft, "second", { enum: [1, "second", []] });
                expect(errors).to.have.length(0);
            });

            it("should validate a matching array within enum", () => {
                const errors = validate(draft, [], { enum: [1, "second", []] });
                expect(errors).to.have.length(0);
            });

            it("should validate a matching object within enum", () => {
                const errors = validate(draft, { id: "third" }, { enum: [1, "second", { id: "third" }] });
                expect(errors).to.have.length(0);
            });

            it("should return error for non-matching object", () => {
                const errors = validate(draft, { id: "first" }, { enum: [1, "second", { id: "third" }] });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("EnumError");
            });

            it("should return error for invalid null", () => {
                const errors = validate(draft, null, { enum: [1, "second", { id: "third" }] });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("EnumError");
            });
        });

        describe("$ref", () => {
            it("should correctly validate data through nested $ref", () => {
                draft.setSchema({
                    $ref: "#/definitions/c",
                    definitions: {
                        a: { type: "integer" },
                        b: { $ref: "#/definitions/a" },
                        c: { $ref: "#/definitions/b" }
                    }
                });
                const errors = validate(draft, "a");

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("TypeError");
            });

            it("should correctly validate combination of remote, allOf, and allOf-$ref", () => {
                draft.addRemoteSchema("http://json-schema.org/draft-04/schema", draft04Meta);
                draft.setSchema({ $ref: "http://json-schema.org/draft-04/schema#", _id: "input" });
                const errors = validate(draft, { minLength: -1 });

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MinimumError");
            });

            it("should correctly resolve local remote url", () => {
                draft.remotes[
                    "http://localhost:1234/integer.json"
                ] = require("json-schema-test-suite/remotes/integer.json");

                draft.setSchema({ $ref: "http://localhost:1234/integer.json", _id: "input" });
                const errors = validate(draft, "not an integer");

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("TypeError");
            });
        });
    });
});
