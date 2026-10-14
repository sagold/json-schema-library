import { strict as assert } from "assert";

import { compileSchema } from "../compileSchema";

describe("keyword : enum : validate", () => {
    it("should accept reordered nested object keys", () => {
        const node = compileSchema({ enum: [[{ a: 1, b: { c: 2, d: 3 } }, 4]] });

        assert.equal(node.validate([{ b: { d: 3, c: 2 }, a: 1 }, 4]).valid, true);
    });

    it("should keep unequal JSON values distinct", () => {
        const node = compileSchema({ enum: [[{ a: 1, b: 2 }, 3]] });

        assert.equal(node.validate([3, { b: 2, a: 1 }]).valid, false);
        assert.equal(node.validate([{ b: 2, a: 1 }]).valid, false);
        assert.equal(node.validate([{ a: 1, c: 2 }, 3]).valid, false);
        assert.equal(node.validate([{ a: 1, b: "2" }, 3]).valid, false);
    });

    it("should return error of type enum-error", () => {
        const node = compileSchema({
            type: "string",
            enum: ["a", "b"]
        });

        const { errors } = node.validate("c");

        assert.deepEqual(errors.length, 1, "should have returned a single error");
        const [err] = errors;
        assert.deepEqual(err.code, "enum-error");
        assert(err.message.includes(JSON.stringify(["a", "b"])), "error message should mentioned valid values");
    });
});
