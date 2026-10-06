import { strict as assert } from "assert";

import { compileSchema } from "../compileSchema";

describe("keyword : const : validate", () => {
    for (const [json, reordered, different] of [
        ['{"toString":"label","a":1}', '{"a":1,"toString":"label"}', '{"a":1,"toString":"other"}'],
        ['{"valueOf":1,"a":2}', '{"a":2,"valueOf":1}', '{"a":2,"valueOf":2}'],
        [
            '{"nested":[{"constructor":{"a":1,"b":2}}]}',
            '{"nested":[{"constructor":{"b":2,"a":1}}]}',
            '{"nested":[{"constructor":{"b":3,"a":1}}]}'
        ]
    ]) {
        it(`should compare JSON member names as data: ${json}`, () => {
            const schema = { const: JSON.parse(json) };
            const node = compileSchema(schema);

            assert.equal(node.validate(JSON.parse(reordered)).valid, true);
            const data = JSON.parse(different);
            const { valid, errors } = node.validate(data, "#/input");
            assert.equal(valid, false);
            assert.equal(errors.length, 1);
            assert.equal(errors[0].code, "const-error");
            assert.equal(errors[0].data.pointer, "#/input");
            assert.deepEqual(errors[0].data.value, data);
            assert.deepEqual(errors[0].data.expected, schema.const);
        });
    }

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
