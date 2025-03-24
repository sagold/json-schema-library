import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";
import { isJsonError } from "../types";
import { reduceOneOfDeclarator, reduceOneOfFuzzy } from "./oneOf";
import settings from "../settings";
const DECLARATOR_ONEOF = settings.DECLARATOR_ONEOF;
describe("feature : oneof : validate", () => {
    it("should validate matching oneOf", () => {
        const errors = compileSchema({
            oneOf: [
                { type: "object", properties: { value: { type: "string" } } },
                { type: "object", properties: { value: { type: "integer" } } }
            ]
        }).validate({ value: "a string" });
        assert.equal(errors.length, 0);
    });
    it("should return error for non-matching oneOf", () => {
        const errors = compileSchema({
            type: "object",
            oneOf: [
                { type: "object", properties: { value: { type: "string" } } },
                { type: "object", properties: { value: { type: "integer" } } }
            ]
        }).validate({ value: [] });
        assert.equal(errors.length, 1);
        assert.equal(errors[0].code, "one-of-error");
    });
});
describe("feature : oneOf : reduce", () => {
    it("should resolve matching value schema", () => {
        const node = compileSchema({
            oneOf: [
                { type: "string", title: "A String" },
                { type: "number", title: "A Number" }
            ]
        }).reduce({ data: 111 });
        assert.deepEqual(node.schema, { type: "number", title: "A Number" });
        // assert.equal(node.oneOfIndex, 1, "should have exposed correct resolved oneOfIndex");
    });
    it("should return error if no matching schema could be found", () => {
        const node = compileSchema({
            oneOf: [
                { type: "string", title: "A String" },
                { type: "number", title: "A Number" }
            ]
        }).reduce({ data: true });
        assert(isJsonError(node));
    });
    it("should return error if multiple schema match", () => {
        const node = compileSchema({
            oneOf: [
                { type: "string", minLength: 1 },
                { type: "string", maxLength: 3 }
            ]
        }).reduce({ data: "12" });
        assert(isJsonError(node));
    });
    it("should reduce nested oneOf objects using ref", () => {
        const node = compileSchema({
            $defs: { withData: { oneOf: [{ required: ["b"], properties: { b: { type: "number" } } }] } },
            oneOf: [{ required: ["a"], properties: { a: { type: "string" } } }, { $ref: "#/$defs/withData" }]
        }).reduce({ data: { b: 111 } });
        assert.deepEqual(node.schema, { required: ["b"], properties: { b: { type: "number" } } });
    });
    it("should reduce nested oneOf boolean schema using ref", () => {
        const node = compileSchema({
            $defs: { withData: { oneOf: [{ required: ["b"], properties: { b: true } }] } },
            oneOf: [{ required: ["a"], properties: { a: false } }, { $ref: "#/$defs/withData" }]
        }).reduce({ data: { b: 111 } });
        assert.deepEqual(node.schema, { required: ["b"], properties: { b: true } });
    });
    it("should resolve matching object schema", () => {
        const node = compileSchema({
            oneOf: [
                {
                    type: "object",
                    properties: { title: { type: "string" } }
                },
                {
                    type: "object",
                    properties: { title: { type: "number" } }
                }
            ]
        }).reduce({ data: { title: 4 } });
        assert.deepEqual(node.schema, {
            type: "object",
            properties: { title: { type: "number" } }
        });
    });
    it("should return matching oneOf, for objects missing properties", () => {
        const node = compileSchema({
            oneOf: [
                {
                    type: "object",
                    additionalProperties: { type: "string" }
                },
                {
                    type: "object",
                    additionalProperties: { type: "number" }
                }
            ]
        }).reduce({ data: { title: 4, test: 2 } });
        assert.deepEqual(node.schema, {
            type: "object",
            additionalProperties: { type: "number" }
        });
    });
});
describe("feature : oneof-fuzzy : reduce", () => {
    it("should return schema with matching type", () => {
        const node = compileSchema({
            oneOf: [{ type: "string" }, { type: "number" }, { type: "object" }]
        });
        const res = reduceOneOfFuzzy({ node, data: 4 });
        assert.deepEqual(res.schema, { type: "number" });
        // @todo should move oneOfIndex-property to exported node
        // assert.deepEqual(res.oneOfIndex, 1);
    });
    it("should return schema with matching pattern", () => {
        const node = compileSchema({
            oneOf: [
                { type: "string", pattern: "obelix" },
                { type: "string", pattern: "asterix" }
            ]
        });
        const res = reduceOneOfFuzzy({ node, data: "anasterixcame" });
        assert.deepEqual(res.schema, { type: "string", pattern: "asterix" });
    });
    it("should resolve $ref before schema", () => {
        const node = compileSchema({
            definitions: {
                a: { type: "string", pattern: "obelix" },
                b: { type: "string", pattern: "asterix" }
            },
            oneOf: [{ $ref: "#/definitions/a" }, { $ref: "#/definitions/b" }]
        });
        const res = reduceOneOfFuzzy({ node, data: "anasterixcame" });
        assert.deepEqual(res.schema, { type: "string", pattern: "asterix" });
    });
    describe("object", () => {
        it("should return schema with matching properties", () => {
            const node = compileSchema({
                oneOf: [
                    { type: "object", properties: { title: { type: "string" } } },
                    { type: "object", properties: { description: { type: "string" } } },
                    { type: "object", properties: { content: { type: "string" } } }
                ]
            });
            const res = reduceOneOfFuzzy({ node, data: { description: "..." } });
            assert.deepEqual(res.schema, {
                type: "object",
                properties: { description: { type: "string" } }
            });
        });
        it("should return schema matching nested properties", () => {
            const node = compileSchema({
                oneOf: [
                    { type: "object", properties: { title: { type: "number" } } },
                    { type: "object", properties: { title: { type: "string" } } }
                ]
            });
            const res = reduceOneOfFuzzy({ node, data: { title: "asterix" } });
            assert.deepEqual(res.schema, {
                type: "object",
                properties: { title: { type: "string" } }
            });
        });
        it("should return schema with least missing properties", () => {
            const t = { type: "number" };
            const node = compileSchema({
                oneOf: [
                    { type: "object", properties: { a: t, c: t, d: t } },
                    { type: "object", properties: { a: t, b: t, c: t } },
                    { type: "object", properties: { a: t, d: t, e: t } }
                ]
            });
            const res = reduceOneOfFuzzy({ node, data: { a: 0, b: 1 } });
            assert.deepEqual(res.schema, {
                type: "object",
                properties: { a: t, b: t, c: t }
            });
        });
        it("should only count properties that match the schema", () => {
            const t = { type: "number" };
            const node = compileSchema({
                oneOf: [
                    { type: "object", properties: { a: { type: "string" }, b: t, c: t } },
                    { type: "object", properties: { a: { type: "boolean" }, b: t, d: t } },
                    { type: "object", properties: { a: { type: "number" }, b: t, e: t } }
                ]
            });
            const res = reduceOneOfFuzzy({ node, data: { a: true, b: 1 } });
            assert.deepEqual(res.schema, {
                type: "object",
                properties: { a: { type: "boolean" }, b: t, d: t }
            });
        });
        it("should find correct pay type", () => {
            const node = compileSchema({
                type: "object",
                oneOf: [
                    {
                        type: "object",
                        properties: { type: { type: "string", default: "free", pattern: "^free" } }
                    },
                    {
                        type: "object",
                        properties: {
                            redirectUrl: { format: "url", type: "string" },
                            type: { type: "string", default: "teaser", pattern: "^teaser" }
                        }
                    },
                    {
                        type: "object",
                        properties: {
                            redirectUrl: { format: "url", type: "string" },
                            type: { type: "string", default: "article", pattern: "^article" }
                        }
                    }
                ]
            });
            const res = reduceOneOfFuzzy({
                node,
                data: { type: "teaser", redirectUrl: "http://example.com/test/pay/article.html" }
            });
            assert.deepEqual(res.schema, {
                type: "object",
                properties: {
                    redirectUrl: { format: "url", type: "string" },
                    type: { type: "string", default: "teaser", pattern: "^teaser" }
                }
            });
        });
    });
});
describe("feature : oneof-property : reduce", () => {
    describe("object", () => {
        it("should return schema matching oneOfProperty", () => {
            const node = compileSchema({
                [DECLARATOR_ONEOF]: "name",
                oneOf: [
                    {
                        type: "object",
                        properties: { name: { type: "string", pattern: "^1$" }, title: { type: "number" } }
                    },
                    {
                        type: "object",
                        properties: { name: { type: "string", pattern: "^2$" }, title: { type: "number" } }
                    },
                    {
                        type: "object",
                        properties: { name: { type: "string", pattern: "^3$" }, title: { type: "number" } }
                    }
                ]
            });
            const res = reduceOneOfDeclarator({ node, data: { name: "2", title: 123 } });
            assert.deepEqual(res.schema, {
                type: "object",
                properties: {
                    name: { type: "string", pattern: "^2$" },
                    title: { type: "number" }
                }
            });
        });
        it("should return schema matching oneOfProperty even it is invalid", () => {
            const node = compileSchema({
                [DECLARATOR_ONEOF]: "name",
                oneOf: [
                    {
                        type: "object",
                        properties: { name: { type: "string", pattern: "^1$" }, title: { type: "number" } }
                    },
                    {
                        type: "object",
                        properties: { name: { type: "string", pattern: "^2$" }, title: { type: "number" } }
                    },
                    {
                        type: "object",
                        properties: { name: { type: "string", pattern: "^3$" }, title: { type: "number" } }
                    }
                ]
            });
            const res = reduceOneOfDeclarator({ node, data: { name: "2", title: "not a number" } });
            assert.deepEqual(res.schema, {
                type: "object",
                properties: {
                    name: { type: "string", pattern: "^2$" },
                    title: { type: "number" }
                }
            });
        });
        it("should return an error if value at oneOfProperty is undefined", () => {
            const node = compileSchema({
                [DECLARATOR_ONEOF]: "name",
                oneOf: [
                    {
                        type: "object",
                        properties: { name: { type: "string", pattern: "^1$" }, title: { type: "number" } }
                    },
                    {
                        type: "object",
                        properties: { name: { type: "string", pattern: "^2$" }, title: { type: "number" } }
                    },
                    {
                        type: "object",
                        properties: { name: { type: "string", pattern: "^3$" }, title: { type: "number" } }
                    }
                ]
            });
            const res = reduceOneOfDeclarator({ node, data: { title: "not a number" } });
            assert(isJsonError(res), "expected result to be an error");
            assert.deepEqual(res.name, "MissingOneOfPropertyError");
        });
    });
    describe("array", () => {
        it("should return an error if no oneOfProperty could be matched", () => {
            const node = compileSchema({
                oneOf: [
                    {
                        type: "object",
                        required: ["title"],
                        properties: {
                            title: {
                                type: "string"
                            }
                        }
                    }
                ]
            });
            const res = reduceOneOfDeclarator({ node, data: { name: "2", title: "not a number" } });
            assert(isJsonError(res), "expected result to be an error");
            assert.deepEqual(res.name, "MissingOneOfPropertyError");
        });
    });
});
