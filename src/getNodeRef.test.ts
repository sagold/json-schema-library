import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { isJsonError, SchemaNode } from "./types";

describe("compileSchema : getNodeRef", () => {
    describe("local ref", () => {
        let root: SchemaNode;
        beforeEach(() => {
            root = compileSchema({
                type: "object",
                additionalProperties: false,
                properties: {},
                $defs: {
                    a: {
                        type: "object",
                        properties: {
                            title: { name: "title", type: "string" }
                        }
                    }
                }
            });
        });

        it("should return existing local reference from $defs", () => {
            const targetNode = root.getNodeRef("#/$defs/a");
            assert.deepEqual(targetNode.schema, root.schema.$defs.a);
        });

        it("should return a JsonError for a invalid local reference to $defs", () => {
            const targetNode = root.getNodeRef("#/$defs/b");
            assert(isJsonError(targetNode));
        });
    });
});
