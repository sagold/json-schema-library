import { expect } from "chai";
import { mergeSchema } from "../../lib/mergeSchema";

describe("mergeSchema", () => {
    it("should merge required statements", () => {
        const schema = mergeSchema(
            { type: "object", required: ["one", "two"] },
            { type: "object", required: ["one", "three"] }
        );
        expect(schema.required).to.deep.equal(["one", "two", "three"]);
    });
    it("should merge properties", () => {
        const schema = mergeSchema(
            { type: "object", properties: { one: { type: "string" } } },
            { type: "object", properties: { two: { type: "number" } } }
        );
        expect(schema.properties).to.deep.equal({
            one: { type: "string" },
            two: { type: "number" }
        });
    });
    it("should merge property", () => {
        const schema = mergeSchema(
            { type: "object", properties: { one: { type: "string", minLength: 1 } } },
            { type: "object", properties: { one: { type: "string", maxLength: 2 } } }
        );
        expect(schema.properties).to.deep.equal({
            one: { type: "string", minLength: 1, maxLength: 2 }
        });
    });
    it("should merge item property", () => {
        const schema = mergeSchema(
            { type: "array", items: { properties: { one: { type: "string", minLength: 1 } } } },
            { type: "array", items: { properties: { one: { type: "string", maxLength: 2 } } } }
        );
        expect(schema.items.properties).to.deep.equal({
            one: { type: "string", minLength: 1, maxLength: 2 }
        });
    });
    it("should overwrite properties by last argument", () => {
        const schema = mergeSchema({ type: "array" }, { type: "object" });
        expect(schema.type).to.equal("object");
    });

    it("should overwrite items by last argument", () => {
        const schema = mergeSchema(
            { type: "array", items: [{ type: "string" }] },
            { type: "array", items: [true] }
        );
        expect(schema.items).to.deep.equal([true]);
    });

    it("should merge items of same type", () => {
        const schema = mergeSchema(
            { type: "array", items: [{ type: "string", minLength: 1 }] },
            { type: "array", items: [{ type: "string", maxLength: 9 }] }
        );
        expect(schema.items).to.deep.equal([{ type: "string", minLength: 1, maxLength: 9 }]);
    });

    it("should not merge items of different type", () => {
        const schema = mergeSchema(
            { type: "array", items: [{ type: "number", minimum: 1 }] },
            { type: "array", items: [{ type: "string", maxLength: 9 }] }
        );
        expect(schema.items).to.deep.equal([{ type: "string", maxLength: 9 }]);
    });

    it("should replace items by last argument", () => {
        const schema = mergeSchema(
            { type: "array", items: [{ type: "string" }, { type: "number" }] },
            { type: "array", items: [{ type: "boolean" }] }
        );
        expect(schema.items).to.deep.equal([{ type: "boolean" }]);
    });
});
