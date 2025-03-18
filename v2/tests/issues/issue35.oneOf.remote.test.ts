import { strict as assert } from "assert";
// import { resolveOneOfFuzzy } from "../../../lib/features/oneOf";
import { compileSchema } from "../../compileSchema";
import { isSchemaNode } from "../../types";

describe("issue#35 - reducing ref loses correct remote context", () => {
    // PR #35 https://github.com/sagold/json-schema-library/pull/35/commits/8b6477113bdfce522081473bb0dd8fd6fe680391
    it("should maintain references from a remote schema when resolving oneOf with $ref", () => {
        const node = compileSchema({
            $id: "https://root/schema.json",
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
        console.log("RESULT titleNode", titleNode.context.rootNode.$id, titleNode.schema);

        const innerTitleNode = titleNode.get("innerTitle", { innerTitle: 111 });
        console.log("innerTitleNode", innerTitleNode);
        assert.deepEqual(innerTitleNode.schema, { type: "number", title: "Zahl" });
    });
    // it("should maintain references from a remote schema when resolving oneOf with $ref", () => {
    //     draft.addRemoteSchema("https://my-other-schema.com/schema.json", {
    //         type: "object",
    //         properties: {
    //             innerTitle: { $ref: "#/definitions/number" }
    //         },
    //         definitions: {
    //             number: { type: "number", title: "Zahl" }
    //         }
    //     });
    //     const schema = draft.compileSchema({
    //         type: "object",
    //         properties: {
    //             title: {
    //                 oneOf: [
    //                     {
    //                         type: "object",
    //                         properties: { innerTitle: { type: "string", title: "Zeichenkette" } }
    //                     },
    //                     { $ref: "https://my-other-schema.com/schema.json" }
    //                 ]
    //             }
    //         }
    //     });
    //     const res = step("title", schema, { title: { innerTitle: 111 } });
    //     expect(res.type).to.eq("object");
    //     const nextRes = step("innerTitle", res, { innerTitle: 111 });
    //     expect(nextRes.type).to.eq("number");
    // });
});
