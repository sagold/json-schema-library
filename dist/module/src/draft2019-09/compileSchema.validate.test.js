import { compileSchema } from "../compileSchema";
import { strict as assert } from "assert";
import { draft2019 } from "../draft2019";
const $schema = "draft-2019-09";
describe("compileSchema.validate (2019)", () => {
    describe("integer", () => {
        describe("exclusiveMaximum", () => {
            it("should fail if value is equal to 0", () => {
                const { errors } = compileSchema({
                    $schema,
                    exclusiveMaximum: 0
                }).validate(0);
                assert.deepEqual(errors.length, 1);
            });
            it("should succeed if value is below to 0", () => {
                const { errors } = compileSchema({
                    $schema,
                    exclusiveMaximum: 0
                }).validate(-1);
                assert.deepEqual(errors.length, 0);
            });
        });
        describe("exclusiveMinimum", () => {
            it("should fail if value is equal to 0", () => {
                const { errors } = compileSchema({
                    $schema,
                    exclusiveMinimum: 0
                }).validate(0);
                assert.deepEqual(errors.length, 1);
            });
            it("should succeed if value is above to 0", () => {
                const { errors } = compileSchema({
                    $schema,
                    exclusiveMinimum: 0
                }).validate(1);
                assert.deepEqual(errors.length, 0);
            });
        });
        describe("oneOf", () => {
            it("should validate on a matching oneOf definition", () => {
                const { errors } = compileSchema({
                    $schema,
                    oneOf: [{ type: "integer" }, { type: "string" }]
                }).validate(3);
                assert.deepEqual(errors.length, 0);
            });
            it("should return an error for multiple matching oneOf schemas", () => {
                const { errors } = compileSchema({
                    $schema,
                    oneOf: [{ type: "integer" }, { minimum: 2 }]
                }).validate(3);
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "multiple-one-of-error");
            });
        });
        describe("allOf", () => {
            it("should validate if all allOf-schemas are valid", () => {
                const { errors } = compileSchema({
                    $schema,
                    allOf: [{ type: "integer" }, { minimum: 2 }]
                }).validate(3);
                assert.deepEqual(errors.length, 0);
            });
            it("should return error if not all schemas match", () => {
                const { errors } = compileSchema({
                    $schema,
                    allOf: [{ type: "integer" }, { minimum: 4 }]
                }).validate(3);
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "minimum-error");
            });
            it("should return all errors for each non-matching schemas", () => {
                const { errors } = compileSchema({
                    $schema,
                    allOf: [{ type: "integer" }, { minimum: 4 }, { maximum: 2 }]
                }).validate(3);
                assert.deepEqual(errors.length, 2);
                assert.deepEqual(errors[0].code, "minimum-error");
                assert.deepEqual(errors[1].code, "maximum-error");
            });
        });
        describe("anyOf", () => {
            it("should validate if one schemas in anyOf validates", () => {
                const { errors } = compileSchema({
                    $schema,
                    anyOf: [{ minimum: 4 }, { maximum: 4 }]
                }).validate(3);
                assert.deepEqual(errors.length, 0);
            });
            it("should return error if not all schemas match", () => {
                const { errors } = compileSchema({
                    $schema,
                    anyOf: [{ minimum: 4 }, { maximum: 2 }]
                }).validate(3);
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "any-of-error");
            });
            it("should validate null", () => {
                const { errors } = compileSchema({
                    $schema,
                    anyOf: [{ type: "null" }]
                }).validate(null);
                assert.deepEqual(errors.length, 0);
            });
            it("should return error if invalid null", () => {
                const { errors } = compileSchema({
                    $schema,
                    anyOf: [{ type: "null" }]
                }).validate(3);
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "any-of-error");
            });
            it("should resolve references", () => {
                const { errors } = compileSchema({
                    $schema,
                    definitions: { integer: { type: "integer" } },
                    anyOf: [{ type: "null" }, { $ref: "#/definitions/integer" }]
                }).validate(3);
                assert.deepEqual(errors.length, 0);
            });
        });
    });
    describe("if-then-else", () => {
        it("should validate if-then constructs", () => {
            const node = compileSchema({
                $schema,
                if: { exclusiveMaximum: 0 }, // if this schema matches
                then: { minimum: -10 } // also test this schema
            });
            assert.deepEqual(node.validate(-1).errors.length, 0, "valid through then");
            assert.deepEqual(node.validate(-100).errors.length, 1, "invalid through then");
            assert.deepEqual(node.validate(3).errors.length, 0, "valid when if test fails");
        });
        it("should validate if-else constructs", () => {
            const node = compileSchema({
                $schema,
                if: { exclusiveMaximum: 0 }, // valid if 'if' valid
                else: { multipleOf: 2 } // test if 'if' fails
            });
            assert.deepEqual(node.validate(-1).errors.length, 0, "valid when if test passes");
            assert.deepEqual(node.validate(4).errors.length, 0, "valid through else");
            assert.deepEqual(node.validate(3).errors.length, 1, "invalid through else");
        });
    });
    describe("object", () => {
        it("should still be valid for missing type", () => {
            const { errors } = compileSchema({
                $schema,
                maxProperties: 1,
                minProperties: 1
            }).validate({ a: 1 });
            assert.deepEqual(errors.length, 0);
        });
        it("should return all errors", () => {
            const { errors } = compileSchema({
                $schema,
                type: "object",
                additionalProperties: false,
                properties: {
                    a: { type: "string" },
                    id: { type: "string", pattern: /^first$/ }
                }
            }).validate({ id: "first", a: "correct", b: "notallowed", c: false });
            assert.deepEqual(errors.length, 2);
            assert.deepEqual(errors[0].code, "no-additional-properties-error");
            assert.deepEqual(errors[1].code, "no-additional-properties-error");
        });
        describe("min/maxProperties", () => {
            it("should return min-properties-error for too few properties", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "object",
                    minProperties: 2
                }).validate({ a: 1 });
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "min-properties-error");
            });
            it("should return max-properties-error for too many properties", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "object",
                    maxProperties: 1
                }).validate({ a: 1, b: 2 });
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "max-properties-error");
            });
            it("should be valid if property count is within range", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "object",
                    maxProperties: 1,
                    minProperties: 1
                }).validate({ a: 1 });
                assert.deepEqual(errors.length, 0);
            });
        });
        describe("not", () => {
            it("should be invalid if 'not' keyword does match", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "object",
                    not: { type: "object", properties: { a: { type: "number" } } }
                }).validate({ a: 1 });
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "not-error");
            });
        });
        describe("dependencies", () => {
            it("should ignore any dependencies if the property is no set", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "object",
                    properties: { title: { type: "string" }, url: { type: "string" }, target: { type: "string" } },
                    dependencies: { url: ["target"] }
                }).validate({ title: "Check this out" });
                assert.deepEqual(errors.length, 0);
            });
            it("should return a 'missing-dependency-error' if the dependent property is missing", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "object",
                    properties: { title: { type: "string" }, url: { type: "string" }, target: { type: "string" } },
                    dependencies: {
                        url: ["target"]
                    }
                }).validate({ title: "Check this out", url: "http://example.com" });
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "missing-dependency-error");
            });
            it("should return a 'missing-dependency-error' if the dependent counterpart is missing", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "object",
                    properties: { title: { type: "string" }, url: { type: "string" }, target: { type: "string" } },
                    dependencies: { url: ["target"], target: ["url"] }
                }).validate({ title: "Check this out", target: "_blank" });
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "missing-dependency-error");
            });
            it("should be valid for a matching schema dependency", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "object",
                    properties: { title: { type: "string" }, url: { type: "string" }, target: { type: "string" } },
                    dependencies: { url: { properties: { target: { type: "string" } } } }
                }).validate({ title: "Check this out", url: "http://example.com", target: "_blank" });
                assert.deepEqual(errors.length, 0);
            });
            it("should return validation error for a non-matching schema dependency", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "object",
                    properties: { title: { type: "string" }, url: { type: "string" }, target: { type: "string" } },
                    dependencies: { url: { required: ["target"], properties: { target: { type: "string" } } } }
                }).validate({ url: "http://example.com" });
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "required-property-error");
            });
            it("should return correct error for invalid dependency", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "object",
                    properties: {
                        nested: {
                            type: "object",
                            properties: { test: { type: "string" } },
                            dependencies: {
                                test: {
                                    required: ["dynamic"],
                                    properties: { dynamic: { type: "string", minLength: 1 } }
                                }
                            }
                        }
                    }
                }).validate({ nested: { test: "with then", dynamic: "" } });
                assert.deepEqual(errors.length, 1, "should have returned an error");
                assert.deepEqual(errors[0].data.pointer, "#/nested/dynamic");
            });
        });
    });
    describe("array", () => {
        it("should return error for invalid index", () => {
            const { errors } = compileSchema({
                $schema,
                type: "array",
                items: [{ type: "string" }]
            }).validate([1]);
            assert.deepEqual(errors.length, 1);
            assert.deepEqual(errors[0].code, "type-error");
        });
        it("should be valid for matching indices", () => {
            const { errors } = compileSchema({
                $schema,
                type: "array",
                items: [{ type: "string" }, { type: "number" }]
            }).validate(["1", 2]);
            assert.deepEqual(errors.length, 0);
        });
        it("should return all errors", () => {
            const { errors } = compileSchema({
                $schema,
                type: "array",
                items: { type: "string" },
                maxItems: 1
            }).validate(["1", 2]);
            assert.deepEqual(errors.length, 2);
            assert.deepEqual(errors[0].code, "type-error");
            assert.deepEqual(errors[1].code, "max-items-error");
        });
        describe("min/maxItems", () => {
            it("should return MinItemsError for too few items", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "array",
                    minItems: 2
                }).validate([1]);
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "min-items-error");
            });
            it("should return MaxItemsError for too many items", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "array",
                    maxItems: 1
                }).validate([1, 2]);
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "max-items-error");
            });
            it("should be valid if item count is within range", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "array",
                    minItems: 2,
                    maxItems: 2
                }).validate([1, 2]);
                assert.deepEqual(errors.length, 0);
            });
            it("should still be valid for missing type", () => {
                const { errors } = compileSchema({
                    $schema,
                    minItems: 2,
                    maxItems: 2
                }).validate([1, 2]);
                assert.deepEqual(errors.length, 0);
            });
        });
        describe("not", () => {
            it("should be invalid if 'not' keyword does match", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "array",
                    items: [{ type: "string" }, { type: "number" }],
                    additionalItems: { type: "object" },
                    not: { items: {} }
                }).validate(["1", 2, {}]);
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "not-error");
            });
        });
        describe("uniqueItems", () => {
            it("should not validate for duplicated values", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "array",
                    uniqueItems: true
                }).validate([1, 2, 3, 4, 3]);
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "unique-items-error");
            });
            it("should not validate for duplicated objects", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "array",
                    uniqueItems: true
                }).validate([{ id: "first" }, { id: "second" }, { id: "first" }]);
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "unique-items-error");
            });
            it("should validate for mismatching objects with equal properties", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "array",
                    uniqueItems: true
                }).validate([
                    { id: "first", val: 1 },
                    { id: "first", val: 2 },
                    { id: "first", val: 3 }
                ]);
                assert.deepEqual(errors.length, 0);
            });
        });
        describe("oneOf", () => {
            it("should return no error for valid oneOf items", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "array",
                    items: {
                        oneOf: [
                            { type: "number" },
                            { type: "object", properties: { a: { type: "string" } }, additionalProperties: false }
                        ]
                    }
                }).validate([100, { a: "string" }]);
                assert.deepEqual(errors.length, 0);
            });
            it("should return error if no item does match", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "array",
                    items: {
                        oneOf: [
                            { type: "number" },
                            { type: "object", properties: { a: { type: "string" } }, additionalProperties: false }
                        ]
                    },
                    additionalItems: false
                }).validate([100, { a: "correct", b: "not correct" }]);
                assert.deepEqual(errors.length, 1);
            });
            it("should return multiple-one-of-error if multiple oneOf definitions match the given value", () => {
                const { errors } = compileSchema({
                    $schema,
                    type: "array",
                    items: { oneOf: [{ type: "integer" }, { minimum: 2 }] }
                }).validate([3]);
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "multiple-one-of-error");
            });
        });
    });
    describe("string", () => {
        it("should return min-length-error if string is too short", () => {
            const { errors } = compileSchema({
                $schema,
                type: "string",
                minLength: 2
            }).validate("a");
            assert.deepEqual(errors.length, 1);
            assert.deepEqual(errors[0].code, "min-length-error");
        });
        it("should return max-length-error if string is too long", () => {
            const { errors } = compileSchema({
                $schema,
                type: "string",
                maxLength: 2
            }).validate("abc");
            assert.deepEqual(errors.length, 1);
            assert.deepEqual(errors[0].code, "max-length-error");
        });
        it("should be valid if string is within range", () => {
            const { errors } = compileSchema({
                $schema,
                type: "string",
                minLength: 2,
                maxLength: 2
            }).validate("ab");
            assert.deepEqual(errors.length, 0);
        });
        it("should still be valid for missing type", () => {
            const { errors } = compileSchema({
                $schema,
                minLength: 2,
                maxLength: 2
            }).validate("ab");
            assert.deepEqual(errors.length, 0);
        });
        it("should return enum-error if value is not within enum list", () => {
            const { errors } = compileSchema({
                $schema,
                type: "string",
                enum: ["a", "c"]
            }).validate("b");
            assert.deepEqual(errors.length, 1);
            assert.deepEqual(errors[0].code, "enum-error");
        });
        it("should be valid if value is within enum list", () => {
            const { errors } = compileSchema({
                $schema,
                type: "string",
                enum: ["a", "b", "c"]
            }).validate("b");
            assert.deepEqual(errors.length, 0);
        });
        it("should be invalid if 'not' keyword does match", () => {
            const { errors } = compileSchema({
                $schema,
                type: "string",
                not: { type: "string", pattern: "^b$" }
            }).validate("b");
            assert.deepEqual(errors.length, 1);
            assert.deepEqual(errors[0].code, "not-error");
        });
    });
    describe("number", () => {
        it("should return minimum-error if number is too small", () => {
            const { errors } = compileSchema({
                $schema,
                type: "number",
                minimum: 2
            }).validate(1);
            assert.deepEqual(errors.length, 1);
            assert.deepEqual(errors[0].code, "minimum-error");
        });
        it("should return minimum-error if number is equal and exclusiveMinimum is set", () => {
            const { errors } = compileSchema({
                $schema,
                type: "number",
                minimum: 2,
                exclusiveMinimum: true
            }).validate(2);
            assert.deepEqual(errors.length, 1);
            assert.deepEqual(errors[0].code, "minimum-error");
        });
        it("should return maximum-error if number is too large", () => {
            const { errors } = compileSchema({
                $schema,
                type: "number",
                maximum: 1
            }).validate(2);
            assert.deepEqual(errors.length, 1);
            assert.deepEqual(errors[0].code, "maximum-error");
        });
        it("should return maximum-error if number same and exclusiveMaximum is set", () => {
            const { errors } = compileSchema({
                $schema,
                type: "number",
                maximum: 2,
                exclusiveMaximum: true
            }).validate(2);
            assert.deepEqual(errors.length, 1);
            assert.deepEqual(errors[0].code, "maximum-error");
        });
        it("should be valid if number is within range", () => {
            const { errors } = compileSchema({
                $schema,
                type: "number",
                minimum: 1,
                maximum: 1
            }).validate(1);
            assert.deepEqual(errors.length, 0);
        });
        it("should still be valid for missing type", () => {
            const { errors } = compileSchema({
                $schema,
                minimum: 1,
                maximum: 1
            }).validate(1);
            assert.deepEqual(errors.length, 0);
        });
        it("should validate NaN", () => {
            const { errors } = compileSchema({
                $schema,
                type: "number"
            }).validate(parseInt("a"));
            assert.deepEqual(errors.length, 0);
        });
        it("should return enum-error if value is not within enum list", () => {
            const { errors } = compileSchema({
                $schema,
                type: "number",
                enum: [21, 27, 42]
            }).validate(13);
            assert.deepEqual(errors.length, 1);
            assert.deepEqual(errors[0].code, "enum-error");
        });
        it("should be valid if value is within enum list", () => {
            const { errors } = compileSchema({
                $schema,
                type: "number",
                enum: [21, 27, 42]
            }).validate(27);
            assert.deepEqual(errors.length, 0);
        });
        it("should return error if value is not multiple of 1.5", () => {
            const { errors } = compileSchema({
                $schema,
                type: "number",
                multipleOf: 1.5
            }).validate(4);
            assert.deepEqual(errors.length, 1);
            assert.deepEqual(errors[0].code, "multiple-of-error");
        });
        it("should be valid if value if a multiple of 1.5", () => {
            const { errors } = compileSchema({
                $schema,
                type: "number",
                multipleOf: 1.5
            }).validate(4.5);
            assert.deepEqual(errors.length, 0);
        });
        it("should be valid if 'multipleOf' is not a number", () => {
            const { errors } = compileSchema({
                $schema,
                type: "number",
                multipleOf: "non-number"
            }).validate(4.5);
            assert.deepEqual(errors.length, 0);
        });
        it("should be invalid if 'not' keyword does match", () => {
            const { errors } = compileSchema({
                $schema,
                type: "number",
                not: { type: "number", minimum: 4 }
            }).validate(4.5);
            assert.deepEqual(errors.length, 1);
            assert.deepEqual(errors[0].code, "not-error");
        });
    });
    describe("arrays of types", () => {
        it("should not return an error for a valid type", () => {
            assert(compileSchema({ $schema, type: ["object", "null"] }).validate({}).valid);
            assert(compileSchema({ $schema, type: ["object", "null"] }).validate(null).valid);
        });
        it("should return a TypeError if passed type is not within array", () => {
            const { errors } = compileSchema({
                $schema,
                type: ["object", "null"]
            }).validate([]);
            assert.deepEqual(errors.length, 1);
            assert.deepEqual(errors[0].code, "type-error");
        });
        it("should support 'integer' as a valid type within array", () => {
            const { errors } = compileSchema({
                $schema,
                type: ["integer", "null"]
            }).validate(1);
            assert.deepEqual(errors.length, 0);
        });
    });
    describe("heterogeneous types", () => {
        describe("enum", () => {
            it("should validate a matching value within enum", () => {
                const { errors } = compileSchema({
                    $schema,
                    enum: [1, "second", []]
                }).validate("second");
                assert.deepEqual(errors.length, 0);
            });
            it("should validate a matching array within enum", () => {
                const { errors } = compileSchema({
                    $schema,
                    enum: [1, "second", []]
                }).validate([]);
                assert.deepEqual(errors.length, 0);
            });
            it("should validate a matching object within enum", () => {
                const { errors } = compileSchema({
                    $schema,
                    enum: [1, "second", { id: "third" }]
                }).validate({ id: "third" });
                assert.deepEqual(errors.length, 0);
            });
            it("should return error for non-matching object", () => {
                const { errors } = compileSchema({
                    $schema,
                    enum: [1, "second", { id: "third" }]
                }).validate({ id: "first" });
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "enum-error");
            });
            it("should return error for invalid null", () => {
                const { errors } = compileSchema({
                    $schema,
                    enum: [1, "second", { id: "third" }]
                }).validate(null);
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "enum-error");
            });
        });
        describe("$ref", () => {
            it("should correctly validate data through nested $ref", () => {
                const { errors } = compileSchema({
                    $schema,
                    $ref: "#/definitions/c",
                    definitions: {
                        a: { type: "integer" },
                        b: { $ref: "#/definitions/a" },
                        c: { $ref: "#/definitions/b" }
                    }
                }).validate("a");
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "type-error");
            });
            it("should correctly validate combination of remote, allOf, and allOf-$ref", () => {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const draft04Meta = require("../../remotes/draft04.json");
                const { errors } = compileSchema({
                    $schema,
                    $ref: "http://json-schema.org/draft-04/schema#",
                    _id: "input"
                })
                    .addRemote("http://json-schema.org/draft-04/schema", draft04Meta)
                    .validate({ minLength: -1 });
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "minimum-error");
            });
            it("should correctly resolve local remote url", () => {
                const { errors } = compileSchema({
                    $schema,
                    $ref: "http://localhost:1234/integer.json",
                    _id: "input"
                })
                    .addRemote("http://localhost:1234/integer.json", 
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                require("json-schema-test-suite/remotes/integer.json"))
                    .validate("not an integer");
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "type-error");
            });
            it("spec/unevaluatedProperties : dynamic evalation inside nested refs : should validate a", () => {
                const node = compileSchema({
                    $schema: "https://json-schema.org/draft/2019-09/schema",
                    $defs: {
                        one: {
                            oneOf: [
                                { $ref: "#/$defs/two" },
                                { required: ["b"], properties: { b: true } },
                                { required: ["xx"], patternProperties: { x: true } },
                                { required: ["all"], unevaluatedProperties: true }
                            ]
                        },
                        two: {
                            oneOf: [
                                { required: ["c"], properties: { c: true } },
                                { required: ["d"], properties: { d: true } }
                            ]
                        }
                    },
                    oneOf: [{ $ref: "#/$defs/one" }, { required: ["a"], properties: { a: true } }],
                    unevaluatedProperties: false
                });
                const { errors } = node.validate({ a: 1 });
                assert(errors.length === 0);
            });
        });
    });
    describe("recursiveRef (spec)", () => {
        describe("$recursiveRef without using nesting", () => {
            it("integer does not match as a property value", () => {
                // how it should resolve
                // { foo } » root:anyOf: [false, ?]
                //      1. resolve http://localhost:4242/draft2019-09/recursiveRef2/schema.json#/$defs/myobject
                //      => domain + local path (fragments 2) => myobject-schema
                //      2. { foo } » anyOf: [false, true + ?]
                //          3. { foo } » myObject:anyof:additionalProperties => recursiveRef
                //          => recursiveAnchor = myObject
                //          4. 1 » anyOf: [false, false] => error
                const node = compileSchema({
                    $schema: "https://json-schema.org/draft/2019-09/schema",
                    $id: "http://localhost:4242/draft2019-09/recursiveRef2/schema.json",
                    $defs: {
                        myobject: {
                            $id: "myobject.json",
                            $recursiveAnchor: true,
                            anyOf: [
                                { type: "string" },
                                {
                                    type: "object",
                                    additionalProperties: { $recursiveRef: "#" }
                                }
                            ]
                        }
                    },
                    anyOf: [{ type: "integer" }, { $ref: "#/$defs/myobject" }]
                });
                const { errors } = node.validate({ foo: 1 });
                assert(errors.length > 0, "should have returned error for invalid integer");
            });
        });
        describe("$recursiveRef with $recursiveAnchor: false works like $ref", () => {
            let node;
            beforeEach(() => {
                node = compileSchema({
                    $schema: "https://json-schema.org/draft/2019-09/schema",
                    $id: "http://localhost:4242/draft2019-09/recursiveRef4/schema.json",
                    $recursiveAnchor: false,
                    $defs: {
                        myobject: {
                            $id: "myobject.json",
                            $recursiveAnchor: false,
                            anyOf: [
                                { type: "string" },
                                {
                                    type: "object",
                                    additionalProperties: { $recursiveRef: "#" }
                                }
                            ]
                        }
                    },
                    anyOf: [{ type: "integer" }, { $ref: "#/$defs/myobject" }]
                });
            });
            it("single level match", () => {
                // how it should resolve
                // { foo } » root:anyOf: [false, ?]
                //      1. resolve http://localhost:4242/draft2019-09/recursiveRef2/schema.json#/$defs/myobject
                //      => domain + local path (fragments 2) => myobject-schema
                //      2. { foo } » anyOf: [false, true + ?]
                //          3. { foo } » myObject:anyof:additionalProperties => recursiveRef
                //          => recursiveAnchor = myObject
                //          4. 1 » anyOf: [false, false] => error
                const { errors } = node.validate({ foo: "hi" });
                assert(errors.length === 0, "should have validated data");
            });
            it("integer does not match as a property value", () => {
                const { errors } = node.validate({ foo: 1 });
                assert(errors.length > 0, "should have returned error for integer");
            });
        });
    });
});
describe("compileSchema.validate : format", () => {
    describe("time", () => {
        it("should validate HH:mm:ss-HH:mm", () => {
            const { errors } = compileSchema({
                $schema,
                type: "string",
                format: "time"
            }).validate("15:31:12-02:30");
            assert.deepEqual(errors, []);
        });
        it("should validate HH:mm:ssZ", () => {
            const { errors } = compileSchema({
                $schema,
                type: "string",
                format: "time"
            }).validate("15:31:12Z");
            assert.deepEqual(errors, []);
        });
        it("should not validate minutes above 59", () => {
            const { errors } = compileSchema({
                $schema,
                type: "string",
                format: "time"
            }).validate("15:60:12");
            assert.equal(errors.length, 1);
        });
        it("should not validate seconds above 59", () => {
            const { errors } = compileSchema({
                $schema,
                type: "string",
                format: "time"
            }).validate("15:31:60");
            assert.equal(errors.length, 1);
        });
        it("should not validate HH:mm", () => {
            const { errors } = compileSchema({
                $schema,
                type: "string",
                format: "time"
            }).validate("15:31");
            assert.equal(errors.length, 1);
        });
    });
    describe("url", () => {
        it("should validate format url", () => {
            const { errors } = compileSchema({
                $schema,
                type: "string",
                format: "url"
            }).validate("https://developer.mozilla.org/en-US/");
            assert.deepEqual(errors, []);
        });
        it("should return error UrlFormatError for invalid urls", () => {
            const { errors } = compileSchema({
                $schema,
                type: "string",
                format: "url"
            }).validate("123");
            assert.equal(errors.length, 1);
            assert.equal(errors[0].code, "format-url-error");
        });
    });
});
describe("compileSchema.validateAsync", () => {
    it("should return a promise", () => {
        const promise = compileSchema({
            $schema,
            type: "number"
        }).validateAsync(4);
        assert(promise instanceof Promise);
    });
    it("should resolve successfull with an empty error", async () => {
        const promise = compileSchema({
            $schema,
            type: "number"
        }).validateAsync(4);
        const { errors } = await promise;
        assert.deepEqual(errors.length, 0);
    });
    it("should resolve with errors for a failed validation", async () => {
        const promise = compileSchema({
            $schema,
            type: "number"
        }).validateAsync("4");
        const { errors } = await promise;
        assert.deepEqual(errors.length, 1);
        assert.deepEqual(errors[0].code, "type-error");
    });
    describe("async validation", () => {
        let draft;
        beforeEach(() => {
            draft = {
                ...draft2019,
                keywords: [
                    // @ts-expect-error asd
                    ...draft2019.keywords,
                    {
                        id: "async",
                        keyword: "asyncError",
                        addValidate: (node) => node.schema.asyncError != null,
                        // @ts-expect-error asd
                        validate: ({ node }) => {
                            if (node.schema.asyncError === false) {
                                return;
                            }
                            return new Promise((resolve) => resolve([
                                node.createError("type-error", {
                                    schema: {},
                                    pointer: "",
                                    value: ""
                                })
                            ]));
                        }
                    }
                ]
            };
            it("should resolve async validation returning no error", async () => {
                const { errors } = await compileSchema({ type: "number", asyncError: false }, { drafts: [draft] }).validateAsync(4);
                assert.deepEqual(errors.length, 0);
            });
            it("should resolve async validation errors", async () => {
                const { errors } = await compileSchema({ type: "number", asyncError: true }, { drafts: [draft] }).validateAsync(4);
                assert.deepEqual(errors.length, 1);
                assert.deepEqual(errors[0].code, "type-error");
            });
        });
    });
});
