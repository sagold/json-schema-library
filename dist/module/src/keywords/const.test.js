import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";
describe("keyword : const : validate", () => {
    it("should return error if const does not match", () => {
        const errors = compileSchema({ const: true }).validate(false);
        assert.equal(errors.length, 1);
    });
    it("should NOT return error if const does match", () => {
        const errors = compileSchema({ const: true }).validate(true);
        assert.equal(errors.length, 0);
    });
    it("should return error if value is not null", () => {
        const errors = compileSchema({ const: null }).validate("mi");
        assert.equal(errors.length, 1);
    });
    it("should NOT return error if value is null", () => {
        const errors = compileSchema({ const: null }).validate(null);
        assert.equal(errors.length, 0);
    });
    it("should return error if object is not deep equal", () => {
        const errors = compileSchema({ const: { a: { b: 2 } } }).validate({ a: { b: "2" } });
        assert.equal(errors.length, 1);
    });
    it("should NOT return error if object is deep equal", () => {
        const errors = compileSchema({ const: { a: { b: 2 } } }).validate({ a: { b: 2 } });
        assert.equal(errors.length, 0);
    });
});
