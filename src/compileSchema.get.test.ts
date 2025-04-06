import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { isSchemaNode, isJsonError } from "./types";

describe("compileSchema : get", () => {
    describe("behaviour", () => {
        it("should return node of property", () => {
            const node = compileSchema({
                $schema: "draft-2019-09",
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
                $schema: "draft-2019-09",
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
                $schema: "draft-2019-09",
                type: "object",
                properties: {
                    title: { type: "string", minLength: 1 }
                }
            }).get("body", { body: "abc" });

            assert.deepEqual(node, undefined);
        });

        it("should return an error when the property is not allowed", () => {
            const node = compileSchema({
                $schema: "draft-2019-09",
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
                $schema: "draft-2019-09",
                type: "object",
                properties: {
                    title: { type: "string", allOf: [{ minLength: 1 }] }
                }
            }).get("title", { body: "abc" });

            assert.deepEqual(node.schema, { type: "string", allOf: [{ minLength: 1 }] });
        });

        it("should reduce parent schema for returned property", () => {
            const node = compileSchema({
                $schema: "draft-2019-09",
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

    describe("array - multiple contains", () => {
        it("should pick correct schema from allOf contains", () => {
            const node = compileSchema({
                allOf: [{ contains: { multipleOf: 2 } }, { contains: { multipleOf: 3 } }]
            }).get(0, [2, 5]);

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { anyOf: [{ multipleOf: 2 }, { multipleOf: 3 }] });
        });
    });

    describe("object - reduce parent schema when returning child-property", () => {
        it("should reduce parent if-then schema when returning property node", () => {
            const node = compileSchema({
                $schema: "draft-2019-09",
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
                $schema: "draft-2019-09",
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
                $schema: "draft-2019-09",
                type: "object",
                properties: { title: { type: "string" } },
                anyOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).get("title", { title: "abcd" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });

        it("should reduce all matching parent anyOf schema when returning property node", () => {
            const node = compileSchema({
                $schema: "draft-2019-09",
                type: "object",
                properties: { title: { type: "string" } },
                anyOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).get("title", { title: "a" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1, maxLength: 1 });
        });

        it("should reduce all allOf schema when returning property node", () => {
            const node = compileSchema({
                $schema: "draft-2019-09",
                type: "object",
                properties: { title: { type: "string" } },
                allOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).get("title");

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1, maxLength: 1 });
        });

        it("should reduce matching oneOf schema when returning property node", () => {
            const node = compileSchema({
                $schema: "draft-2019-09",
                type: "object",
                properties: { title: { type: "string" } },
                oneOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).get("title", { title: "" });

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", maxLength: 1 });
        });

        it("should return matching oneOf schema with `additionalProperties=false`", () => {
            const node = compileSchema({
                $schema: "draft-2019-09",
                oneOf: [
                    { properties: { title: { type: "string" } }, additionalProperties: false },
                    { properties: { title: { type: "number" } }, additionalProperties: false }
                ]
            }).get("title", { title: "" });
            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string" });
        });

        it("should return error when multiple oneOf-items match", () => {
            const node = compileSchema({
                $schema: "draft-2019-09",
                type: "object",
                properties: { title: { type: "string" } },
                oneOf: [{ properties: { title: { minLength: 1 } } }, { properties: { title: { maxLength: 1 } } }]
            }).get("title", { title: "a" });

            assert(isJsonError(node), "should have returned a valid schema property node");
        });

        it("should return error when multiple oneOf-items match", () => {
            const node = compileSchema({
                $schema: "draft-2019-09",
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
                $schema: "draft-2019-09",
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
                $schema: "draft-2019-09",
                type: "object",
                properties: { title: { type: "string", minLength: 1 } },
                patternProperties: { le: { maxLength: 3 } }
            }).get("title");

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1, maxLength: 3 });
        });

        it("should get property from merged allOf schema", () => {
            const node = compileSchema({
                $schema: "draft-2019-09",
                type: "object",
                allOf: [{ properties: { title: { type: "string" } } }, { properties: { title: { minLength: 1 } } }]
            }).get("title");

            assert(isSchemaNode(node), "should have returned a valid schema property node");

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });

        it("should return combined allOf schema", () => {
            const allOf = [
                { properties: { secondary: { id: "secondary", type: "string" } } },
                { properties: { tertiary: { id: "tertiary", type: "number" } } }
            ];
            let res = compileSchema({
                $schema: "draft-2019-09",
                type: "object",
                properties: {
                    dynamicSchema: {
                        type: "object",
                        properties: { trigger: { type: "boolean" } },
                        allOf
                    }
                }
            }).get("dynamicSchema");
            assert(isSchemaNode(res));
            res = res.reduce({ data: { trigger: true } });

            assert.deepEqual(res.schema, {
                type: "object",
                properties: {
                    trigger: { type: "boolean" },
                    secondary: { type: "string", id: "secondary" },
                    tertiary: { type: "number", id: "tertiary" }
                }
            });
        });

        it("should get property from matching anyOf schema", () => {
            const node = compileSchema({
                $schema: "draft-2019-09",
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
                $schema: "draft-2019-09",
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
                $schema: "draft-2019-09",
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
                $schema: "draft-2019-09",
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
                $schema: "draft-2019-09",
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
                $schema: "draft-2019-09",
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

describe("step", () => {
    it("should return undefined for unknown types", () => {
        const res = compileSchema({ $schema: "draft-2019-09", type: "unknown" }).get(0, {});
        assert.equal(res, undefined);
    });

    describe("object", () => {
        it("should return object property", () => {
            const res = compileSchema({
                $schema: "draft-2019-09",
                type: "object",
                properties: {
                    title: { type: "string" }
                }
            }).get("title");

            assert.deepEqual(res.schema, { type: "string" });
        });

        it("should return error undefined for undefined schema", () => {
            const res = compileSchema({
                $schema: "draft-2019-09",
                type: "object",
                properties: {
                    title: { type: "string" }
                }
            }).get("wrongkey");

            assert.equal(res, undefined);
        });

        it("should return undefined for unresolved then-schema (unknown schema)", () => {
            const res = compileSchema({
                $schema: "draft-2019-09",
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
            }).get("thenValue");

            assert.equal(res, undefined);
        });

        it("should return undefined for schema matching `additionalProperties=true`", () => {
            const res = compileSchema({
                $schema: "draft-2019-09",
                type: "object",
                additionalProperties: true
            }).get("any", { any: "i am valid" });
            assert.deepEqual(res, undefined);
        });

        it("should treat `additionalProperties` as `true` per default", () => {
            const res = compileSchema({ $schema: "draft-2019-09", type: "object" }).get("any", { any: "i am valid" });
            assert.deepEqual(res, undefined);
        });

        it("should return an error if `additionalProperties=false` and property unknown", () => {
            const res = compileSchema({ $schema: "draft-2019-09", type: "object", additionalProperties: false }).get(
                "any",
                {
                    any: "i am valid"
                }
            );

            assert(isJsonError(res));
        });

        it("should return matching oneOf", () => {
            const res = compileSchema({
                $schema: "draft-2019-09",
                oneOf: [
                    { type: "object", properties: { title: { type: "string" } } },
                    { type: "object", properties: { title: { type: "number" } } }
                ]
            }).get("title", { title: 4 });
            assert.deepEqual(res.schema, { type: "number" });
        });

        it("should return matching oneOf, for objects missing properties", () => {
            const res = compileSchema({
                $schema: "draft-2019-09",
                oneOf: [
                    { type: "object", additionalProperties: { type: "string" } },
                    { type: "object", additionalProperties: { type: "number" } }
                ]
            }).get("title", { title: 4, test: 2 });
            assert.deepEqual(res.schema, { type: "number" });
        });

        it("should return matching anyOf", () => {
            const res = compileSchema({
                $schema: "draft-2019-09",
                anyOf: [
                    { type: "object", additionalProperties: { type: "string" } },
                    { type: "object", additionalProperties: { type: "number" } }
                ]
            }).get("title", { title: 4, test: 2 });

            assert.deepEqual(res.schema, { type: "number" });
        });

        it("should return combined anyOf schema", () => {
            const res = compileSchema({
                $schema: "draft-2019-09",
                anyOf: [
                    { type: "object", additionalProperties: { type: "string" } },
                    { type: "object", additionalProperties: { type: "number" } },
                    { type: "object", additionalProperties: { minimum: 2 } }
                ]
            }).get("title", { title: 4, test: 2 });

            assert.deepEqual(res.schema, { type: "number", minimum: 2 });
        });

        it("should resolve references from anyOf schema", () => {
            const res = compileSchema({
                $schema: "draft-2019-09",
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
            }).get("title", { title: 4, test: 2 });

            assert.deepEqual(res.schema, { type: "number", minimum: 2 });
        });

        it("should return matching allOf schema", () => {
            const res = compileSchema({
                $schema: "draft-2019-09",
                allOf: [{ type: "object" }, { additionalProperties: { type: "number" } }]
            }).get("title", { title: 4, test: 2 });

            assert.deepEqual(res.schema, { type: "number" });
        });

        it("should resolve references in allOf schema", () => {
            const res = compileSchema({
                $schema: "draft-2019-09",
                definitions: {
                    object: { type: "object" },
                    additionalNumber: { additionalProperties: { type: "number" } }
                },
                allOf: [{ $ref: "#/definitions/object" }, { $ref: "#/definitions/additionalNumber" }]
            }).get("title", { title: 4, test: 2 });

            assert.deepEqual(res.schema, { type: "number" });
        });

        it("should return matching patternProperty", () => {
            const res = compileSchema({
                $schema: "draft-2019-09",
                type: "object",
                patternProperties: {
                    "^first$": { type: "number", id: "first" },
                    "^second$": { type: "string", id: "second" }
                }
            }).get("second");

            assert.deepEqual(res.schema, { type: "string", id: "second" });
        });

        it("should return additionalProperties schema for not matching patternProperty", () => {
            const res = compileSchema({
                $schema: "draft-2019-09",
                type: "object",
                patternProperties: {
                    "^first$": { type: "number", id: "first" },
                    "^second$": { type: "string", id: "second" }
                },
                additionalProperties: { type: "object" }
            }).get("third");

            assert.deepEqual(res.schema, { type: "object" });
        });
    });

    describe("array", () => {
        it("should return undefined for unknown item schema", () => {
            const res = compileSchema({ $schema: "draft-2019-09", type: "array" }).get(0, []);
            assert.equal(res, undefined);
        });

        it("should return item property", () => {
            const res = compileSchema({ $schema: "draft-2019-09", type: "array", items: { type: "string" } }).get(0);
            assert.deepEqual(res.schema, { type: "string" });
        });

        it("should return item at index", () => {
            const res = compileSchema({
                $schema: "draft-2019-09",
                type: "array",
                items: [{ type: "string" }, { type: "number" }, { type: "boolean" }]
            }).get(1, ["3", 2]);

            assert.deepEqual(res.schema, { type: "number" });
        });

        it("should return matching item in oneOf", () => {
            let res = compileSchema({
                $schema: "draft-2019-09",
                type: "array",
                items: {
                    oneOf: [
                        { type: "object", properties: { title: { type: "string" } } },
                        { type: "object", properties: { title: { type: "number" } } }
                    ]
                }
            }).get(0, [{ title: 2 }]);

            assert(isSchemaNode(res));
            res = res.reduce({ data: { title: 2 } });

            assert.deepEqual(res.schema, {
                type: "object",
                properties: { title: { type: "number" } }
            });
        });

        it("should return matching anyOf", () => {
            let res = compileSchema({
                $schema: "draft-2019-09",
                items: {
                    anyOf: [
                        { type: "object", properties: { title: { type: "string" } } },
                        { type: "object", properties: { title: { type: "number" } } }
                    ]
                }
            }).get(1, [{ title: "two" }, { title: 4 }]);

            assert(isSchemaNode(res));
            res = res.reduce({ data: { title: 4 } });

            assert.deepEqual(res.schema, { type: "object", properties: { title: { type: "number" } } });
        });

        it("should return combined anyOf schema", () => {
            let res = compileSchema({
                $schema: "draft-2019-09",
                items: {
                    anyOf: [
                        { type: "object", properties: { title: { type: "string" } } },
                        { type: "object", properties: { title: { type: "number" } } },
                        { type: "object", properties: { title: { minimum: 2 } } }
                    ]
                }
            }).get(1, [{ title: "two" }, { title: 4 }]);

            assert(isSchemaNode(res));
            res = res.reduce({ data: { title: 4 } });

            assert.deepEqual(res.schema, { type: "object", properties: { title: { type: "number", minimum: 2 } } });
        });

        it("should return combined allOf schema", () => {
            let res = compileSchema({
                $schema: "draft-2019-09",
                items: {
                    allOf: [
                        { type: "object", properties: { title: { type: "number" } } },
                        { type: "object", properties: { title: { minimum: 3 } } }
                    ]
                }
            }).get(1, [{ title: "two" }, { title: 4 }]);

            assert(isSchemaNode(res));
            res = res.reduce({ data: { title: "two" } });

            assert.deepEqual(res.schema, {
                type: "object",
                properties: { title: { type: "number", minimum: 3 } }
            });
        });

        it("should return a generated schema with additionalItems", () => {
            const res = compileSchema({ $schema: "draft-2019-09", type: "array", additionalItems: true }).get(1, [
                "3",
                2
            ]);
            assert(isSchemaNode(res));
            assert.deepEqual(res.schema.type, "number");
        });
    });
});
