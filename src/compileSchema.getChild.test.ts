import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { isSchemaNode, isJsonError } from "./types";

describe("compileSchema : getNodeChild", () => {
    describe("behaviour", () => {
        it("should return node of property", () => {
            const { node } = compileSchema({
                type: "object",
                properties: {
                    title: { type: "string", minLength: 1 }
                }
            }).getNodeChild("title", { title: "abc" });

            assert(isSchemaNode(node), "should have returned a valid schema node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });

        it("should return node of property even it type differs", () => {
            const { node } = compileSchema({
                type: "object",
                properties: {
                    title: { type: "string", minLength: 1 }
                }
            }).getNodeChild("title", { title: 123 });

            assert(isSchemaNode(node), "should have returned a valid schema node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });

        it("should return undefined if property is not defined, but allowed", () => {
            const { node } = compileSchema({
                type: "object",
                properties: {
                    title: { type: "string", minLength: 1 }
                }
            }).getNodeChild("body", { body: "abc" });

            assert.deepEqual(node, undefined);
        });

        it("should return an error when the property is not allowed", () => {
            const { error } = compileSchema({
                type: "object",
                properties: {
                    title: { type: "string", minLength: 1 }
                },
                additionalProperties: false
            }).getNodeChild("body", { title: "abc" });

            assert(isJsonError(error), "should have return an error");
        });

        it("should return the original schema of the property", () => {
            const { node } = compileSchema({
                type: "object",
                properties: {
                    title: { type: "string", allOf: [{ minLength: 1 }] }
                }
            }).getNodeChild("title", { body: "abc" });

            assert.deepEqual(node.schema, { type: "string", allOf: [{ minLength: 1 }] });
        });

        it("should reduce parent schema for returned property", () => {
            const { node } = compileSchema({
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
            }).getNodeChild("title", { body: "abc" });

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });
    });

    describe("array - multiple contains", () => {
        it("should pick correct schema from allOf contains", () => {
            const { node } = compileSchema({
                allOf: [{ contains: { multipleOf: 2 } }, { contains: { multipleOf: 3 } }]
            }).getNodeChild(0, [2, 5]);

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { anyOf: [{ multipleOf: 2 }, { multipleOf: 3 }] });
        });
    });

    describe("object - reduce parent schema when returning child-property", () => {
        it("should reduce parent if-then schema when returning property node", () => {
            const { node } = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                if: { properties: { title: { minLength: 2 } } },
                then: { properties: { title: { maxLength: 3 } } },
                else: { properties: { title: { minLength: 4 } } }
            }).getNodeChild("title", { title: "abcd" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", maxLength: 3 });
        });

        it("should reduce parent if-else schema when returning node", () => {
            const { node } = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                if: { properties: { title: { minLength: 2 } } },
                then: { properties: { title: { maxLength: 3 } } },
                else: { properties: { title: { minLength: 4 } } }
            }).getNodeChild("title", { title: "a" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 4 });
        });

        it("should reduce parent anyOf schema when returning property node", () => {
            const { node } = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                anyOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).getNodeChild("title", { title: "abcd" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });

        it("should reduce all matching parent anyOf schema when returning property node", () => {
            const { node } = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                anyOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).getNodeChild("title", { title: "a" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1, maxLength: 1 });
        });

        it("should reduce all allOf schema when returning property node", () => {
            const { node } = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                allOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).getNodeChild("title");

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1, maxLength: 1 });
        });

        it("should reduce matching oneOf schema when returning property node", () => {
            const { node } = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                oneOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).getNodeChild("title", { title: "" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", maxLength: 1 });
        });

        it("should return matching oneOf schema with `additionalProperties=false`", () => {
            const { node } = compileSchema({
                oneOf: [
                    { properties: { title: { type: "string" } }, additionalProperties: false },
                    { properties: { title: { type: "number" } }, additionalProperties: false }
                ]
            }).getNodeChild("title", { title: "" });
            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string" });
        });

        it("should return error when multiple oneOf-items match", () => {
            const { error } = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                oneOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).getNodeChild("title", { title: "a" });

            assert(isJsonError(error), "should have returned a valid schema property node");
        });

        it("should return error when multiple oneOf-items match", () => {
            const { error } = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                oneOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).getNodeChild("title", { title: "a" });

            assert(isJsonError(error), "should have returned a valid schema property node");
        });
    });

    describe("object - get child property from resolved dynamic schema", () => {
        it("should get property from dependentSchemas", () => {
            const { node } = compileSchema({
                type: "object",
                dependentSchemas: {
                    trigger: { properties: { title: { type: "string", minLength: 1 } } }
                }
            }).getNodeChild("title", { trigger: "trigger" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });

        it("should get merged property from patternProperties", () => {
            const { node } = compileSchema({
                type: "object",
                properties: { title: { type: "string", minLength: 1 } },
                patternProperties: { le: { maxLength: 3 } }
            }).getNodeChild("title");

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1, maxLength: 3 });
        });

        it("should get property from merged allOf schema", () => {
            const { node } = compileSchema({
                type: "object",
                allOf: [{ properties: { title: { type: "string" } } }, { properties: { title: { minLength: 1 } } }]
            }).getNodeChild("title");

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });

        it("should return combined allOf schema", () => {
            const allOf = [
                { properties: { secondary: { id: "secondary", type: "string" } } },
                { properties: { tertiary: { id: "tertiary", type: "number" } } }
            ];
            const { node: res } = compileSchema({
                type: "object",
                properties: {
                    dynamicSchema: {
                        type: "object",
                        properties: { trigger: { type: "boolean" } },
                        allOf
                    }
                }
            }).getNodeChild("dynamicSchema");

            const { node } = res.reduceNode({ trigger: true });

            assert.deepEqual(node.schema, {
                type: "object",
                properties: {
                    trigger: { type: "boolean" },
                    secondary: { type: "string", id: "secondary" },
                    tertiary: { type: "number", id: "tertiary" }
                }
            });
        });

        it("should get property from matching anyOf schema", () => {
            const { node } = compileSchema({
                type: "object",
                anyOf: [
                    { properties: { title: { type: "string", maxLength: 0 }, label: { type: "number", maximum: 0 } } },
                    { properties: { title: { type: "string", minLength: 1 }, label: { type: "number", minimum: 1 } } }
                ]
            }).getNodeChild("label", { title: "matches minLength" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "number", minimum: 1 });
        });

        it("should get property from matching oneOf schema", () => {
            const { node } = compileSchema({
                type: "object",
                oneOf: [
                    { properties: { title: { type: "string" }, label: { type: "string", minLength: 2 } } },
                    { properties: { title: { type: "number" } } }
                ]
            }).getNodeChild("label", { title: "matches string" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 2 });
        });

        it("should return `undefined` for valid oneOf property missing the property", () => {
            const { node } = compileSchema({
                type: "object",
                oneOf: [
                    { properties: { title: { type: "string" }, label: { type: "string", minLength: 2 } } },
                    { properties: { title: { type: "number" } } }
                ]
            }).getNodeChild("label", { title: 123 });

            assert(node === undefined);
        });

        it("should get property from then schema", () => {
            const { node } = compileSchema({
                type: "object",
                if: { properties: { title: { type: "string", minLength: 1 } } },
                then: { properties: { label: { type: "string", maxLength: 2 } } },
                else: { properties: { label: { type: "number", minimum: 1 } } }
            }).getNodeChild("label", { title: "matches minLength" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", maxLength: 2 });
        });

        it("should get property from else schema", () => {
            const { node } = compileSchema({
                type: "object",
                if: { properties: { title: { type: "string", minLength: 1 } } },
                then: { properties: { label: { type: "string", maxLength: 2 } } },
                else: { properties: { label: { type: "number", minimum: 1 } } }
            }).getNodeChild("label", { title: "" });

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

            const schema = node.getNodeChild("title", { title: 4, test: 2 })?.node?.schema;

            assert.deepEqual(schema, { type: "number", minLength: 2 });
        });
    });
});

describe("step", () => {
    it("should return undefined for unknown types", () => {
        const { node, error } = compileSchema({ type: "unknown" }).getNodeChild(0, {});
        assert.equal(node, undefined);
        assert.equal(error, undefined);
    });

    describe("object", () => {
        it("should return object property", () => {
            const { node } = compileSchema({
                type: "object",
                properties: {
                    title: { type: "string" }
                }
            }).getNodeChild("title");

            assert.deepEqual(node.schema, { type: "string" });
        });

        it("should return error undefined for undefined schema", () => {
            const { node, error } = compileSchema({
                type: "object",
                properties: {
                    title: { type: "string" }
                }
            }).getNodeChild("wrongkey");

            assert.equal(node, undefined);
            assert.equal(error, undefined);
        });

        it("should return undefined for unresolved then-schema (unknown schema)", () => {
            const { node, error } = compileSchema({
                type: "object",
                properties: { test: { type: "string" } },
                if: {
                    required: ["test"],
                    properties: {
                        test: { minLength: 10 }
                    }
                },
                then: {
                    required: ["thenValue"],
                    properties: {
                        thenValue: { description: "then", type: "string", default: "from then" }
                    }
                }
            }).getNodeChild("thenValue");

            assert.equal(node, undefined);
            assert.equal(error, undefined);
        });

        it("should return undefined for schema matching `additionalProperties=true`", () => {
            const { node, error } = compileSchema({
                type: "object",
                additionalProperties: true
            }).getNodeChild("any", { any: "i am valid" });

            assert.equal(node, undefined);
            assert.equal(error, undefined);
        });

        it("should treat `additionalProperties` as `true` per default", () => {
            const { node, error } = compileSchema({ type: "object" }).getNodeChild("any", {
                any: "i am valid"
            });
            assert.equal(node, undefined);
            assert.equal(error, undefined);
        });

        it("should return an error if `additionalProperties=false` and property unknown", () => {
            const { error } = compileSchema({
                type: "object",
                additionalProperties: false
            }).getNodeChild("any", {
                any: "i am valid"
            });

            assert(isJsonError(error));
        });

        it("should return matching oneOf", () => {
            const { node } = compileSchema({
                oneOf: [
                    { type: "object", properties: { title: { type: "string" } } },
                    { type: "object", properties: { title: { type: "number" } } }
                ]
            }).getNodeChild("title", { title: 4 });
            assert.deepEqual(node.schema, { type: "number" });
        });

        it("should return matching oneOf, for objects missing properties", () => {
            const { node } = compileSchema({
                oneOf: [
                    { type: "object", additionalProperties: { type: "string" } },
                    { type: "object", additionalProperties: { type: "number" } }
                ]
            }).getNodeChild("title", { title: 4, test: 2 });
            assert.deepEqual(node.schema, { type: "number" });
        });

        it("should return matching anyOf", () => {
            const { node } = compileSchema({
                anyOf: [
                    { type: "object", additionalProperties: { type: "string" } },
                    { type: "object", additionalProperties: { type: "number" } }
                ]
            }).getNodeChild("title", { title: 4, test: 2 });

            assert.deepEqual(node.schema, { type: "number" });
        });

        it("should return combined anyOf schema", () => {
            const { node } = compileSchema({
                anyOf: [
                    { type: "object", additionalProperties: { type: "string" } },
                    { type: "object", additionalProperties: { type: "number" } },
                    { type: "object", additionalProperties: { minimum: 2 } }
                ]
            }).getNodeChild("title", { title: 4, test: 2 });

            assert.deepEqual(node.schema, { type: "number", minimum: 2 });
        });

        it("should resolve references from anyOf schema", () => {
            const { node } = compileSchema({
                definitions: {
                    string: { type: "object", additionalProperties: { type: "string" } },
                    number: { type: "object", additionalProperties: { type: "number" } },
                    min: { type: "object", additionalProperties: { minimum: 2 } }
                },
                anyOf: [
                    { $ref: "#/definitions/string" },
                    { $ref: "#/definitions/number" },
                    { $ref: "#/definitions/min" }
                ]
            }).getNodeChild("title", { title: 4, test: 2 });

            assert.deepEqual(node.schema, { type: "number", minimum: 2 });
        });

        it("should return matching allOf schema", () => {
            const { node } = compileSchema({
                allOf: [{ type: "object" }, { additionalProperties: { type: "number" } }]
            }).getNodeChild("title", { title: 4, test: 2 });

            assert.deepEqual(node.schema, { type: "number" });
        });

        it("should resolve references in allOf schema", () => {
            const { node } = compileSchema({
                definitions: {
                    object: { type: "object" },
                    additionalNumber: { additionalProperties: { type: "number" } }
                },
                allOf: [{ $ref: "#/definitions/object" }, { $ref: "#/definitions/additionalNumber" }]
            }).getNodeChild("title", { title: 4, test: 2 });

            assert.deepEqual(node.schema, { type: "number" });
        });

        it("should return matching patternProperty", () => {
            const { node } = compileSchema({
                type: "object",
                patternProperties: {
                    "^first$": { type: "number", id: "first" },
                    "^second$": { type: "string", id: "second" }
                }
            }).getNodeChild("second");

            assert.deepEqual(node.schema, { type: "string", id: "second" });
        });

        it("should return additionalProperties schema for not matching patternProperty", () => {
            const { node } = compileSchema({
                type: "object",
                patternProperties: {
                    "^first$": { type: "number", id: "first" },
                    "^second$": { type: "string", id: "second" }
                },
                additionalProperties: { type: "object" }
            }).getNodeChild("third");

            assert.deepEqual(node.schema, { type: "object" });
        });
    });

    describe("array", () => {
        it("should return undefined for unknown item schema", () => {
            const { node, error } = compileSchema({
                type: "array"
            }).getNodeChild(0, []);
            assert.equal(node, undefined);
            assert.equal(error, undefined);
        });

        it("should return item property", () => {
            const { node } = compileSchema({
                type: "array",
                items: { type: "string" }
            }).getNodeChild(0);
            assert.deepEqual(node.schema, { type: "string" });
        });

        it("should return item at index", () => {
            const { node, error } = compileSchema({
                type: "array",
                prefixItems: [{ type: "string" }, { type: "number" }, { type: "boolean" }]
            }).getNodeChild(1, ["3", 2]);

            assert.deepEqual(node.schema, { type: "number" });
        });

        it("should return matching item in oneOf", () => {
            const { node: res } = compileSchema({
                type: "array",
                items: {
                    oneOf: [
                        { type: "object", properties: { title: { type: "string" } } },
                        { type: "object", properties: { title: { type: "number" } } }
                    ]
                }
            }).getNodeChild(0, [{ title: 2 }]);

            const { node } = res.reduceNode({ title: 2 });

            assert.deepEqual(node.schema, {
                type: "object",
                properties: { title: { type: "number" } }
            });
        });

        it("should return matching anyOf", () => {
            const { node: res } = compileSchema({
                items: {
                    anyOf: [
                        { type: "object", properties: { title: { type: "string" } } },
                        { type: "object", properties: { title: { type: "number" } } }
                    ]
                }
            }).getNodeChild(1, [{ title: "two" }, { title: 4 }]);

            const { node } = res.reduceNode({ title: 4 });

            assert.deepEqual(node.schema, { type: "object", properties: { title: { type: "number" } } });
        });

        it("should return combined anyOf schema", () => {
            const { node: res } = compileSchema({
                items: {
                    anyOf: [
                        { type: "object", properties: { title: { type: "string" } } },
                        { type: "object", properties: { title: { type: "number" } } },
                        { type: "object", properties: { title: { minimum: 2 } } }
                    ]
                }
            }).getNodeChild(1, [{ title: "two" }, { title: 4 }]);

            const { node } = res.reduceNode({ title: 4 });

            assert.deepEqual(node.schema, { type: "object", properties: { title: { type: "number", minimum: 2 } } });
        });

        it("should return combined allOf schema", () => {
            const { node: res } = compileSchema({
                items: {
                    allOf: [
                        { type: "object", properties: { title: { type: "number" } } },
                        { type: "object", properties: { title: { minimum: 3 } } }
                    ]
                }
            }).getNodeChild(1, [{ title: "two" }, { title: 4 }]);

            const { node } = res.reduceNode({ title: "two" });

            assert.deepEqual(node.schema, {
                type: "object",
                properties: { title: { type: "number", minimum: 3 } }
            });
        });

        it("should return a generated schema from `items:true`", () => {
            const { node: res } = compileSchema({
                type: "array",
                items: true
            }).getNodeChild(1, ["3", 2], { createSchema: true });
            assert(isSchemaNode(res));
            assert.deepEqual(res.schema.type, "number");
        });
    });
});
