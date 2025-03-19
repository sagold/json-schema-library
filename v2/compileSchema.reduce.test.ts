import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { isSchemaNode } from "./types";

describe("compileSchema : reduce", () => {
    describe("behaviour", () => {});

    it("should return schema for boolean schema true", () => {
        // @ts-expect-error boolean schema still untyped
        const node = compileSchema(true);

        const schema = node.reduce({ data: 123 })?.schema;

        assert.deepEqual(schema, { type: "number" });
    });

    it("should compile schema with current data", () => {
        const node = compileSchema({
            type: "object",
            if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
            then: {
                required: ["header"],
                properties: { header: { type: "string", minLength: 1 } }
            }
        });

        const dataNode = node.reduce({ data: { withHeader: true } });

        assert.deepEqual(dataNode?.schema, {
            type: "object",
            required: ["header"],
            properties: { header: { type: "string", minLength: 1 } }
        });
    });

    it("should resolve both if-then-else and allOf schema", () => {
        const node = compileSchema({
            type: "object",
            if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
            then: {
                required: ["header"],
                properties: { header: { type: "string", minLength: 1 } }
            },
            allOf: [{ required: ["date"], properties: { date: { type: "string", format: "date" } } }]
        });

        const schema = node.reduce({ data: { withHeader: true, header: "huhu" } })?.schema;

        assert.deepEqual(schema, {
            type: "object",
            required: ["date", "header"],
            properties: {
                header: { type: "string", minLength: 1 },
                date: { type: "string", format: "date" }
            }
        });
    });

    it.skip("should recursively compile schema with current data", () => {
        const node = compileSchema({
            type: "object",
            properties: {
                article: {
                    type: "object",
                    if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                    then: {
                        required: ["header"],
                        properties: { header: { type: "string", minLength: 1 } }
                    }
                }
            }
        });

        const dataNode = node.reduce({ data: { article: { withHeader: true } } });

        assert.deepEqual(dataNode?.schema, {
            type: "object",
            properties: {
                article: {
                    type: "object",
                    required: ["header"],
                    properties: { header: { type: "string", minLength: 1 } }
                }
            }
        });
    });

    describe("object - merge all reduced dynamic schema", () => {
        it("should reduce patternProperties and allOf", () => {
            const node = compileSchema({
                allOf: [{ properties: { "107": { type: "string", maxLength: 99 } } }],
                patternProperties: { "[0-1][0-1]7": { type: "string", minLength: 1 } }
            });

            const schema = node.reduce({ data: { "107": undefined } })?.schema;

            assert.deepEqual(schema, { properties: { "107": { type: "string", minLength: 1, maxLength: 99 } } });
        });
    });

    describe("object - recursively resolve dynamic properties", () => {
        it("should reduce allOf and oneOf", () => {
            const node = compileSchema({
                allOf: [
                    {
                        oneOf: [
                            { type: "string", minLength: 1 },
                            { type: "number", minimum: 1 }
                        ]
                    }
                ]
            });

            const schema = node.reduce({ data: 123 })?.schema;

            assert.deepEqual(schema, { type: "number", minimum: 1 });
        });

        it("should reduce oneOf and allOf", () => {
            const node = compileSchema({
                oneOf: [{ allOf: [{ type: "string", minLength: 1 }] }, { allOf: [{ type: "number", minimum: 1 }] }]
            });

            const schema = node.reduce({ data: 123 })?.schema;

            assert.deepEqual(schema, { type: "number", minimum: 1 });
        });

        it("should iteratively resolve allOf before merging (issue#44)", () => {
            const node = compileSchema({
                type: "object",
                properties: { trigger: { type: "boolean" } },
                allOf: [
                    {
                        if: {
                            not: {
                                properties: { trigger: { type: "boolean", const: true } }
                            }
                        },
                        then: {
                            properties: { trigger: { type: "boolean", const: false } }
                        }
                    },
                    {
                        if: {
                            not: {
                                properties: { trigger: { type: "boolean", const: false } }
                            }
                        },
                        then: {
                            properties: { trigger: { const: true } }
                        }
                    }
                ]
            }).reduce({ data: { trigger: true } });

            assert(isSchemaNode(node));
            assert.deepEqual(node.schema, {
                type: "object",
                properties: {
                    trigger: { type: "boolean", const: true }
                }
            });
        });
    });
});
