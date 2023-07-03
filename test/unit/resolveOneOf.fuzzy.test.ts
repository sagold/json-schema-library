/* eslint quote-props: 0 max-len: 0 */
import { expect } from "chai";
import { resolveOneOfFuzzy as resolveOneOf } from "../../lib/features/oneOf";
import { JsonEditor as Core } from "../../lib/jsoneditor";
import settings from "../../lib/config/settings";

const { DECLARATOR_ONEOF } = settings;

describe("resolveOneOf (fuzzy)", () => {
    let draft: Core;
    beforeEach(() => (draft = new Core()));

    it("should return schema with matching type", () => {
        const res = resolveOneOf(draft, 4, {
            oneOf: [{ type: "string" }, { type: "number" }, { type: "object" }]
        });

        expect(res).to.deep.eq({ type: "number" });
    });

    it("should return schema with matching pattern", () => {
        const res = resolveOneOf(draft, "anasterixcame", {
            oneOf: [
                { type: "string", pattern: "obelix" },
                { type: "string", pattern: "asterix" }
            ]
        });

        expect(res).to.deep.eq({ type: "string", pattern: "asterix" });
    });

    it("should resolve $ref before schema", () => {
        draft.setSchema({
            definitions: {
                a: { type: "string", pattern: "obelix" },
                b: { type: "string", pattern: "asterix" }
            },
            oneOf: [{ $ref: "#/definitions/a" }, { $ref: "#/definitions/b" }]
        });
        const res = resolveOneOf(draft, "anasterixcame");

        expect(res).to.deep.eq({ type: "string", pattern: "asterix" });
    });

    describe("object", () => {
        it("should return schema with matching properties", () => {
            const res = resolveOneOf(
                draft,
                { description: "..." },
                {
                    oneOf: [
                        { type: "object", properties: { title: { type: "string" } } },
                        { type: "object", properties: { description: { type: "string" } } },
                        { type: "object", properties: { content: { type: "string" } } }
                    ]
                }
            );

            expect(res).to.deep.eq({
                type: "object",
                properties: { description: { type: "string" } }
            });
        });

        it("should return schema matching nested properties", () => {
            const res = resolveOneOf(
                draft,
                { title: "asterix" },
                {
                    oneOf: [
                        { type: "object", properties: { title: { type: "number" } } },
                        { type: "object", properties: { title: { type: "string" } } }
                    ]
                }
            );

            expect(res).to.deep.eq({ type: "object", properties: { title: { type: "string" } } });
        });

        describe("oneOfProperty", () => {
            it("should return schema matching oneOfProperty", () => {
                const res = resolveOneOf(
                    draft,
                    { name: "2", title: 123 },
                    {
                        [DECLARATOR_ONEOF]: "name",
                        oneOf: [
                            {
                                type: "object",
                                properties: {
                                    name: { type: "string", pattern: "^1$" },
                                    title: { type: "number" }
                                }
                            },
                            {
                                type: "object",
                                properties: {
                                    name: { type: "string", pattern: "^2$" },
                                    title: { type: "number" }
                                }
                            },
                            {
                                type: "object",
                                properties: {
                                    name: { type: "string", pattern: "^3$" },
                                    title: { type: "number" }
                                }
                            }
                        ]
                    }
                );

                expect(res).to.deep.eq({
                    type: "object",
                    properties: {
                        name: { type: "string", pattern: "^2$" },
                        title: { type: "number" }
                    }
                });
            });

            it("should return schema matching oneOfProperty even it is invalid", () => {
                const res = resolveOneOf(
                    draft,
                    { name: "2", title: "not a number" },
                    {
                        [DECLARATOR_ONEOF]: "name",
                        oneOf: [
                            {
                                type: "object",
                                properties: {
                                    name: { type: "string", pattern: "^1$" },
                                    title: { type: "number" }
                                }
                            },
                            {
                                type: "object",
                                properties: {
                                    name: { type: "string", pattern: "^2$" },
                                    title: { type: "number" }
                                }
                            },
                            {
                                type: "object",
                                properties: {
                                    name: { type: "string", pattern: "^3$" },
                                    title: { type: "number" }
                                }
                            }
                        ]
                    }
                );

                expect(res).to.deep.eq({
                    type: "object",
                    properties: {
                        name: { type: "string", pattern: "^2$" },
                        title: { type: "number" }
                    }
                });
            });

            it("should return an error if value at oneOfProperty is undefined", () => {
                const res = resolveOneOf(
                    draft,
                    { title: "not a number" },
                    {
                        [DECLARATOR_ONEOF]: "name",
                        oneOf: [
                            {
                                type: "object",
                                properties: {
                                    name: { type: "string", pattern: "^1$" },
                                    title: { type: "number" }
                                }
                            },
                            {
                                type: "object",
                                properties: {
                                    name: { type: "string", pattern: "^2$" },
                                    title: { type: "number" }
                                }
                            },
                            {
                                type: "object",
                                properties: {
                                    name: { type: "string", pattern: "^3$" },
                                    title: { type: "number" }
                                }
                            }
                        ]
                    }
                );

                expect(res.type).to.eq("error");
                expect(res.name).to.eq("MissingOneOfPropertyError");
            });

            it("should return an error if no oneOfProperty could be matched", () => {
                const res = resolveOneOf(
                    draft,
                    { name: "2", title: "not a number" },
                    {
                        [DECLARATOR_ONEOF]: "name",
                        oneOf: [
                            {
                                type: "object",
                                properties: {
                                    name: { type: "string", pattern: "^1$" },
                                    title: { type: "number" }
                                }
                            },
                            {
                                type: "object",
                                properties: {
                                    name: { type: "string", pattern: "^3$" },
                                    title: { type: "number" }
                                }
                            }
                        ]
                    }
                );

                expect(res.type).to.eq("error");
                expect(res.name).to.eq("OneOfPropertyError");
            });
        });

        describe("fuzzy match missing values", () => {
            it("should return schema with least missing properties", () => {
                const t = { type: "number" };
                const res = resolveOneOf(
                    draft,
                    { a: 0, b: 1 },
                    {
                        oneOf: [
                            { type: "object", properties: { a: t, c: t, d: t } },
                            { type: "object", properties: { a: t, b: t, c: t } },
                            { type: "object", properties: { a: t, d: t, e: t } }
                        ]
                    }
                );

                expect(res).to.deep.eq({ type: "object", properties: { a: t, b: t, c: t } });
            });

            it("should only count properties that match the schema", () => {
                const t = { type: "number" };
                const res = resolveOneOf(
                    draft,
                    { a: true, b: 1 },
                    {
                        oneOf: [
                            { type: "object", properties: { a: { type: "string" }, b: t, c: t } },
                            { type: "object", properties: { a: { type: "boolean" }, b: t, d: t } },
                            { type: "object", properties: { a: { type: "number" }, b: t, e: t } }
                        ]
                    }
                );

                expect(res).to.deep.eq({
                    type: "object",
                    properties: { a: { type: "boolean" }, b: t, d: t }
                });
            });

            it("should find correct pay type", () => {
                draft.setSchema({
                    type: "object",
                    oneOf: [
                        {
                            type: "object",
                            properties: {
                                type: {
                                    type: "string",
                                    default: "free",
                                    pattern: "^free"
                                }
                            }
                        },
                        {
                            type: "object",
                            properties: {
                                redirectUrl: {
                                    format: "url",
                                    type: "string"
                                },
                                type: {
                                    type: "string",
                                    default: "teaser",
                                    pattern: "^teaser"
                                }
                            }
                        },
                        {
                            type: "object",
                            properties: {
                                redirectUrl: {
                                    format: "url",
                                    type: "string"
                                },
                                type: {
                                    type: "string",
                                    default: "article",
                                    pattern: "^article"
                                }
                            }
                        }
                    ]
                });
                const res = resolveOneOf(draft, {
                    type: "teaser",
                    redirectUrl: "http://gfx.sueddeutsche.de/test/pay/article.html"
                });

                expect(res).to.deep.eq({
                    type: "object",
                    properties: {
                        redirectUrl: {
                            format: "url",
                            type: "string"
                        },
                        type: {
                            type: "string",
                            default: "teaser",
                            pattern: "^teaser"
                        }
                    }
                });
            });
        });
    });

    describe("array", () => {
        // @TODO: ADD FURHTER TESTS

        it("should return oneOfError for invalid data", () => {
            // bug found
            const res = resolveOneOf(
                draft,
                { content: "content" },
                {
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
                }
            );

            expect(res.type).to.eq("error");
            expect(res.name).to.eq("OneOfError");
        });
    });
});
