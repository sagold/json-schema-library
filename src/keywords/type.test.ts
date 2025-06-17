import { compileSchema } from "../compileSchema.js";
import { strict as assert } from "assert";

describe("keyword : type : validation", () => {
    describe("integer", () => {
        it("should support type 'integer'", () => {
            const { errors } = compileSchema({ type: "integer" }).validate(1);
            assert.equal(errors.length, 0);
        });

        it("should throw error if type 'integer' received a float", () => {
            const { errors } = compileSchema({ type: "integer" }).validate(1.1);
            assert.equal(errors.length, 1);
            assert.equal(errors[0].code, "type-error");
        });

        it("should validate NaN", () => {
            const { errors } = compileSchema({ type: "integer" }).validate(parseInt("a"));
            assert.equal(errors.length, 0);
        });
    });
});
