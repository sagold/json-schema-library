import { compileSchema } from "../compileSchema";
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

describe("keyword : type : reduce", () => {
    it("should reduce array-type to the last matching data-type", () => {
        const { node } = compileSchema({ type: ["null", "integer"] }).reduceNode(123);
        assert.equal(node?.type, "integer");
        assert.equal(node?.schema.type, "integer");
    });
    it("should reduce array-type to the first matching data-type", () => {
        const { node } = compileSchema({ type: ["null", "integer"] }).reduceNode(null);
        assert.equal(node?.type, "null");
        assert.equal(node?.schema.type, "null");
    });
});
