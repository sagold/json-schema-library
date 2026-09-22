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

        const { errors } = node.validate({ title: "valid", label: "error" });
        assert.deepEqual(errors.length, 1);
        assert.deepEqual(errors[0].code, "min-length-error");
    });

    it("should should merge property", () => {
        const a = compileSchema({ type: "object", properties: { title: { type: "string", minLength: 1 } } });
        const b = compileSchema({ type: "object", properties: { title: { type: "string", maxLength: 20 } } });
        const node = mergeNode(a, b);
        assert(isSchemaNode(node), "should have returned a valid schema node");
        assert.deepEqual(node.properties?.title.schema, { type: "string", minLength: 1, maxLength: 20 });
    });

    it("should should merge items (object)", () => {
        const a = compileSchema({ type: "array", items: { type: "string", minLength: 1 } });
        const b = compileSchema({ type: "array", items: { type: "number", minimum: 1 } });
        const node = mergeNode(a, b);
        assert(isSchemaNode(node), "should have returned a valid schema node");
        assert.deepEqual(node.items?.schema, { type: "number", minimum: 1, minLength: 1 });

        const { errors } = node.validate([0, 10]);
        assert.deepEqual(errors.length, 1);
    });

    it("keeps modern and legacy definitions separate when merging nodes", () => {
        const node = mergeNode(
            compileSchema({ definitions: { item: { type: "string", maxLength: 2 } } }),
            compileSchema({ $defs: { item: { type: "string", minLength: 3 } } })
        );
        assert.ok(node);
        assert.equal(node.$defs?.item.validate("text").valid, true);
        assert.equal(node.$defs?.item.validate(2).valid, false);
        assert.equal(node.$defs?.item.validate("ab").valid, false);
        assert.equal(node.definitions?.item.validate("ab").valid, true);
        assert.equal(node.definitions?.item.validate("text").valid, false);
        assert.equal(node.definitions?.item.validate(2).valid, false);
        assert.deepEqual(node.toSchemaNodes(), [node, node.$defs?.item, node.definitions?.item]);
    });

    it("merges legacy dictionaries without duplicating their compatibility alias", () => {
        const node = mergeNode(
            compileSchema({ definitions: { first: { type: "string" } } }),
            compileSchema({ definitions: { second: { type: "number" } } })
        );
        assert.ok(node);
        assert.deepEqual(Object.keys(node.definitions ?? {}), ["first", "second"]);
        assert.equal(node.$defs, node.definitions);
        assert.deepEqual(node.toSchemaNodes(), [node, node.definitions?.first, node.definitions?.second]);
        assert.equal(node.definitions?.first.validate("text").valid, true);
        assert.equal(node.definitions?.first.validate(7).valid, false);
        assert.equal(node.definitions?.second.validate(7).valid, true);
        assert.equal(node.definitions?.second.validate("text").valid, false);
    });

    describe("omit", () => {
        it("should omit oneOf node- and schema-property", () => {
            const a = compileSchema({
                oneOf: [
                    { type: "string", minLength: 1 },
                    { type: "number", minimum: 2 }
                ]
            });
            const node = mergeNode(a, a, "oneOf");
            assert(isSchemaNode(node), "should have returned a valid schema node");

            const oneOf = (f: any) => f.toJSON() === "oneOf";
            assert.deepEqual(node.schema.oneOf, undefined);
            assert.deepEqual(node.oneOf, undefined);
            assert.deepEqual(node.reducers.find(oneOf), undefined);
            assert.deepEqual(node.resolvers.find(oneOf), undefined);
            assert.deepEqual(node.validators.find(oneOf), undefined);
        });

        it("should omit allOf node- and schema-property", () => {
            const a = compileSchema({
                allOf: [
                    { type: "string", minLength: 1 },
                    { type: "number", minimum: 2 }
                ]
            });
            const node = mergeNode(a, a, "allOf");
            assert(isSchemaNode(node), "should have returned a valid schema node");

            const allOf = (f: any) => f.toJSON() === "allOf";
            assert.deepEqual(node.schema.allOf, undefined);
            assert.deepEqual(node.allOf, undefined);
            assert.deepEqual(node.reducers.find(allOf), undefined);
            assert.deepEqual(node.resolvers.find(allOf), undefined);
            assert.deepEqual(node.validators.find(allOf), undefined);
        });
    });
});
