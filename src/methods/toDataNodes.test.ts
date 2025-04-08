import { compileSchema } from "../compileSchema";
import { strict as assert } from "assert";

describe("toDataNodes", () => {
    it("should call callback with schema, value and pointer", () => {
        const nodes = compileSchema({ type: "number" }).toDataNodes(5);

        assert.deepEqual(nodes.length, 1);
        assert.deepEqual(nodes[0].node.schema, { type: "number" });
        assert.deepEqual(nodes[0].value, 5);
        assert.deepEqual(nodes[0].pointer, "#");
    });

    it("should callback for array and all array items", () => {
        const nodes = compileSchema({ type: "array", items: { type: "number" } }).toDataNodes([5, 9]);

        assert.deepEqual(nodes.length, 3);
        assert.deepEqual(
            nodes.map((r) => [r.node.schema, r.value, r.pointer]),
            [
                [{ type: "array", items: { type: "number" } }, [5, 9], "#"],
                [{ type: "number" }, 5, "#/0"],
                [{ type: "number" }, 9, "#/1"]
            ]
        );
    });

    it("should callback for array and pick correct schema forEach item", () => {
        const nodes = compileSchema({
            type: "array",
            prefixItems: [{ type: "number" }, { type: "string" }]
        }).toDataNodes([5, "nine"]);

        assert.deepEqual(nodes.length, 3);
        assert.deepEqual(
            nodes.map((r) => [r.node.schema, r.value, r.pointer]),
            [
                [{ type: "array", prefixItems: [{ type: "number" }, { type: "string" }] }, [5, "nine"], "#"],
                [{ type: "number" }, 5, "#/0"],
                [{ type: "string" }, "nine", "#/1"]
            ]
        );
    });

    it("should callback for object and all properties", () => {
        const nodes = compileSchema({
            type: "object",
            properties: { a: { type: "number" }, b: { type: "number" } }
        }).toDataNodes({ a: 5, b: 9 });

        assert.deepEqual(nodes.length, 3);
        assert.deepEqual(
            nodes.map((r) => [r.node.schema, r.value, r.pointer]),
            [
                [
                    {
                        type: "object",
                        properties: { a: { type: "number" }, b: { type: "number" } }
                    },
                    { a: 5, b: 9 },
                    "#"
                ],
                [{ type: "number" }, 5, "#/a"],
                [{ type: "number" }, 9, "#/b"]
            ]
        );
    });

    it("should resolve root reference", () => {
        const nodes = compileSchema({
            $ref: "#/definitions/value",
            definitions: { value: { type: "object", properties: { title: { type: "string" } } } }
        }).toDataNodes({ title: "third" });

        assert.deepEqual(nodes.length, 2);
        assert.deepEqual(nodes[0].node.schema.type, "object");
        assert.deepEqual(nodes[1].node.schema.type, "string");
    });
});
