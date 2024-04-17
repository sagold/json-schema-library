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
});
