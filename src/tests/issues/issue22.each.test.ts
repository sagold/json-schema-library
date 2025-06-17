import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema.js";

describe("issue#22 - toDataNodes on root $ref", () => {
    it("should call for each properties", () => {
        const nodes = compileSchema({
            $schema: "http://json-schema.org/draft-07/schema",
            $ref: "#/definitions/object1",
            definitions: {
                object1: {
                    type: "object",
                    required: ["prop1", "prop2"],
                    properties: {
                        prop1: {
                            type: "string"
                        },
                        prop2: {
                            type: "string"
                        }
                    }
                }
            }
        })
            .toDataNodes({ prop1: "foo", prop2: "foo" })
            .map((dataNode) => dataNode.node.schema);

        assert.deepEqual(nodes.length, 3);
        assert.deepEqual(nodes[0].type, "object");
        assert.deepEqual(nodes[1].type, "string");
        assert.deepEqual(nodes[2].type, "string");
    });
});
