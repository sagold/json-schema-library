/* eslint quote-props: 0 */
const expect = require("chai").expect;
const resolveOneOf = require("../../lib/resolveOneOf");
const step = require("../../lib/step");

describe("resolveOneOf", () => {

    it("should return schema with matching type", () => {
        const res = resolveOneOf({
            oneOf: [
                { type: "string" },
                { type: "number" },
                { type: "object" }
            ]
        }, 4, step);

        expect(res).to.deep.eq({ type: "number" });
    });

    it("should return schema with matching pattern", () => {
        const res = resolveOneOf({
            oneOf: [
                { type: "string", pattern: "obelix" },
                { type: "string", pattern: "asterix" }
            ]
        }, "anasterixcame", step);

        expect(res).to.deep.eq({ type: "string", pattern: "asterix" });
    });

    describe("object", () => {

        it("should return schema with matching properties", () => {
            const res = resolveOneOf({
                oneOf: [
                    { type: "object", properties: { title: { type: "string" } } },
                    { type: "object", properties: { description: { type: "string" } } },
                    { type: "object", properties: { content: { type: "string" } } }
                ]
            }, { description: "..." }, step);

            expect(res).to.deep.eq({ type: "object", properties: { description: { type: "string" } } });
        });

        it("should return schema with matching types", () => {
            const res = resolveOneOf({
                oneOf: [
                    { type: "object", properties: { title: { type: "number" } } },
                    { type: "object", properties: { title: { type: "string" } } }
                ]
            }, { title: "asterix" }, step);

            expect(res).to.deep.eq({ type: "object", properties: { title: { type: "string" } } });
        });

        describe("fuzzy match missing values", () => {

            it("should return schema with least missing properties", () => {
                const t = { type: "number" };
                const res = resolveOneOf({
                    oneOf: [
                        { type: "object", properties: { "a": t, "c": t, "d": t } },
                        { type: "object", properties: { "a": t, "b": t, "c": t } },
                        { type: "object", properties: { "a": t, "d": t, "e": t } }
                    ]
                }, { a: 0, b: 1 }, step);

                expect(res).to.deep.eq({ type: "object", properties: { "a": t, "b": t, "c": t } });
            });

            it("should only count properties that match the schema", () => {
                const t = { type: "number" };
                const res = resolveOneOf({
                    oneOf: [
                        { type: "object", properties: { "a": { type: "string" }, "b": t, "c": t } },
                        { type: "object", properties: { "a": { type: "boolean" }, "b": t, "d": t } },
                        { type: "object", properties: { "a": { type: "number" }, "b": t, "e": t } }
                    ]
                }, { a: true, b: 1 }, step);

                expect(res).to.deep.eq({ type: "object", properties: { "a": { type: "boolean" }, "b": t, "d": t } });
            });

            it("should find correct pay type", () => {
                const res = resolveOneOf({
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
                }, {
                    type: "teaser",
                    redirectUrl: "http://gfx.sueddeutsche.de/test/pay/article.html"
                }, step);

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
