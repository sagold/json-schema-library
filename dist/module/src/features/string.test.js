import { compileSchema } from "../compileSchema";
import { strict as assert } from "assert";
describe("feature : string : validation", () => {
    it("should return error for string shorter than minLength", () => {
        const node = compileSchema({ type: "string", minLength: 2 });
        const errors = node.validate("a");
        assert.equal(errors.length, 1);
        assert.deepEqual(errors[0].code, "min-length-error");
    });
    it("should NOT return error for string matching minLength", () => {
        const node = compileSchema({ type: "string", minLength: 2 });
        const errors = node.validate("ab");
        assert.equal(errors.length, 0);
    });
    it("should return error for string larger than maxLength", () => {
        const node = compileSchema({ type: "string", maxLength: 2 });
        const errors = node.validate("abc");
        assert.equal(errors.length, 1);
        assert.deepEqual(errors[0].code, "max-length-error");
    });
    it("should NOT return error for string matching maxLength", () => {
        const node = compileSchema({ type: "string", maxLength: 2 });
        const errors = node.validate("ab");
        assert.equal(errors.length, 0);
    });
});
describe("feature : string : default data", () => {
    it("should return default value if string is undefined", () => {
        const node = compileSchema({ type: "string", default: "abc" });
        const data = node.getTemplate();
        assert.deepEqual(data, "abc");
    });
    it("should NOT return default value if string is undefined", () => {
        const node = compileSchema({ type: "string", default: "abc" });
        const data = node.getTemplate("123");
        assert.deepEqual(data, "123");
    });
});
