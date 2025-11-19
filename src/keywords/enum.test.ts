import { strict as assert } from "assert";

import { compileSchema } from "../compileSchema";

describe("keyword : enum : validate", () => {
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
