import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { each } from "../../each";

describe("issue#22 - eachSchema on root $ref", () => {
    it("should call for each properties", () => {
        const node = compileSchema({
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
        });

        const calls: any[] = [];
        each(
            node,
            {
                prop1: "foo",
                prop2: "foo"
            },
            (node) => calls.push(node?.schema)
        );

        assert.deepEqual(calls.length, 3);
        assert.deepEqual(calls[0].type, "object");
        assert.deepEqual(calls[1].type, "string");
        assert.deepEqual(calls[2].type, "string");
    });
});
