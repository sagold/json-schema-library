import { Draft } from "../../lib/draft";
import { Draft2019 } from "../../lib/draft2019";
import { compileSchema } from "../compileSchema";
import { strict as assert } from "assert";

describe("feature : type : validation", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    describe("integer", () => {
        it("should support type 'integer'", () => {
            const errors = compileSchema(draft, { type: "integer" }).validate(1);
            assert.equal(errors.length, 0);
        });

        it("should throw error if type 'integer' received a float", () => {
            const errors = compileSchema(draft, { type: "integer" }).validate(1.1);
            assert.equal(errors.length, 1);
            assert.equal(errors[0].code, "type-error");
        });

        it("should validate NaN", () => {
            const errors = compileSchema(draft, { type: "integer" }).validate(parseInt("a"));
            assert.equal(errors.length, 0);
        });
    });
});
