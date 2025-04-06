import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";
describe("keyword : properties : get", () => {
    it("shoud return errors for missing `required` properties", () => {
        const errors = compileSchema({
            type: "object",
            required: ["id", "a", "aa", "aaa"]
        }).validate({ id: "first", a: "correct", b: "ignored" });
        assert.deepEqual(errors.length, 2);
        assert.deepEqual(errors[0].code, "required-property-error");
        assert.deepEqual(errors[1].code, "required-property-error");
    });
});
