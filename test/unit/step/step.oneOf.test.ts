
import { expect } from "chai";
import _step from "../../../lib/step";
import { Draft04 } from "../../../lib/draft04";
import { Draft } from "../../../lib/draft";
import { JsonSchema } from "../../../lib/types";
import { createNode, isSchemaNode } from "../../../lib/schemaNode";

function step(draft: Draft, key: string | number, schema: JsonSchema, data?: unknown, pointer = '#') {
    const res = _step(createNode(draft, schema, pointer), key, data);
    return isSchemaNode(res) ? res.schema : res;
}

describe("step.oneof", () => {
    let draft: Draft04;
    before(() => (draft = new Draft04()));

    it("should return matching schema", () => {
        const res = step(
            draft,
            "title",
            {
                type: "object",
                properties: {
                    title: {
                        oneOf: [
                            { type: "string", title: "Zeichenkette" },
                            { type: "number", title: "Zahl" }
                        ]
                    }
                }
            },
            { title: 111 }
        );

        // @special case: where a schema is selected and the original schema maintained.
        // Remove the original and its flag
        delete res.oneOfSchema;
        delete res.variableSchema;
        delete res.oneOfIndex;
        expect(res).to.deep.eq({ type: "number", title: "Zahl" });
    });

    // PR #35 https://github.com/sagold/json-schema-library/pull/35/commits/8b6477113bdfce522081473bb0dd8fd6fe680391
    it("should maintain references from a remote schema when resolving oneOf with $ref", () => {
        draft.addRemoteSchema("https://my-other-schema.com/schema.json", {
            type: "object",
            properties: {
                innerTitle: { $ref: "#/definitions/number" }
            },
            definitions: {
                number: { type: "number", title: "Zahl" }
            }
        });
        const schema = draft.compileSchema({
            type: "object",
            properties: {
                title: {
                    oneOf: [
                        {
                            type: "object",
                            properties: { innerTitle: { type: "string", title: "Zeichenkette" } }
                        },
                        { $ref: "https://my-other-schema.com/schema.json" }
                    ]
                }
            }
        });
        const res = step(draft, "title", schema, { title: { innerTitle: 111 } });

        expect(res.type).to.eq("object");

        const nextRes = step(draft, "innerTitle", res, { innerTitle: 111 });
        expect(nextRes.type).to.eq("number");
    });

    it("should maintain references from a remote schema when resolving oneOf with $ref", () => {
        draft.addRemoteSchema("https://my-other-schema.com/schema.json", {
            type: "object",
            properties: {
                innerTitle: { $ref: "#/definitions/number" }
            },
            definitions: {
                number: { type: "number", title: "Zahl" }
            }
        });
        const schema = draft.compileSchema({
            type: "object",
            properties: {
                title: {
                    oneOf: [
                        {
                            type: "object",
                            properties: { innerTitle: { type: "string", title: "Zeichenkette" } }
                        },
                        { $ref: "https://my-other-schema.com/schema.json" }
                    ]
                }
            }
        });
        const res = step(draft, "title", schema, { title: { innerTitle: 111 } });

        expect(res.type).to.eq("object");

        const nextRes = step(draft, "innerTitle", res, { innerTitle: 111 });
        expect(nextRes.type).to.eq("number");
    });
});
