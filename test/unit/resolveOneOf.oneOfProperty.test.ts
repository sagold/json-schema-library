/* eslint quote-props: 0 max-len: 0 */
import { expect } from "chai";
import { resolveOneOf } from "../../lib/features/oneOf";
import { Draft07 } from "../../lib/draft07";
import settings from "../../lib/config/settings";

const { DECLARATOR_ONEOF } = settings;

describe("oneOfProperty", () => {
    let draft: Draft07;
    beforeEach(() => (draft = new Draft07()));

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
