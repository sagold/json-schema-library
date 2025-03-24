import { strict as assert } from "assert";
import { createSchema } from "./createSchema";
import getTypeOf from "./utils/getTypeOf";

describe("createSchema", () => {
    it("should add type 'object' of data to schema", () => {
        const res = createSchema({});
        assert.deepEqual(res.type, "object");
    });

    it("should add type 'string' of data to schema", () => {
        const res = createSchema("");
        assert.deepEqual(res, { type: "string" });
    });

    it("should should add object's properties", () => {
        const res = createSchema({ first: "", second: {} });
        assert.deepEqual(Object.keys(res.properties), ["first", "second"]);
    });

    it("should add items from array", () => {
        const res = createSchema(["string", false]);
        assert.deepEqual(res.items.length, 2);
        assert.deepEqual(res.items[0].type, "string");
        assert.deepEqual(res.items[1].type, "boolean");
    });

    it("should add single item as item-object", () => {
        const res = createSchema(["string"]);
        assert.deepEqual(getTypeOf(res.items), "object");
        assert.deepEqual(res.items, { type: "string" });
    });
});
