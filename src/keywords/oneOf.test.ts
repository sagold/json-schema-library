import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";
import { isJsonError } from "../types";
import { reduceOneOfDeclarator, reduceOneOfFuzzy } from "./oneOf";
import settings from "../settings";
import { draftEditor } from "../draftEditor";
const DECLARATOR_ONEOF = settings.DECLARATOR_ONEOF;

describe("keyword : oneof : validate", () => {
    it("should validate matching oneOf", () => {
        const { errors } = compileSchema({
            oneOf: [
                { type: "object", properties: { value: { type: "string" } } },
                { type: "object", properties: { value: { type: "integer" } } }
            ]
        }).validate({ value: "a string" });
        assert.equal(errors.length, 0);
    });

    it("should return error for non-matching oneOf", () => {
        const { errors } = compileSchema({
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

describe("keyword : oneOf : reduce", () => {
    it("should resolve matching value schema", () => {
        const { node } = compileSchema({
            oneOf: [
                { type: "string", title: "A String" },
                { type: "number", title: "A Number" }
            ]
        }).reduceNode(111);

        assert.deepEqual(node?.schema, { type: "number", title: "A Number" });
        assert.equal(node.oneOfIndex, 1, "should have exposed correct resolved oneOfIndex");
    });

    it("should return error if no matching schema could be found", () => {
        const { node, error } = compileSchema({
            oneOf: [
                { type: "string", title: "A String" },
                { type: "number", title: "A Number" }
            ]
        }).reduceNode(true);

        assert(isJsonError(error));
        assert.equal(node, undefined);
    });

    it("should return error if multiple schema match", () => {
        const { node, error } = compileSchema({
            oneOf: [
                { type: "string", minLength: 1 },
                { type: "string", maxLength: 3 }
            ]
        }).reduceNode("12");

        assert(isJsonError(error));
        assert.equal(node, undefined);
    });

    it("should reduce nested oneOf objects using ref", () => {
        const { node } = compileSchema({
            $defs: { withData: { oneOf: [{ required: ["b"], properties: { b: { type: "number" } } }] } },
            oneOf: [{ required: ["a"], properties: { a: { type: "string" } } }, { $ref: "#/$defs/withData" }]
        }).reduceNode({ b: 111 });

        assert.deepEqual(node?.schema, { required: ["b"], properties: { b: { type: "number" } } });
        // @note that we override nested oneOfIndex
        assert.equal(node.oneOfIndex, 1, "should have exposed correct resolved oneOfIndex");
    });

    it("should reduce nested oneOf boolean schema using ref", () => {
        const { node } = compileSchema({
            $defs: { withData: { oneOf: [{ required: ["b"], properties: { b: true } }] } },
            oneOf: [{ required: ["a"], properties: { a: false } }, { $ref: "#/$defs/withData" }]
        }).reduceNode({ b: 111 });

        assert.deepEqual(node?.schema, { required: ["b"], properties: { b: true } });
        assert.equal(node.oneOfIndex, 1, "should have exposed correct resolved oneOfIndex");
    });

    it("should resolve matching object schema", () => {
        const { node } = compileSchema({
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
        }).reduceNode({ title: 4 });

        assert.deepEqual(node?.schema, { type: "object", properties: { title: { type: "number" } } });
        assert.equal(node.oneOfIndex, 1, "should have exposed correct resolved oneOfIndex");
    });

    it("should return matching oneOf, for objects missing properties", () => {
        const { node } = compileSchema({
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
        }).reduceNode({ title: 4, test: 2 });

        assert.deepEqual(node?.schema, { type: "object", additionalProperties: { type: "number" } });
        assert.equal(node.oneOfIndex, 1, "should have exposed correct resolved oneOfIndex");
    });
});

describe("keyword : oneof-fuzzy : reduce", () => {
    it("should return schema with matching type", () => {
        const node = compileSchema({
            oneOf: [{ type: "string" }, { type: "number" }, { type: "object" }]
        });
        const res = reduceOneOfFuzzy({ node, data: 4, pointer: "#", path: [] });
        assert.deepEqual(res?.schema, { type: "number" });
        assert.equal(res.oneOfIndex, 1, "should have exposed correct resolved oneOfIndex");
    });

    it("should return schema with matching pattern", () => {
        const node = compileSchema({
            oneOf: [
                { type: "string", pattern: "obelix" },
                { type: "string", pattern: "asterix" }
            ]
        });
        const res = reduceOneOfFuzzy({ node, data: "anasterixcame", pointer: "#", path: [] });
        assert.deepEqual(res?.schema, { type: "string", pattern: "asterix" });
        assert.equal(res.oneOfIndex, 1, "should have exposed correct resolved oneOfIndex");
    });

    it("should resolve $ref before schema", () => {
        const node = compileSchema({
            definitions: {
                a: { type: "string", pattern: "obelix" },
                b: { type: "string", pattern: "asterix" }
            },
            oneOf: [{ $ref: "#/definitions/a" }, { $ref: "#/definitions/b" }]
        });
        const res = reduceOneOfFuzzy({ node, data: "anasterixcame", pointer: "#", path: [] });
        assert.deepEqual(res?.schema, { type: "string", pattern: "asterix" });
        assert.equal(res.oneOfIndex, 1, "should have exposed correct resolved oneOfIndex");
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
            const res = reduceOneOfFuzzy({ node, data: { description: "..." }, pointer: "#", path: [] });
            assert.deepEqual(res?.schema, {
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
            const res = reduceOneOfFuzzy({ node, data: { title: "asterix" }, pointer: "#", path: [] });
            assert.deepEqual(res?.schema, {
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
            const res = reduceOneOfFuzzy({ node, data: { a: 0, b: 1 }, pointer: "#", path: [] });
            assert.deepEqual(res?.schema, {
                type: "object",
                properties: { a: t, b: t, c: t }
            });
            assert.equal(res.oneOfIndex, 1, "should have exposed correct resolved oneOfIndex");
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
            const res = reduceOneOfFuzzy({ node, data: { a: true, b: 1 }, pointer: "#", path: [] });
            assert.deepEqual(res?.schema, {
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
                pointer: "#",
                path: [],
                node,
                data: { type: "teaser", redirectUrl: "http://example.com/test/pay/article.html" }
            });
            assert.deepEqual(res?.schema, {
                type: "object",
                properties: {
                    redirectUrl: { format: "url", type: "string" },
                    type: { type: "string", default: "teaser", pattern: "^teaser" }
                }
            });
        });
    });
});

describe("keyword : oneof-property : reduce", () => {
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
            const res = reduceOneOfDeclarator({ node, data: { name: "2", title: 123 }, pointer: "#", path: [] });
            assert.deepEqual(res?.schema, {
                type: "object",
                properties: {
                    name: { type: "string", pattern: "^2$" },
                    title: { type: "number" }
                }
            });
            assert.equal(res.oneOfIndex, 1, "should have exposed correct resolved oneOfIndex");
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
            const res = reduceOneOfDeclarator({
                node,
                data: { name: "2", title: "not a number" },
                pointer: "#",
                path: []
            });
            assert.deepEqual(res?.schema, {
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
            const res = reduceOneOfDeclarator({ node, data: { title: "not a number" }, pointer: "#", path: [] });
            assert(isJsonError(res), "expected result to be an error");
            assert.deepEqual(res.code, "missing-one-of-property-error");
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
            const res = reduceOneOfDeclarator({
                node,
                data: { name: "2", title: "not a number" },
                pointer: "#",
                path: []
            });
            assert(isJsonError(res), "expected result to be an error");
            assert.deepEqual(res.code, "missing-one-of-property-error");
        });
    });
});

describe("keyword : oneof-fuzzy : validate", () => {
    it("should return one-of-error oneOfProperty does not match", () => {
        const node = compileSchema(
            {
                type: "array",
                items: {
                    oneOfProperty: "id",
                    oneOf: [
                        {
                            type: "object",
                            required: ["id"],
                            properties: { id: { const: "one" } }
                        },
                        {
                            type: "object",
                            required: ["id"],
                            properties: { id: { const: "two" } }
                        }
                    ]
                }
            },
            { drafts: [draftEditor] }
        );

        const { errors } = node.validate([{ id: "unknown" }]);

        assert.equal(errors.length, 1);
        assert.deepEqual(errors[0].code, "one-of-error");
    });

    it("should return validation errors of object identified by oneOfProperty", () => {
        const node = compileSchema(
            {
                type: "array",
                items: {
                    oneOfProperty: "id",
                    oneOf: [
                        {
                            type: "object",
                            required: ["id"],
                            properties: {
                                id: { const: "one" },
                                title: { type: "string" }
                            }
                        }
                    ]
                }
            },
            { drafts: [draftEditor] }
        );

        const { errors } = node.validate([{ id: "one", title: 123 }]);

        assert.equal(errors.length, 1);
        assert.deepEqual(errors[0].code, "type-error");
    });

    // issue json-editor
    it("should return unique-items error for failed oneOf item", () => {
        const node = compileSchema(
            {
                type: "object",
                required: ["main"],
                properties: {
                    main: {
                        type: "array",
                        items: {
                            oneOfProperty: "type",
                            oneOf: [{ $ref: "#/$defs/parent" }]
                        }
                    }
                },
                $defs: {
                    parent: {
                        type: "object",
                        title: "Parent",
                        description:
                            "Adding a duplicate item to this list fails as uniqueItems=true in children. @todo correct error message",
                        required: ["type", "children"],
                        properties: {
                            type: {
                                options: { hidden: true },
                                type: "string",
                                const: "parent"
                            },
                            children: {
                                type: "array",
                                title: "Children",
                                uniqueItems: true,
                                items: {
                                    oneOfProperty: "type",
                                    oneOf: [
                                        {
                                            type: "object",
                                            title: "Child: First",
                                            required: ["type"],
                                            properties: {
                                                type: {
                                                    options: { hidden: true },
                                                    type: "string",
                                                    const: "one"
                                                }
                                            }
                                        },
                                        {
                                            type: "object",
                                            title: "Child: Second",
                                            required: ["type"],
                                            properties: {
                                                type: {
                                                    options: { hidden: true },
                                                    type: "string",
                                                    const: "two"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            { drafts: [draftEditor] }
        );
        const { errors } = node.validate({
            main: [{ type: "parent", children: [{ type: "one" }, { type: "one" }] }]
        });
        assert.equal(errors.length, 1);
        assert.deepEqual(errors[0].data.pointer, "#/main/0/children/1");
        assert.deepEqual(errors[0].code, "unique-items-error");
    });
});
