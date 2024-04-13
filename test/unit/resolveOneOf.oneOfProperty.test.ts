/* eslint quote-props: 0 max-len: 0 */
import settings from "../../lib/config/settings";
import { createNode } from "../../lib/schemaNode";
import { Draft } from "../../lib/draft";
import { Draft07 } from "../../lib/draft07";
import { expect } from "chai";
import { JsonError, JsonSchema, isJsonError } from "../../lib/types";
import { resolveOneOf as _resolveOneOf } from "../../lib/features/oneOf";

const { DECLARATOR_ONEOF } = settings;

function resolveOneOf(draft: Draft, data: any, schema: JsonSchema = draft.rootSchema, pointer = "#"): JsonSchema | JsonError {
    const node = createNode(draft, schema, pointer);
    const result = _resolveOneOf(node, data);
    if (result && !isJsonError(result)) {
        return result.schema;
    }
    return result;
}

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
