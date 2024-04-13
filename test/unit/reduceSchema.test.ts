import { strict as assert } from "assert";
import { Draft07 as Draft } from "../../lib/draft07";
import { reduceSchema as _reduceSchema } from "../../lib/reduceSchema";
import { createNode, isSchemaNode } from "../../lib/schemaNode";
import { JsonSchema } from "../../lib/types";

function reduceSchema(draft: Draft, schema: JsonSchema, data: any, pointer = "#") {
    const node = createNode(draft, schema, pointer);
    const result = _reduceSchema(node, data);
    if (isSchemaNode(result)) {
        return result.schema;
    }
    return result;
}

describe("reduceSchema", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft()));

    describe("allOf", () => {
        it("should iteratively resolve allOf before merging (issue#44)", () => {
            const staticSchema = reduceSchema(
                draft,
                {
                    type: "object",
                    properties: {
                        trigger: { type: "boolean" }
                    },
                    allOf: [
                        {
                            if: {
                                not: {
                                    properties: {
                                        trigger: { type: "boolean", const: true }
                                    }
                                }
                            },
                            then: {
                                properties: {
                                    trigger: { type: "boolean", const: false }
                                }
                            }
                        },
                        {
                            if: {
                                not: {
                                    properties: {
                                        trigger: { type: "boolean", const: false }
                                    }
                                }
                            }
                        }
                    ]
                },
                { trigger: true },
                "#"
            );

            assert.deepEqual(staticSchema, {
                type: "object",
                properties: {
                    trigger: { type: "boolean" }
                }
            });
        });
    });

    describe("oneOf", () => {
        it("should return oneOf source schema for resolved oneOf object", () => {
            const staticSchema = reduceSchema(
                draft,
                {
                    type: "object",
                    oneOfProperty: "type",
                    oneOf: [
                        {
                            type: "object",
                            required: ["type", "title"],
                            properties: {
                                type: { type: "string", const: "paragraph" },
                                title: { type: "string", title: "paragprah title" }
                            }
                        },
                        {
                            type: "object",
                            required: ["type", "title"],
                            properties: {
                                type: { type: "string", const: "section" },
                                title: { type: "string", title: "section title" }
                            }
                        }
                    ]
                },
                { type: "section", title: "" },
                "#"
            );

            assert.equal(typeof staticSchema.getOneOfOrigin, "function");
            assert.equal(staticSchema.getOneOfOrigin().index, 1);
        });
    });
});
