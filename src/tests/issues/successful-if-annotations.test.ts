import { strict as assert } from "node:assert";
import { compileSchema } from "../../compileSchema";
import { JsonSchema } from "../../types";

export const successfulIfCases: { name: string; schema: JsonSchema; data: unknown; valid: boolean }[] = [];

for (const draft of ["2019-09", "2020-12"]) {
    const $schema = `https://json-schema.org/draft/${draft}/schema`;
    const tuple = { [draft === "2020-12" ? "prefixItems" : "items"]: [{ type: "number" }] };
    const predicates: { name: string; type: "array" | "object"; schema: JsonSchema; controls: [unknown, boolean][] }[] = [
        { name: "boolean items", type: "array", schema: { items: true }, controls: [[[1], true], [[], true]] },
        { name: "empty items", type: "array", schema: { items: {} }, controls: [[[1], true], [[], true]] },
        {
            name: "numeric items", type: "array", schema: { items: { type: "number", deprecated: true } },
            controls: [[[1], true], [["wrong"], false], [[], true]]
        },
        { name: "boolean additionalProperties", type: "object", schema: { additionalProperties: true }, controls: [[{ x: 1 }, true], [{}, true]] },
        { name: "empty additionalProperties", type: "object", schema: { additionalProperties: {} }, controls: [[{ x: 1 }, true], [{}, true]] },
        {
            name: "numeric additionalProperties", type: "object",
            schema: { additionalProperties: { type: "number", deprecated: true } },
            controls: [[{ "a/b": 1 }, true], [{ "a/b": "wrong" }, false], [{}, true]]
        },
        { name: "tuple", type: "array", schema: tuple, controls: [[[1], true], [[1, 2], false], [["wrong"], false], [[], true]] },
        {
            name: "referenced tuple", type: "array", schema: { $ref: "#/$defs/tuple" },
            controls: [[[1], true], [[1, 2], false], [["wrong"], false], [[], true]]
        },
        {
            name: "failed whole-array condition", type: "array", schema: { items: {}, maxItems: 0 },
            controls: [[[1], false], [[], true]]
        },
        {
            name: "failed whole-object condition", type: "object", schema: { additionalProperties: {}, maxProperties: 0 },
            controls: [[{ x: 1 }, false], [{}, true]]
        },
        { name: "unannotating array condition", type: "array", schema: { allOf: [true] }, controls: [[[1], false], [[], true]] },
        { name: "unannotating object condition", type: "object", schema: { allOf: [true] }, controls: [[{ x: 1 }, false], [{}, true]] }
    ];
    for (const withThen of [false, true]) {
        for (const predicate of predicates) {
            const schema: JsonSchema = {
                $schema,
                $defs: { tuple },
                if: predicate.schema,
                ...(withThen ? { then: { type: predicate.type } } : {}),
                [predicate.type === "array" ? "unevaluatedItems" : "unevaluatedProperties"]: false
            };
            for (const [data, valid] of predicate.controls) {
                successfulIfCases.push({
                    name: `${draft} ${predicate.name} ${withThen ? "with" : "without"} then: ${JSON.stringify(data)}`,
                    schema, data, valid
                });
            }
        }
    }
}

describe("successful if evaluated-member annotations", () => {
    for (const { name, schema, data, valid } of successfulIfCases) {
        it(name, () => assert.equal(compileSchema(schema).validate(data).valid, valid));
    }

    it("retains successful condition annotations once, with escaped property pointers", () => {
        const node = compileSchema({
            if: { additionalProperties: { type: "number", deprecated: true } },
            unevaluatedProperties: false
        });
        const result = node.validate({ "a/b": 1 }, "#/outer");
        assert.equal(result.valid, true);
        assert.deepEqual(result.annotations.map((a) => a.data.pointer), ["#/outer/a~1b"]);
        const invalid = node.validate({ "a/b": "wrong" }, "#/outer");
        assert.equal(invalid.valid, false);
        assert.deepEqual(invalid.annotations, []);
        assert.equal(invalid.errors[0].data.pointer, "#/outer/a~1b");
    });

    it("still validates then after a successful annotating condition", () => {
        const node = compileSchema({ if: { items: {} }, then: { maxItems: 0 }, unevaluatedItems: false });
        assert.equal(node.validate([]).valid, true);
        const invalid = node.validate([1]);
        assert.equal(invalid.valid, false);
        assert.equal(invalid.errors[0].code, "max-items-error");
    });
});
