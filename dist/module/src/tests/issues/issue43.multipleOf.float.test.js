import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
describe("issue#43 - multipleOf .01", () => {
    let node;
    beforeEach(() => {
        node = compileSchema({
            type: "number",
            multipleOf: 0.01
        });
    });
    it("should validate 1", () => {
        const { errors } = node.validate(1);
        assert(errors.length === 0);
    });
    it("should validate .2", () => {
        const { errors } = node.validate(0.2);
        assert(errors.length === 0);
    });
    it("should validate .02", () => {
        const { errors } = node.validate(0.02);
        assert(errors.length === 0);
    });
    it("should not validate .025", () => {
        const { errors } = node.validate(0.025);
        assert(errors.length === 1, "should have returned an error");
    });
    it("should validate 1.36", () => {
        const { errors } = node.validate(1.36);
        assert(errors.length === 0);
    });
    it("should validate 2.74", () => {
        const { errors } = node.validate(2.74);
        assert(errors.length === 0);
    });
    it("should validate 123456789", () => {
        const { errors } = node.validate(123456789);
        assert(errors.length === 0);
    });
    it("should not validate Infinity", () => {
        const { errors } = node.validate(1e308);
        assert(errors.length === 1, "should have returned an error");
    });
    it("should validate all floats with two decimals", () => {
        for (let i = 0; i <= 100; i++) {
            const num = `2.${i}`;
            assert.deepEqual(node.validate(parseFloat(num)).valid, true, `should have validated '${num}'`);
        }
    });
    it("should still validate multiple of integers", () => {
        node = compileSchema({
            type: "number",
            multipleOf: 3
        });
        const { errors } = node.validate(9);
        assert(errors.length === 0);
    });
    it("should still invalidate non-multiples of integers", () => {
        node = compileSchema({
            type: "number",
            multipleOf: 3
        });
        const { errors } = node.validate(7);
        assert(errors.length === 1, "should have returned an error");
    });
});
