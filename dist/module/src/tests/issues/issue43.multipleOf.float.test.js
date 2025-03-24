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
        const result = node.validate(1);
        assert(result.length === 0);
    });
    it("should validate .2", () => {
        const result = node.validate(0.2);
        assert(result.length === 0);
    });
    it("should validate .02", () => {
        const result = node.validate(0.02);
        assert(result.length === 0);
    });
    it("should not validate .025", () => {
        const result = node.validate(0.025);
        assert(result.length === 1, "should have returned an error");
    });
    it("should validate 1.36", () => {
        const result = node.validate(1.36);
        assert(result.length === 0);
    });
    it("should validate 2.74", () => {
        const result = node.validate(2.74);
        assert(result.length === 0);
    });
    it("should validate 123456789", () => {
        const result = node.validate(123456789);
        assert(result.length === 0);
    });
    it("should not validate Infinity", () => {
        const result = node.validate(1e308);
        assert(result.length === 1, "should have returned an error");
    });
    it("should validate all floats with two decimals", () => {
        for (let i = 0; i <= 100; i++) {
            const num = `2.${i}`;
            assert.deepEqual(node.validate(parseFloat(num)).length, 0, `should have validated '${num}'`);
        }
    });
    it("should still validate multiple of integers", () => {
        node = compileSchema({
            type: "number",
            multipleOf: 3
        });
        const result = node.validate(9);
        assert(result.length === 0);
    });
    it("should still invalidate non-multiples of integers", () => {
        node = compileSchema({
            type: "number",
            multipleOf: 3
        });
        const result = node.validate(7);
        assert(result.length === 1, "should have returned an error");
    });
});
