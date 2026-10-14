import { strict as assert } from "assert";

import { compileSchema } from "../compileSchema";

describe("keyword : const : validate", () => {
    it("should compare literal member names in plain and null-prototype objects", () => {
        const node = compileSchema({
            const: { valueOf: 1, toString: "label", nested: [{ constructor: { a: 1, b: 2 } }] }
        });
        const data = { nested: [{ constructor: { b: 2, a: 1 } }], toString: "label", valueOf: 1 };

        assert.equal(node.validate(data).valid, true);
        assert.equal(node.validate(Object.assign(Object.create(null), data)).valid, true);
    });

    it("should return error if const does not match", () => {
        const { errors } = compileSchema({ const: true }).validate(false);
        assert.equal(errors.length, 1);
    });

    it("should NOT return error if const does match", () => {
        const { errors } = compileSchema({ const: true }).validate(true);
        assert.equal(errors.length, 0);
    });

    it("should return error if value is not null", () => {
        const { errors } = compileSchema({ const: null }).validate("mi");
        assert.equal(errors.length, 1);
    });

    it("should NOT return error if value is null", () => {
        const { errors } = compileSchema({ const: null }).validate(null);
        assert.equal(errors.length, 0);
    });

    it("should return error if object is not deep equal", () => {
        const { errors } = compileSchema({ const: { a: { b: 2 } } }).validate({ a: { b: "2" } });
        assert.equal(errors.length, 1);
    });

    it("should NOT return error if object is deep equal", () => {
        const { errors } = compileSchema({ const: { a: { b: 2 } } }).validate({ a: { b: 2 } });
        assert.equal(errors.length, 0);
    });
});
