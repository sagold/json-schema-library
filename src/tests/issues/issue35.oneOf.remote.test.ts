import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema.js";

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
        }).addRemoteSchema("https://my-other-schema.com/schema.json", {
            type: "object",
            properties: {
                innerTitle: { $ref: "#/definitions/number" }
            },
            definitions: {
                number: { type: "number", title: "Zahl" }
            }
        });

        const { node: titleNode } = node.getNodeChild("title", { title: { innerTitle: 111 } });
        const { node: innerTitleNode } = titleNode.getNodeChild("innerTitle", { innerTitle: 111 });

        assert.deepEqual(innerTitleNode.resolveRef().schema, { type: "number", title: "Zahl" });
    });
});
