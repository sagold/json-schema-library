import { strict as assert } from "node:assert";
import { compileSchema } from "../../compileSchema";
import { JsonSchema } from "../../types";
import { isPropertyEvaluated } from "../../isPropertyEvaluated";
import { isItemEvaluated } from "../../isItemEvaluated";
import { ValidationPath } from "../../Keyword";
import { extendDraft } from "../../Draft";
import { draft2020 } from "../../draft2020";
import { propertyDependenciesKeyword } from "../../keywords/propertyDependencies";

export const annotationCases: { name: string; schema: JsonSchema; data: unknown; valid: boolean }[] = [];
function cases(name: string, schema: JsonSchema, controls: [unknown, boolean][]) {
    for (const [data, valid] of controls) {
        annotationCases.push({ name: `${name}: ${JSON.stringify(data)}`, schema, data, valid });
    }
}

for (const draft of ["2019-09", "2020-12"]) {
    const $schema = `https://json-schema.org/draft/${draft}/schema`;
    for (const keyword of ["items", "contains"]) {
        cases(`${draft} ignores object ${keyword}`, { $schema, type: "object", [keyword]: { type: "number" }, unevaluatedProperties: false }, [[{}, true], [{ x: 1 }, false]]);
    }
    cases(`${draft} ignores array additionalProperties`, { $schema, type: "array", additionalProperties: { type: "number" }, unevaluatedItems: false }, [[[], true], [[1], false]]);
    cases(`${draft} ignores array properties`, { $schema, properties: { "0": { type: "number" } }, unevaluatedItems: false }, [[[], true], [[1], false]]);
    cases(`${draft} ignores array patternProperties`, { $schema, patternProperties: { "^0$": { type: "number" } }, unevaluatedItems: false }, [[[], true], [[1], false]]);
    cases(`${draft} ignores object tuple`, { $schema, [draft === "2020-12" ? "prefixItems" : "items"]: [{ type: "number" }], unevaluatedProperties: false }, [[{}, true], [{ "0": 1 }, false]]);
    cases(`${draft} no inapplicable keyword`, { $schema, unevaluatedProperties: false }, [[{}, true], [{ x: 1 }, false]]);
    cases(`${draft} empty required`, { $schema, required: [], additionalProperties: true, unevaluatedProperties: false }, [[{}, true], [{ x: 1 }, true]]);
    cases(`${draft} absent required`, { $schema, additionalProperties: true, unevaluatedProperties: false }, [[{ x: 1 }, true]]);
    cases(`${draft} empty required name`, { $schema, required: [""], additionalProperties: true, unevaluatedProperties: false }, [[{ "": 1, x: 2 }, true], [{ x: 2 }, false]]);
    cases(`${draft} entire required list`, { $schema, required: ["", "x"], additionalProperties: true, unevaluatedProperties: false }, [[{ "": 1, x: 2 }, true], [{ "": 1 }, false], [{ x: 2 }, false]]);
    cases(`${draft} failed required predicate`, { $schema, if: { required: ["x", "y"], additionalProperties: true }, unevaluatedProperties: false }, [[{ x: 1, y: 2 }, true], [{ x: 1 }, false]]);
    for (const annotation of [true, {}]) {
        cases(`${draft} dependency ${JSON.stringify(annotation)}`, { $schema, dependentSchemas: { x: { additionalProperties: annotation } }, unevaluatedProperties: false }, [[{ x: 1, y: 2 }, true], [{ y: 2 }, false], [{}, true]]);
        for (const keyword of ["items", "unevaluatedItems"]) {
            cases(`${draft} referenced ${keyword} ${JSON.stringify(annotation)}`, { $schema, $defs: { list: { [keyword]: annotation } }, $ref: "#/$defs/list", unevaluatedItems: false }, [[[1], true], [[], true]]);
        }
        cases(`${draft} reference without item annotations ${JSON.stringify(annotation)}`, { $schema, $defs: { list: annotation }, $ref: "#/$defs/list", unevaluatedItems: false }, [[[1], false], [[], true]]);
    }
    // A bare dependency supplies no annotations; an unrelated member must still be rejected.
    cases(`${draft} bare dependency`, { $schema, dependentSchemas: { x: true }, unevaluatedProperties: false }, [[{ x: 1, y: 2 }, false], [{ y: 2 }, false], [{}, true]]);
    for (const [keyword, valid, invalid, empty] of [
        ["unevaluatedProperties", { "a/b": 1 }, { "a/b": "wrong" }, {}],
        ["unevaluatedItems", [1], ["wrong"], []]
    ] as const) {
        const inner = { [keyword]: { type: "number", deprecated: true } };
        cases(`${draft} direct ${keyword}`, { $schema, ...inner }, [[valid, true], [invalid, false], [empty, true]]);
        for (const applicator of ["allOf", "anyOf", "oneOf", "if", "then", "else", "$ref"]) {
            const nested = applicator === "$ref" ? { $defs: { inner }, $ref: "#/$defs/inner" }
                : applicator === "if" ? { if: inner }
                : applicator === "then" ? { if: true, then: inner }
                : applicator === "else" ? { if: false, else: inner }
                : { [applicator]: [inner] };
            cases(`${draft} ${applicator} nested ${keyword}`, { $schema, ...nested, [keyword]: false }, [[valid, true], [invalid, false], [empty, true]]);
        }
        cases(`${draft} inactive conditional ${keyword}`, { $schema, if: false, then: inner, [keyword]: false }, [[valid, false], [empty, true]]);
        cases(`${draft} failed alternative ${keyword}`, { $schema, anyOf: [{ ...inner, type: "null" }, {}], [keyword]: false }, [[valid, false], [empty, true]]);
    }
    cases(`${draft} nested dependency unevaluatedProperties`, { $schema, dependentSchemas: { x: { unevaluatedProperties: { type: "number" } } }, unevaluatedProperties: false }, [[{ x: 1, y: 2 }, true], [{ x: 1, y: "wrong" }, false], [{ y: 2 }, false]]);
    cases(`${draft} legacy dependency unevaluatedProperties`, { $schema, dependencies: { x: { unevaluatedProperties: { type: "number" } } }, unevaluatedProperties: false }, [[{ x: 1, y: 2 }, true], [{ x: 1, y: "wrong" }, false], [{ y: 2 }, false]]);
}

for (const draft of ["04", "06", "07"]) {
    const $schema = `http://json-schema.org/draft-${draft}/schema#`;
    cases(`draft-${draft} ignores unevaluated keywords`, { $schema, items: { type: "number" }, unevaluatedProperties: false }, [[{ x: 1 }, true], [[1], true], [["wrong"], false]]);
}

describe("evaluated annotations retain keyword applicability", () => {
    for (const { name, schema, data, valid } of annotationCases) {
        it(name, () => assert.equal(compileSchema(schema).validate(data).valid, valid));
    }

    it("retains nested annotations and escaped instance pointers", () => {
        const node = compileSchema({ allOf: [{ unevaluatedProperties: { type: "number", deprecated: true } }], unevaluatedProperties: false });
        const result = node.validate({ "a/b": 1 }, "#/outer");
        assert.equal(result.valid, true);
        assert.deepEqual(result.annotations.map((a) => a.data.pointer), ["#/outer/a~1b"]);
        assert.equal(node.validate({ "a/b": "wrong" }, "#/outer").errors[0].data.pointer, "#/outer/a~1b");
    });

    it("requires every required member before contributing property annotations", () => {
        const node = compileSchema({ required: ["x", "y"], additionalProperties: true });
        assert.equal(isPropertyEvaluated({ node, data: { x: 1 }, key: "x", pointer: "#", path: [] }), false);
        assert.equal(isPropertyEvaluated({ node, data: { x: 1, y: 2 }, key: "x", pointer: "#", path: [] }), true);
    });

    it("keeps item annotation reference traversal local to its branch", () => {
        const node = compileSchema({ $defs: { list: { items: true } }, $ref: "#/$defs/list" });
        const path: ValidationPath = [];
        assert.equal(isItemEvaluated({ node, data: [1], key: 0, pointer: "#", path }), true);
        assert.equal(path.length, 0);
    });

    it("does not collect annotations from a bare boolean dependency", () => {
        const node = compileSchema({ dependentSchemas: { x: true } });
        assert.equal(isPropertyEvaluated({ node, data: { x: 1 }, key: "x", pointer: "#", path: [] }), false);
    });

    it("retains nested unevaluated annotations from the native propertyDependencies applicator", () => {
        const node = compileSchema(
            { propertyDependencies: { kind: { number: { unevaluatedProperties: { type: "number" }, properties: { kind: true } } } }, unevaluatedProperties: false },
            { drafts: [extendDraft(draft2020, { keywords: [propertyDependenciesKeyword] })] }
        );
        assert.equal(node.validate({ kind: "number", x: 1 }).valid, true);
        assert.equal(node.validate({ kind: "number", x: "wrong" }).valid, false);
        assert.equal(node.validate({ kind: "other", x: 1 }).valid, false);
    });

    for (const draft of ["04", "06", "07", "2019-09", "2020-12"]) {
        const $schema = draft.length === 2 ? `http://json-schema.org/draft-${draft}/schema#` : `https://json-schema.org/draft/${draft}/schema`;
        it(`${draft} keeps navigation without data while respecting known instance types`, () => {
            for (const schema of [{ properties: { x: { type: "number" } } }, { patternProperties: { "^x$": { type: "number" } } }, { additionalProperties: { type: "number" } }]) {
                const node = compileSchema({ $schema, ...schema });
                assert.equal(node.getNodeChild("x").node?.schema.type, "number");
                assert.equal(node.getNodeChild("x", { x: 1 }).node?.schema.type, "number");
                assert.equal(node.getNodeChild("x", []).node, undefined);
            }
            for (const schema of [{ items: { type: "number" } }, { [draft === "2020-12" ? "prefixItems" : "items"]: [{ type: "number" }] }]) {
                const node = compileSchema({ $schema, ...schema });
                assert.equal(node.getNodeChild(0).node?.schema.type, "number");
                assert.equal(node.getNodeChild(0, [1]).node?.schema.type, "number");
                assert.equal(node.getNodeChild(0, { "0": 1 }).node, undefined);
            }
        });
    }
});
