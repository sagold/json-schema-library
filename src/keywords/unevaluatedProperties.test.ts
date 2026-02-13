import { compileSchema } from "../compileSchema";
import { strict as assert } from "assert";

describe("keyword : unevaluatedProperties : validation", () => {
    it("should return an error if property is not validate by JSON Schema", () => {
        const { errors } = compileSchema({ type: "object", unevaluatedProperties: false }).validate({ test: "123" });
        assert.equal(errors.length, 1);
    });

    it("should not return error if non validated property is undefined", () => {
        const { errors } = compileSchema({ type: "object", unevaluatedProperties: false }).validate({
            test: undefined
        });
        assert.equal(errors.length, 0);
    });
});
