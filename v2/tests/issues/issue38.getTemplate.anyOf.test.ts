import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { SchemaNode } from "../../types";

describe("issue#38 - getTemplate anyOf should not modify valid default value", () => {
    let node: SchemaNode;
    beforeEach(() => {
        node = compileSchema({
            type: "object",
            required: ["someList"],
            properties: {
                someList: {
                    type: "array",
                    items: { anyOf: [{ a: "number" }, { b: "string" }, { c: { const: "foo" } }] },
                    minItems: 3,
                    default: [{ a: 1 }, { b: "schfifty-five" }, { c: "foo" }]
                }
            }
        });
    });

    it("should return valid default value", () => {
        const result = node.getTemplate();
        assert.deepEqual(result, {
            someList: [{ a: 1 }, { b: "schfifty-five" }, { c: "foo" }]
        });
    });
});
