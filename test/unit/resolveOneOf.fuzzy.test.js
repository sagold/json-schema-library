/* eslint quote-props: 0 max-len: 0 */
const expect = require("chai").expect;
const resolveOneOf = require("../../lib/resolveOneOf.fuzzy");
const Core = require("../../lib/cores/JsonEditor");

describe("resolveOneOf (fuzzy)", () => {

    let core;
    beforeEach(() => (core = new Core()));

    it("should return schema with matching type", () => {
        core.rootSchema = {
            oneOf: [
                { type: "string" },
                { type: "number" },
                { type: "object" }
            ]
        };
        const res = resolveOneOf(core, core.rootSchema, 4);

        expect(res).to.deep.eq({ type: "number" });
    });

    it("should return schema with matching pattern", () => {
        core.rootSchema = {
            oneOf: [
                { type: "string", pattern: "obelix" },
                { type: "string", pattern: "asterix" }
            ]
        };
        const res = resolveOneOf(core, core.rootSchema, "anasterixcame");

        expect(res).to.deep.eq({ type: "string", pattern: "asterix" });
    });

    describe("object", () => {

        it("should return schema with matching properties", () => {
            core.rootSchema = {
                oneOf: [
                    { type: "object", properties: { title: { type: "string" } } },
                    { type: "object", properties: { description: { type: "string" } } },
                    { type: "object", properties: { content: { type: "string" } } }
                ]
            };
            const res = resolveOneOf(core, core.rootSchema, { description: "..." });

            expect(res).to.deep.eq({ type: "object", properties: { description: { type: "string" } } });
        });

        it("should return schema matching nested properties", () => {
            core.rootSchema = {
                oneOf: [
                    { type: "object", properties: { title: { type: "number" } } },
                    { type: "object", properties: { title: { type: "string" } } }
                ]
            };
            const res = resolveOneOf(core, core.rootSchema, { title: "asterix" });

            expect(res).to.deep.eq({ type: "object", properties: { title: { type: "string" } } });
        });


        describe("oneOfProperty", () => {

            it("should return schema matching oneOfProperty", () => {
                core.rootSchema = {
                    oneOfProperty: "id",
                    oneOf: [
                        { type: "object", properties: { id: { type: "string", pattern: "^1$" }, title: { type: "number" } } },
                        { type: "object", properties: { id: { type: "string", pattern: "^2$" }, title: { type: "number" } } },
                        { type: "object", properties: { id: { type: "string", pattern: "^3$" }, title: { type: "number" } } }
                    ]
                };
                const res = resolveOneOf(core, core.rootSchema, { id: "2", title: 123 });

                expect(res).to.deep.eq(
                    { type: "object", properties: { id: { type: "string", pattern: "^2$" }, title: { type: "number" } } }
                );
            });

            it("should return schema matching oneOfProperty even it is invalid", () => {
                core.rootSchema = {
                    oneOfProperty: "id",
                    oneOf: [
                        { type: "object", properties: { id: { type: "string", pattern: "^1$" }, title: { type: "number" } } },
                        { type: "object", properties: { id: { type: "string", pattern: "^2$" }, title: { type: "number" } } },
                        { type: "object", properties: { id: { type: "string", pattern: "^3$" }, title: { type: "number" } } }
                    ]
                };
                const res = resolveOneOf(core, core.rootSchema, { id: "2", title: "not a number" });

                expect(res).to.deep.eq(
                    { type: "object", properties: { id: { type: "string", pattern: "^2$" }, title: { type: "number" } } }
                );
            });

            it("should return an error if value at oneOfProperty is undefined", () => {
                core.rootSchema = {
                    oneOfProperty: "id",
                    oneOf: [
                        { type: "object", properties: { id: { type: "string", pattern: "^1$" }, title: { type: "number" } } },
                        { type: "object", properties: { id: { type: "string", pattern: "^2$" }, title: { type: "number" } } },
                        { type: "object", properties: { id: { type: "string", pattern: "^3$" }, title: { type: "number" } } }
                    ]
                };
                const res = resolveOneOf(core, core.rootSchema, { title: "not a number" });

                expect(res.type).to.eq("error");
                expect(res.name).to.eq("MissingOneOfPropertyError");
            });

            it("should return an error if no oneOfProperty could be matched", () => {
                core.rootSchema = {
                    oneOfProperty: "id",
                    oneOf: [
                        { type: "object", properties: { id: { type: "string", pattern: "^1$" }, title: { type: "number" } } },
                        { type: "object", properties: { id: { type: "string", pattern: "^3$" }, title: { type: "number" } } }
                    ]
                };
                const res = resolveOneOf(core, core.rootSchema, { id: "2", title: "not a number" });

                expect(res.type).to.eq("error");
                expect(res.name).to.eq("OneOfPropertyError");
            });
        });


        describe("fuzzy match missing values", () => {

            it("should return schema with least missing properties", () => {
                const t = { type: "number" };
                core.rootSchema = {
                    oneOf: [
                        { type: "object", properties: { "a": t, "c": t, "d": t } },
                        { type: "object", properties: { "a": t, "b": t, "c": t } },
                        { type: "object", properties: { "a": t, "d": t, "e": t } }
                    ]
                };
                const res = resolveOneOf(core, core.rootSchema, { a: 0, b: 1 });

                expect(res).to.deep.eq({ type: "object", properties: { "a": t, "b": t, "c": t } });
            });

            it("should only count properties that match the schema", () => {
                const t = { type: "number" };
                core.rootSchema = {
                    oneOf: [
                        { type: "object", properties: { "a": { type: "string" }, "b": t, "c": t } },
                        { type: "object", properties: { "a": { type: "boolean" }, "b": t, "d": t } },
                        { type: "object", properties: { "a": { type: "number" }, "b": t, "e": t } }
                    ]
                };
                const res = resolveOneOf(core, core.rootSchema, { a: true, b: 1 });

                expect(res).to.deep.eq({ type: "object", properties: { "a": { type: "boolean" }, "b": t, "d": t } });
            });

            it("should find correct pay type", () => {
                core.rootSchema = {
                    type: "object",
                    oneOf: [
                        { type: "object", properties: {
                            type: {
                                type: "string",
                                default: "free",
                                pattern: "^free"
                            }
                        } },
                        { type: "object", properties: {
                            redirectUrl: {
                                format: "url",
                                type: "string"
                            },
                            type: {
                                type: "string",
                                default: "teaser",
                                pattern: "^teaser"
                            }
                        } },
                        { type: "object", properties: {
                            redirectUrl: {
                                format: "url",
                                type: "string"
                            },
                            type: {
                                type: "string",
                                default: "article",
                                pattern: "^article"
                            }
                        } }
                    ]
                };
                const res = resolveOneOf(core, core.rootSchema, {
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
        // @TODO: ADD TESTS
    });
});
