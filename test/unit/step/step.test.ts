import _step from "../../../lib/step";
import { createNode, isSchemaNode } from "../../../lib/schemaNode";
import { Draft } from "../../../lib/draft";
import { Draft04 as Core } from "../../../lib/draft04";
import { expect } from "chai";
import { JsonSchema } from "../../../lib/types";

function step(
    draft: Draft,
    key: string | number,
    schema: JsonSchema,
    data?: unknown,
    pointer = "#"
) {
    const res = _step(createNode(draft, schema, pointer), key, data);
    return isSchemaNode(res) ? res.schema : res;
}

describe("step", () => {
    let draft: Core;
    before(() => (draft = new Core()));

    it("should return an error for unknown types", () => {
        const res = step(draft, 0, { type: "unknown" }, {});
        expect(res).to.be.an("error");
    });

    describe("object", () => {
        it("should return object property", () => {
            const res = step(draft, "title", {
                type: "object",
                properties: {
                    title: { type: "string" }
                }
            });

            expect(res).to.deep.eq({ type: "string" });
        });

        it("should return error for unknown property", () => {
            const res = step(draft, "wrongkey", {
                type: "object",
                properties: {
                    title: { type: "string" }
                }
            });

            expect(res.type).to.deep.eq("error");
        });

        it("should return error for unknown property", () => {
            const res = step(draft, "thenValue", {
                type: "object",
                properties: { test: { type: "string" } },
                if: {
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
            });

            expect(res.type).to.deep.eq("error");
        });

        it("should create schema for `additionalProperties=true`", () => {
            const res = step(
                draft,
                "any",
                {
                    type: "object",
                    additionalProperties: true
                },
                { any: "i am valid" }
            );

            expect(res.type).to.deep.eq("string");
        });

        it("should treat `additionalProperties` as `true` per default", () => {
            const res = step(
                draft,
                "any",
                {
                    type: "object"
                },
                { any: "i am valid" }
            );

            expect(res.type).to.deep.eq("string");
        });

        it("should return an error if `additionalProperties=false` and property unknown", () => {
            const res = step(
                draft,
                "any",
                {
                    type: "object",
                    additionalProperties: false
                },
                { any: "i am valid" }
            );

            expect(res.type).to.deep.eq("error");
        });

        it("should return matching oneOf", () => {
            const res = step(
                draft,
                "title",
                {
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
                },
                { title: 4 }
            );

            expect(res).to.deep.eq({ type: "number" });
        });

        it("should return matching oneOf, for objects missing properties", () => {
            const res = step(
                draft,
                "title",
                {
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
                },
                { title: 4, test: 2 }
            );

            expect(res).to.deep.eq({ type: "number" });
        });

        it("should return matching anyOf", () => {
            const res = step(
                draft,
                "title",
                {
                    anyOf: [
                        {
                            type: "object",
                            additionalProperties: { type: "string" }
                        },
                        {
                            type: "object",
                            additionalProperties: { type: "number" }
                        }
                    ]
                },
                { title: 4, test: 2 }
            );

            expect(res).to.deep.eq({ type: "number" });
        });

        it("should return combined anyOf schema", () => {
            const res = step(
                draft,
                "title",
                {
                    anyOf: [
                        {
                            type: "object",
                            additionalProperties: { type: "string" }
                        },
                        {
                            type: "object",
                            additionalProperties: { type: "number" }
                        },
                        {
                            type: "object",
                            additionalProperties: { minimum: 2 }
                        }
                    ]
                },
                { title: 4, test: 2 }
            );

            expect(res).to.deep.eq({ type: "number", minimum: 2 });
        });

        it("should resolve references from anyOf schema", () => {
            draft.setSchema({
                definitions: {
                    string: {
                        type: "object",
                        additionalProperties: { type: "string" }
                    },
                    number: {
                        type: "object",
                        additionalProperties: { type: "number" }
                    },
                    min: {
                        type: "object",
                        additionalProperties: { minimum: 2 }
                    }
                },
                anyOf: [
                    { $ref: "#/definitions/string" },
                    { $ref: "#/definitions/number" },
                    { $ref: "#/definitions/min" }
                ]
            });

            const res = step(draft, "title", draft.rootSchema, {
                title: 4,
                test: 2
            });

            expect(res).to.deep.eq({ type: "number", minimum: 2 });
        });

        it("should return matching allOf schema", () => {
            const res = step(
                draft,
                "title",
                {
                    allOf: [{ type: "object" }, { additionalProperties: { type: "number" } }]
                },
                { title: 4, test: 2 }
            );

            expect(res).to.deep.eq({ type: "number" });
        });

        it("should resolve references in allOf schema", () => {
            draft.setSchema({
                definitions: {
                    object: { type: "object" },
                    additionalNumber: {
                        additionalProperties: { type: "number" }
                    }
                },
                allOf: [
                    { $ref: "#/definitions/object" },
                    { $ref: "#/definitions/additionalNumber" }
                ]
            });

            const res = step(draft, "title", draft.rootSchema, {
                title: 4,
                test: 2
            });

            expect(res).to.deep.eq({ type: "number" });
        });

        it("should return matching patternProperty", () => {
            const res = step(draft, "second", {
                type: "object",
                patternProperties: {
                    "^first$": { type: "number", id: "first" },
                    "^second$": { type: "string", id: "second" }
                }
            });

            expect(res).to.deep.eq({ type: "string", id: "second" });
        });

        it("should return additionalProperties schema for not matching patternProperty", () => {
            const res = step(draft, "third", {
                type: "object",
                patternProperties: {
                    "^first$": { type: "number", id: "first" },
                    "^second$": { type: "string", id: "second" }
                },
                additionalProperties: { type: "object" }
            });

            expect(res).to.deep.eq({ type: "object" });
        });
    });

    describe("array", () => {
        it("should return an error for invalid array schema", () => {
            const res = step(draft, 0, { type: "array" }, []);
            expect(res).to.be.an("error");
        });

        it("should return item property", () => {
            const res = step(draft, 0, {
                type: "array",
                items: {
                    type: "string"
                }
            });

            expect(res).to.deep.eq({ type: "string" });
        });

        it("should return item at index", () => {
            const res = step(
                draft,
                1,
                {
                    type: "array",
                    items: [{ type: "string" }, { type: "number" }, { type: "boolean" }]
                },
                ["3", 2]
            );

            expect(res).to.deep.eq({ type: "number" });
        });

        it("should return matching item in oneOf", () => {
            const res = step(
                draft,
                0,
                {
                    type: "array",
                    items: {
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
                    }
                },
                [{ title: 2 }]
            );

            expect(res).to.deep.eq({
                __oneOfIndex: 1,
                type: "object",
                properties: { title: { type: "number" } }
            });
        });

        it("should return matching anyOf", () => {
            const res = step(
                draft,
                1,
                {
                    items: {
                        anyOf: [
                            {
                                type: "object",
                                properties: { title: { type: "string" } }
                            },
                            {
                                type: "object",
                                properties: { title: { type: "number" } }
                            }
                        ]
                    }
                },
                [{ title: "two" }, { title: 4 }]
            );

            expect(res).to.deep.eq({
                type: "object",
                properties: { title: { type: "number" } }
            });
        });

        it("should return combined anyOf schema", () => {
            const res = step(
                draft,
                1,
                {
                    items: {
                        anyOf: [
                            {
                                type: "object",
                                properties: { title: { type: "string" } }
                            },
                            {
                                type: "object",
                                properties: { title: { type: "number" } }
                            },
                            {
                                type: "object",
                                properties: { title: { minimum: 2 } }
                            }
                        ]
                    }
                },
                [{ title: "two" }, { title: 4 }]
            );

            expect(res).to.deep.eq({
                type: "object",
                properties: { title: { type: "number", minimum: 2 } }
            });
        });

        it("should return combined allOf schema", () => {
            const res = step(
                draft,
                1,
                {
                    items: {
                        allOf: [
                            {
                                type: "object",
                                properties: { title: { type: "number" } }
                            },
                            {
                                type: "object",
                                properties: { title: { minimum: 3 } }
                            }
                        ]
                    }
                },
                [{ title: "two" }, { title: 4 }]
            );

            expect(res).to.deep.eq({
                type: "object",
                properties: { title: { type: "number", minimum: 3 } }
            });
        });

        it("should return a generated schema with additionalItems", () => {
            const res = step(
                draft,
                1,
                {
                    type: "array",
                    additionalItems: true
                },
                ["3", 2]
            );

            expect(res.type).to.eq("number");
        });
    });
});
