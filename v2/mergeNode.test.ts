import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { isSchemaNode } from "./types";
import { mergeNode, removeDuplicates } from "./mergeNode";

describe("removeDuplicates", () => {
    it("should remove duplicate functions", () => {
        function a() {}
        function b() {}
        const result = [a, a, b, a].filter(removeDuplicates);
        assert(result.length === 2);
    });
});

describe("mergeNode", () => {
    it("should should merge properties", () => {
        const a = compileSchema({ type: "object", properties: { title: { type: "string", minLength: 1 } } });
        const b = compileSchema({ type: "object", properties: { label: { type: "string", minLength: 20 } } });
        const node = mergeNode(a, b);

        assert(isSchemaNode(node), "should have returned a valid schema node");
        assert.deepEqual(node.properties?.title.schema, { type: "string", minLength: 1 });
        assert.deepEqual(node.properties?.label.schema, { type: "string", minLength: 20 });

        const errors = node.validate({ title: "valid", label: "error" });
        assert.deepEqual(errors.length, 1);
        assert.deepEqual(errors[0].code, "min-length-error");
    });

    it("should should merge property", () => {
        const a = compileSchema({ type: "object", properties: { title: { type: "string", minLength: 1 } } });
        const b = compileSchema({ type: "object", properties: { title: { type: "string", maxLength: 20 } } });
        const node = mergeNode(a, b);
        assert(isSchemaNode(node), "should have returned a valid schema node");
        assert.deepEqual(node.properties?.title!.schema, { type: "string", minLength: 1, maxLength: 20 });
    });

    it("should should merge items (object)", () => {
        const a = compileSchema({ type: "array", items: { type: "string", minLength: 1 } });
        const b = compileSchema({ type: "array", items: { type: "number", minimum: 1 } });
        const node = mergeNode(a, b);
        assert(isSchemaNode(node), "should have returned a valid schema node");
        assert.deepEqual(node.itemsObject?.schema, { type: "number", minimum: 1, minLength: 1 });

        const errors = node.validate([0, 10]);
        assert.deepEqual(errors.length, 1);
    });
});
