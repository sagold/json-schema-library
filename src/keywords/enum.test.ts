import { strict as assert } from "assert";

import { compileSchema } from "../compileSchema";

describe("keyword : enum : validate", () => {
    it("should accept objects with reordered keys", () => {
        const node = compileSchema({ enum: [null, { a: 1, b: 2 }] });

        assert.equal(node.validate({ a: 1, b: 2 }).valid, true);
        assert.equal(node.validate({ b: 2, a: 1 }).valid, true);
    });

    it("should accept reordered nested object keys in arrays", () => {
        const node = compileSchema({ enum: [[{ first: 1, second: { a: 2, b: 3 } }, 4]] });

        const result = node.validate([{ second: { b: 3, a: 2 }, first: 1 }, 4]);

        assert.equal(result.valid, true);
        assert.deepEqual(result.errors, []);
    });

    it("should reject different object values and members with the existing error data", () => {
        const schema = { enum: [{ a: 1, b: 2 }] };
        const node = compileSchema(schema);
        for (const data of [{ a: 1, b: 3 }, { a: 1, b: "2" }, { a: 1 }, { a: 1, b: 2, c: 3 }]) {
            const { valid, errors } = node.validate(data, "#/input~1value");

            assert.equal(valid, false);
            assert.equal(errors.length, 1);
            assert.equal(errors[0].code, "enum-error");
            assert.equal(errors[0].data.pointer, "#/input~1value");
            assert.deepEqual(errors[0].data.value, data);
            assert.deepEqual(errors[0].data.values, schema.enum);
            assert.deepEqual(errors[0].data.schema, schema);
        }
    });

    it("should preserve array order and length", () => {
        const node = compileSchema({ enum: [[1, 2]] });

        assert.equal(node.validate([1, 2]).valid, true);
        for (const data of [[2, 1], [1], [1, 2, 3]]) {
            assert.equal(node.validate(data).valid, false);
        }
    });

    it("should preserve primitive equality without coercion", () => {
        for (const [value, different] of [[null, false], [true, 1], [false, 0], [1, "1"], ["one", "two"]]) {
            const node = compileSchema({ enum: [value] });

            assert.equal(node.validate(value).valid, true);
            assert.equal(node.validate(different).valid, false);
        }
    });

    for (const json of ['{"toString":"label"}', '{"valueOf":1}', '{"constructor":{"a":1}}']) {
        it(`should accept equal JSON objects with literal member names: ${json}`, () => {
            const node = compileSchema({ enum: [JSON.parse(json)] });
            const parsed = JSON.parse(json);
            const blank = Object.assign(Object.create(null), parsed);

            assert.equal(node.validate(parsed).valid, true);
            assert.equal(node.validate(blank).valid, true);
            assert.equal(node.validate({ ...parsed, extra: true }).valid, false);
        });
    }

    it("should compare literal member names at nested positions without changing the inputs", () => {
        const schema = { enum: [{ nested: [{ constructor: { a: 1, b: 2 }, toString: "label", valueOf: 1 }] }] };
        const node = compileSchema(schema);
        const data = { nested: [{ valueOf: 1, toString: "label", constructor: { b: 2, a: 1 } }] };
        const before = JSON.stringify({ schema, data });

        assert.equal(node.validate(data).valid, true);
        assert.equal(JSON.stringify({ schema, data }), before);
        for (const different of [
            { ...data.nested[0], toString: "other" },
            { ...data.nested[0], valueOf: 2 },
            { ...data.nested[0], constructor: { b: 3, a: 1 } }
        ]) {
            assert.equal(node.validate({ nested: [different] }).valid, false);
        }
    });

    it("should return error of type enum-error", () => {
        const node = compileSchema({
            type: "string",
            enum: ["a", "b"]
        });

        const { errors } = node.validate("c");

        assert.deepEqual(errors.length, 1, "should have returned a single error");
        const [err] = errors;
        assert.deepEqual(err.code, "enum-error");
        assert(err.message.includes(JSON.stringify(["a", "b"])), "error message should mentioned valid values");
    });
});
