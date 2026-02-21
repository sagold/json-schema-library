import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { isSchemaNode } from "./types";
import settings from "./settings";
const DECLARATOR_ONEOF = settings.DECLARATOR_ONEOF;

describe("getNodeChild.oneOfProperty", () => {
    describe("", () => {
        it("should return resolved reference (reduced oneOfNode)", () => {
            const node = compileSchema({
                items: {
                    [DECLARATOR_ONEOF]: "name",
                    oneOf: [{ $ref: "#/$defs/first" }, { $ref: "#/$defs/second" }]
                },
                $defs: {
                    first: {
                        properties: { name: { type: "string", const: "first" }, title: { type: "number" } }
                    },
                    second: {
                        properties: { name: { type: "string", const: "second" }, title: { type: "number" } }
                    }
                }
            });

            // precondition
            const reducedItems = node.items?.reduceNode({ name: "second" });
            assert(reducedItems && reducedItems.node, "should have successfully resolved items schema directly");
            assert.deepEqual(
                reducedItems.node?.schema,
                {
                    properties: { name: { type: "string", const: "second" }, title: { type: "number" } }
                },
                "should have correctly resolved items-schema directly"
            );

            const { node: res } = node.getNode("#/0", [{ name: "second" }]);
            assert(isSchemaNode(res), "expected result to a node");
            assert.deepEqual(res.schema, {
                properties: { name: { type: "string", const: "second" }, title: { type: "number" } }
            });
        });
    });
});
