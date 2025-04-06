import { strict as assert } from "assert";
import { mergeSchema } from "./mergeSchema";
describe("mergeSchema", () => {
    it("should merge required statements", () => {
        const schema = mergeSchema({ type: "object", required: ["one", "two"] }, { type: "object", required: ["one", "three"] });
        assert.deepEqual(schema.required, ["one", "two", "three"]);
    });
    it("should merge properties", () => {
        const schema = mergeSchema({ type: "object", properties: { one: { type: "string" } } }, { type: "object", properties: { two: { type: "number" } } });
        assert.deepEqual(schema.properties, {
            one: { type: "string" },
            two: { type: "number" }
        });
    });
    it("should merge property", () => {
        const schema = mergeSchema({ type: "object", properties: { one: { type: "string", minLength: 1 } } }, { type: "object", properties: { one: { type: "string", maxLength: 2 } } });
        assert.deepEqual(schema.properties, {
            one: { type: "string", minLength: 1, maxLength: 2 }
        });
    });
    it("should merge item property", () => {
        const schema = mergeSchema({ type: "array", items: { properties: { one: { type: "string", minLength: 1 } } } }, { type: "array", items: { properties: { one: { type: "string", maxLength: 2 } } } });
        assert.deepEqual(schema.items.properties, {
            one: { type: "string", minLength: 1, maxLength: 2 }
        });
    });
    it("should overwrite properties by last argument", () => {
        const schema = mergeSchema({ type: "array" }, { type: "object" });
        assert.deepEqual(schema.type, "object");
    });
    it("should overwrite items by last argument", () => {
        const schema = mergeSchema({ type: "array", items: [{ type: "string" }] }, { type: "array", items: [true] });
        assert.deepEqual(schema.items, [true]);
    });
    it("should merge items of same type", () => {
        const schema = mergeSchema({ type: "array", items: [{ type: "string", minLength: 1 }] }, { type: "array", items: [{ type: "string", maxLength: 9 }] });
        assert.deepEqual(schema.items, [{ type: "string", minLength: 1, maxLength: 9 }]);
    });
    it("should not merge items of different type", () => {
        const schema = mergeSchema({ type: "array", items: [{ type: "number", minimum: 1 }] }, { type: "array", items: [{ type: "string", maxLength: 9 }] });
        assert.deepEqual(schema.items, [{ type: "string", maxLength: 9 }]);
    });
    it("should replace items by last argument", () => {
        const schema = mergeSchema({ type: "array", items: [{ type: "string" }, { type: "number" }] }, { type: "array", items: [{ type: "boolean" }] });
        assert.deepEqual(schema.items, [{ type: "boolean" }]);
    });
    it("should append anyOf schema", () => {
        const schema = mergeSchema({ type: "array", items: { anyOf: [{ type: "string" }] } }, { type: "array", items: { anyOf: [{ type: "number" }] } });
        assert.deepEqual(schema.items.anyOf, [{ type: "string" }, { type: "number" }]);
    });
});
