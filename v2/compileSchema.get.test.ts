import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { isSchemaNode } from "./types";
import { isJsonError } from "../lib/types";

describe("compileSchema : get", () => {
    describe("behaviour", () => {
        it("should return node of property", () => {
            const node = compileSchema({
                type: "object",
                properties: {
                    title: { type: "string", minLength: 1 }
                }
            }).get("title", { title: "abc" });

            assert(isSchemaNode(node), "should have returned a valid schema node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });

        it("should return node of property even it type differs", () => {
            const node = compileSchema({
                type: "object",
                properties: {
                    title: { type: "string", minLength: 1 }
                }
            }).get("title", { title: 123 });

            assert(isSchemaNode(node), "should have returned a valid schema node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });

        it("should return undefined if property is not defined, but allowed", () => {
            const node = compileSchema({
                type: "object",
                properties: {
                    title: { type: "string", minLength: 1 }
                }
            }).get("body", { body: "abc" });

            assert.deepEqual(node, undefined);
        });

        it("should return an error when the property is not allowed", () => {
            const node = compileSchema({
                type: "object",
                properties: {
                    title: { type: "string", minLength: 1 }
                },
                additionalProperties: false
            }).get("body", { title: "abc" });

            assert(isJsonError(node), "should have return an error");
        });

        it("should return the original schema of the property", () => {
            const node = compileSchema({
                type: "object",
                properties: {
                    title: { type: "string", allOf: [{ minLength: 1 }] }
                }
            }).get("title", { body: "abc" });

            assert.deepEqual(node.schema, { type: "string", allOf: [{ minLength: 1 }] });
        });

        it("should reduce parent schema for returned property", () => {
            const node = compileSchema({
                type: "object",
                properties: {
                    title: { type: "string" }
                },
                allOf: [
                    {
                        properties: {
                            title: { minLength: 1 }
                        }
                    }
                ]
            }).get("title", { body: "abc" });

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });
    });

    describe("object - reduce parent schema when returning child-property", () => {
        it("should reduce parent if-then schema when returning property node", () => {
            const node = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                if: { properties: { title: { minLength: 2 } } },
                then: { properties: { title: { maxLength: 3 } } },
                else: { properties: { title: { minLength: 4 } } }
            }).get("title", { title: "abcd" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", maxLength: 3 });
        });

        it("should reduce parent if-else schema when returning node", () => {
            const node = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                if: { properties: { title: { minLength: 2 } } },
                then: { properties: { title: { maxLength: 3 } } },
                else: { properties: { title: { minLength: 4 } } }
            }).get("title", { title: "a" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 4 });
        });

        it("should reduce parent anyOf schema when returning property node", () => {
            const node = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                anyOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).get("title", { title: "abcd" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });

        it("should reduce all matching parent anyOf schema when returning property node", () => {
            const node = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                anyOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).get("title", { title: "a" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1, maxLength: 1 });
        });

        it("should reduce all allOf schema when returning property node", () => {
            const node = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                allOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).get("title");

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1, maxLength: 1 });
        });

        it("should reduce matching oneOf schema when returning property node", () => {
            const node = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                oneOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).get("title", { title: "" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", maxLength: 1 });
        });

        it("should return error when multiple oneOf-items match", () => {
            const node = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                oneOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).get("title", { title: "a" });

            assert(isJsonError(node), "should have returned a valid schema property node");
        });

        it("should return error when multiple oneOf-items match", () => {
            const node = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                oneOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).get("title", { title: "a" });

            assert(isJsonError(node), "should have returned a valid schema property node");
        });
    });

    describe("object - get child property from resolved dynamic schema", () => {
        it("should get property from dependentSchemas", () => {
            const node = compileSchema({
                type: "object",
                dependentSchemas: {
                    trigger: { properties: { title: { type: "string", minLength: 1 } } }
                }
            }).get("title", { trigger: "trigger" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });

        it("should get merged property from patternProperties", () => {
            const node = compileSchema({
                type: "object",
                properties: { title: { type: "string", minLength: 1 } },
                patternProperties: { le: { maxLength: 3 } }
            }).get("title");

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1, maxLength: 3 });
        });

        it("should get property from merged allOf schema", () => {
            const node = compileSchema({
                type: "object",
                allOf: [{ properties: { title: { type: "string" } } }, { properties: { title: { minLength: 1 } } }]
            }).get("title");

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });

        it("should get property from matching anyOf schema", () => {
            const node = compileSchema({
                type: "object",
                anyOf: [
                    { properties: { title: { type: "string", maxLength: 0 }, label: { type: "number", maximum: 0 } } },
                    { properties: { title: { type: "string", minLength: 1 }, label: { type: "number", minimum: 1 } } }
                ]
            }).get("label", { title: "matches minLength" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "number", minimum: 1 });
        });

        it("should get property from matching oneOf schema", () => {
            const node = compileSchema({
                type: "object",
                oneOf: [
                    { properties: { title: { type: "string" }, label: { type: "string", minLength: 2 } } },
                    { properties: { title: { type: "number" } } }
                ]
            }).get("label", { title: "matches string" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 2 });
        });

        it("should return `undefined` for valid oneOf property missing the property", () => {
            const node = compileSchema({
                type: "object",
                oneOf: [
                    { properties: { title: { type: "string" }, label: { type: "string", minLength: 2 } } },
                    { properties: { title: { type: "number" } } }
                ]
            }).get("label", { title: 123 });

            assert(node === undefined);
        });

        it("should get property from then schema", () => {
            const node = compileSchema({
                type: "object",
                if: { properties: { title: { type: "string", minLength: 1 } } },
                then: { properties: { label: { type: "string", maxLength: 2 } } },
                else: { properties: { label: { type: "number", minimum: 1 } } }
            }).get("label", { title: "matches minLength" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", maxLength: 2 });
        });

        it("should get property from else schema", () => {
            const node = compileSchema({
                type: "object",
                if: { properties: { title: { type: "string", minLength: 1 } } },
                then: { properties: { label: { type: "string", maxLength: 2 } } },
                else: { properties: { label: { type: "number", minimum: 1 } } }
            }).get("label", { title: "" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "number", minimum: 1 });
        });
    });

    describe("ref", () => {
        it("should resolve references in allOf schema", () => {
            const node = compileSchema({
                definitions: {
                    object: { type: "object" },
                    additionalNumber: {
                        additionalProperties: { type: "number", minLength: 2 }
                    }
                },
                allOf: [{ $ref: "#/definitions/object" }, { $ref: "#/definitions/additionalNumber" }]
            });

            const schema = node.get("title", { title: 4, test: 2 })?.schema;

            assert.deepEqual(schema, { type: "number", minLength: 2 });
        });
    });
});
