import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { isSchemaNode } from "../../types";
describe("issue#35 - reducing ref loses correct remote context", () => {
    // PR #35 https://github.com/sagold/json-schema-library/pull/35/commits/8b6477113bdfce522081473bb0dd8fd6fe680391
    it("should maintain references from a remote schema when resolving oneOf with $ref", () => {
        const node = compileSchema({
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
        }).addRemote("https://my-other-schema.com/schema.json", {
            type: "object",
            properties: {
                innerTitle: { $ref: "#/definitions/number" }
            },
            definitions: {
                number: { type: "number", title: "Zahl" }
            }
        });
        const titleNode = node.get("title", { title: { innerTitle: 111 } });
        assert(isSchemaNode(titleNode));
        const innerTitleNode = titleNode.get("innerTitle", { innerTitle: 111 });
        assert(isSchemaNode(innerTitleNode));
        assert.deepEqual(innerTitleNode.resolveRef().schema, { type: "number", title: "Zahl" });
    });
});
