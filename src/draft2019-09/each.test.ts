import { compileSchema } from "../compileSchema";
import { strict as assert } from "assert";
import { SchemaNode } from "../types";

describe("each (2019)", () => {
    const $schema = "draft-2019-09";

    it("should call callback with schema, value and pointer", () => {
        const calls: [SchemaNode, unknown, string][] = [];
        compileSchema({ $schema, type: "number" }).each(5, (...args) => calls.push(args));

        assert.deepEqual(calls.length, 1);
        assert.deepEqual(calls[0][0].schema, { $schema, type: "number" });
        assert.deepEqual(calls[0][1], 5);
        assert.deepEqual(calls[0][2], "#");
    });

    it("should callback for array and all array items", () => {
        const calls: [SchemaNode, unknown, string][] = [];
        compileSchema({ $schema, type: "array", items: { type: "number" } }).each([5, 9], (...args) =>
            calls.push(args)
        );

        assert.deepEqual(calls.length, 3);
        assert.deepEqual(
            calls.map((r) => [r[0].schema, r[1], r[2]]),
            [
                [{ $schema, type: "array", items: { type: "number" } }, [5, 9], "#"],
                [{ type: "number" }, 5, "#/0"],
                [{ type: "number" }, 9, "#/1"]
            ]
        );
    });

    it("should callback for array and pick correct schema forEach item", () => {
        const calls: [SchemaNode, unknown, string][] = [];
        compileSchema({
            $schema,
            type: "array",
            items: [{ type: "number" }, { type: "string" }]
        }).each([5, "nine"], (...args) => calls.push(args));

        assert.deepEqual(calls.length, 3);
        assert.deepEqual(
            calls.map((r) => [r[0].schema, r[1], r[2]]),
            [
                [{ $schema, type: "array", items: [{ type: "number" }, { type: "string" }] }, [5, "nine"], "#"],
                [{ type: "number" }, 5, "#/0"],
                [{ type: "string" }, "nine", "#/1"]
            ]
        );
    });

    it("should callback for object and all properties", () => {
        const calls: [SchemaNode, unknown, string][] = [];
        compileSchema({
            $schema,
            type: "object",
            properties: { a: { type: "number" }, b: { type: "number" } }
        }).each({ a: 5, b: 9 }, (...args) => calls.push(args));

        assert.deepEqual(calls.length, 3);
        assert.deepEqual(
            calls.map((r) => [r[0].schema, r[1], r[2]]),
            [
                [
                    {
                        $schema,
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
        const calls: SchemaNode[] = [];
        compileSchema({
            $schema,
            $ref: "#/definitions/value",
            definitions: { value: { type: "object", properties: { title: { type: "string" } } } }
        }).each({ title: "third" }, (node) => calls.push(node));

        assert.deepEqual(calls.length, 2);
        assert.deepEqual(calls[0].schema.type, "object");
        assert.deepEqual(calls[1].schema.type, "string");
    });
});
