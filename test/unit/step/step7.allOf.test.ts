import { expect } from "chai";
import _step from "../../../lib/step";
import { Draft07 } from "../../../lib/draft07";
import { Draft } from "../../../lib/draft";
import { JsonSchema, createNode, isSchemaNode } from "../../../lib/types";

function step(draft: Draft, key: string | number, schema: JsonSchema, data?: unknown, pointer = '#') {
    const res = _step(createNode(draft, schema, pointer), key, data);
    return isSchemaNode(res) ? res.schema : res;
}

describe.skip("step[v7].allOf", () => {
    let draft: Draft07;
    before(() => (draft = new Draft07()));

    it("should return combined schema", () => {
        const allOf = [
            {
                properties: {
                    secondary: { id: "secondary", type: "string" }
                }
            },
            {
                properties: {
                    tertiary: { id: "tertiary", type: "number" }
                }
            }
        ];

        const res = step(
            draft,
            "dynamicSchema",
            {
                type: "object",
                properties: {
                    dynamicSchema: {
                        type: "object",
                        properties: {
                            trigger: {
                                type: "boolean"
                            }
                        },
                        allOf
                    }
                }
            },
            { dynamicSchema: { trigger: true } }
        );

        // @special case: where a schema is selected and the original schema maintained.
        // Remove the original and its flag
        // delete res.oneOfSchema;
        delete res.variableSchema;
        // delete res.oneOfIndex;
        expect(res).to.deep.eq({
            type: "object",
            allOf,
            properties: {
                trigger: { type: "boolean" },
                secondary: { type: "string", id: "secondary" },
                tertiary: { type: "number", id: "tertiary" }
            }
        });
    });
});
