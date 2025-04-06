import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";

describe("keyword : additionalItems : validate", () => {
    it("should allow any additional item when set to 'true'", () => {
        const node = compileSchema({ type: "array", additionalItems: true });
        const errors = node.validate(["a"]);
        assert.deepEqual(errors.length, 0);
    });

    it("should allow any additional item when undefined", () => {
        const node = compileSchema({ type: "array" });
        const errors = node.validate(["a"]);
        assert.deepEqual(errors.length, 0);
    });

    it("should NOT allow any additional item when set to 'false' but a schema is given", () => {
        const node = compileSchema({ type: "array", items: [], additionalItems: false });
        const errors = node.validate(["a"]);
        assert.deepEqual(errors.length, 1);
        assert.deepEqual(errors[0].code, "additional-items-error");
        assert.deepEqual(errors[0].data.pointer, "#/0");
        assert.deepEqual(errors[0].data.key, 0);
    });

    it("should allow any additional item when set to 'false' and no schema given", () => {
        const node = compileSchema({ type: "array", additionalItems: false });
        const errors = node.validate(["a"]);
        assert.deepEqual(errors.length, 0);
    });

    it("should return error for prohibited additional items", () => {
        const errors = compileSchema({
            type: "array",
            items: [{ type: "string" }, { type: "number" }],
            additionalItems: false
        }).validate(["1", 2, "a"]);

        assert.deepEqual(errors.length, 1);
        assert.deepEqual(errors[0].code, "additional-items-error");
    });

    it("should be valid if 'additionalItems' is true", () => {
        const errors = compileSchema({
            type: "array",
            items: [{ type: "string" }, { type: "number" }],
            additionalItems: true
        }).validate(["1", 2, "a"]);

        assert.deepEqual(errors.length, 0);
    });

    it("should also be valid if 'additionalItems' is undefined", () => {
        const errors = compileSchema({
            type: "array",
            items: [{ type: "string" }, { type: "number" }]
        }).validate(["1", 2, "a"]);

        assert.deepEqual(errors.length, 0);
    });

    it("should return error for mismatching 'additionalItems' schema", () => {
        const errors = compileSchema({
            type: "array",
            items: [{ type: "string" }, { type: "number" }],
            additionalItems: { type: "object" }
        }).validate(["1", 2, "a"]);

        assert.deepEqual(errors.length, 1);
        assert.deepEqual(errors[0].code, "type-error");
    });

    it("should be valid for matching 'additionalItems' schema", () => {
        const errors = compileSchema({
            type: "array",
            items: [{ type: "string" }, { type: "number" }],
            additionalItems: { type: "object" }
        }).validate(["1", 2, {}]);

        assert.deepEqual(errors.length, 0);
    });
});
