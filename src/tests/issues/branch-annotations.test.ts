import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { isJsonError, JsonSchema } from "../../types";

const $schema = "https://json-schema.org/draft/2020-12/schema";

describe("branch validity and annotations", () => {
    // The two false accepts published on PR118, with corresponding array controls.
    for (const [name, predicate, data, empty, unevaluated] of [
        ["properties", { properties: { value: true }, maxProperties: 0 }, { value: 1 }, {}, "unevaluatedProperties"],
        ["items", { items: true, maxItems: 0 }, [1], [], "unevaluatedItems"]
    ] as const) {
        it(`discards failed if evaluations of ${name}`, () => {
            const node = compileSchema({
                $schema,
                if: predicate,
                else: { type: name === "properties" ? "object" : "array" },
                [unevaluated]: false
            });
            const result = node.validate(data);
            assert.equal(result.valid, false);
            assert.equal(result.errors[0].data.pointer, name === "properties" ? "#/value" : "#/0");
            assert.equal(node.validate(empty).valid, true);
        });

        it(`retains successful if evaluations of ${name}`, () => {
            const node = compileSchema({
                $schema,
                if: name === "properties" ? { properties: { value: true }, deprecated: true } : { items: true, deprecated: true },
                then: true,
                else: false,
                [unevaluated]: false
            });
            const result = node.validate(data);
            assert.equal(result.valid, true);
            assert.equal(result.annotations[0]?.code, "deprecated-warning");
        });
    }

    it("chooses then for an annotating if predicate (PR118 comment)", () => {
        const node = compileSchema({ $schema, if: { deprecated: true }, then: false, else: true });
        for (const data of [1, [1]]) {
            const result = node.validate(data);
            assert.equal(result.valid, false);
            assert.equal(result.errors[0].code, "invalid-data-error");
        }
    });

    it("retains annotations from if without then or else", () => {
        const result = compileSchema({ $schema, if: { deprecated: true } }).validate(1);
        assert.equal(result.valid, true);
        assert.equal(result.annotations[0]?.code, "deprecated-warning");
    });

    it("retains only the selected conditional branch's annotations", () => {
        const node = compileSchema({
            $schema,
            if: { type: "string", deprecated: true, deprecatedMessage: "predicate" },
            then: { deprecated: true, deprecatedMessage: "then" },
            else: { deprecated: true, deprecatedMessage: "else" }
        });
        assert.deepEqual(node.validate("x").annotations.map((a) => a.message), ["predicate", "then"]);
        assert.deepEqual(node.validate(1).annotations.map((a) => a.message), ["else"]);
    });

    for (const applicator of ["anyOf", "oneOf"]) {
        for (const kind of ["object", "array"]) {
            const data = kind === "object" ? { x: 1 } : [1];
            const empty = kind === "object" ? {} : [];
            const unevaluated = kind === "object" ? "unevaluatedProperties" : "unevaluatedItems";
            const evaluates = kind === "object" ? { additionalProperties: true } : { items: true };
            const fails = kind === "object" ? { maxProperties: 0 } : { maxItems: 0 };
            it(`${applicator} counts successful annotating ${kind} branches as evaluated`, () => {
                const node = compileSchema({
                    $schema,
                    [applicator]: [{ ...evaluates, deprecated: true }, { type: applicator === "anyOf" ? kind : "null" }],
                    [unevaluated]: false
                });
                const result = node.validate(data);
                assert.equal(result.valid, true);
                assert.equal(result.annotations[0]?.code, "deprecated-warning");
                assert.equal(node.validate(empty).valid, true);
            });

            it(`${applicator} ignores failed annotating ${kind} branches`, () => {
                const node = compileSchema({
                    $schema,
                    [applicator]: [{ ...evaluates, ...fails, deprecated: true }, { type: kind }],
                    [unevaluated]: false
                });
                const result = node.validate(data);
                assert.equal(result.valid, false);
                assert.equal(result.errors[0].code, kind === "object" ? "unevaluated-property-error" : "unevaluated-items-error");
                assert.deepEqual(result.annotations, []);
            });
        }
    }

    it("accepts the deprecated enum branch in issue128 and keeps its escaped pointer", () => {
        const node = compileSchema({
            type: "object",
            properties: {
                sortable: {
                    oneOf: [
                        { enum: ["true", "false"], deprecated: true },
                        { type: "boolean" },
                        { type: "array", items: { type: "string" } }
                    ]
                }
            }
        });
        const result = node.validate({ sortable: "true" }, "#/a~1b");
        assert.equal(result.valid, true);
        assert.equal(result.annotations[0]?.data.pointer, "#/a~1b/sortable");
        assert.equal(node.validate({ sortable: true }).valid, true);
        assert.equal(node.validate({ sortable: ["true"] }).valid, true);
        const invalid = node.validate({ sortable: "other" });
        assert.equal(invalid.valid, false);
        assert.equal(invalid.errors[0].code, "one-of-error");
        const branchErrors = invalid.errors[0].data.errors;
        assert(Array.isArray(branchErrors) && branchErrors.length > 0);
    });

    it("collects annotations from every successful anyOf branch, excluding failures", () => {
        const result = compileSchema({
            anyOf: [
                { type: "string", deprecated: true, deprecatedMessage: "failed" },
                { deprecated: true, deprecatedMessage: "first" },
                { deprecated: true, deprecatedMessage: "second" }
            ]
        }).validate(1);
        assert.equal(result.valid, true);
        assert.deepEqual(result.annotations.map((a) => a.message), ["first", "second"]);
        assert.equal(compileSchema({ anyOf: [{ type: "string", deprecated: true }] }).validate(1).valid, false);
    });

    it("counts annotated oneOf branches when rejecting multiple matches", () => {
        const result = compileSchema({ oneOf: [{ deprecated: true }, true] }).validate(1);
        assert.equal(result.valid, false);
        assert.equal(result.errors[0].code, "multiple-one-of-error");
        assert.deepEqual(result.annotations, []);
    });

    it("not rejects a successful annotated subschema and discards its annotations", () => {
        const node = compileSchema({ not: { type: "string", deprecated: true } });
        const invalid = node.validate("x");
        assert.equal(invalid.valid, false);
        assert.equal(invalid.errors[0].code, "not-error");
        const valid = node.validate(1);
        assert.equal(valid.valid, true);
        assert.deepEqual(valid.annotations, []);
    });

    it("contains counts annotated matches, retains item paths and enforces its bounds", () => {
        const node = compileSchema({ $schema, contains: { type: "number", deprecated: true }, minContains: 1, maxContains: 2 });
        const result = node.validate([1, "skip", 2], "#/a~1b");
        assert.equal(result.valid, true);
        assert.deepEqual(result.annotations.map((a) => a.data.pointer), ["#/a~1b/0", "#/a~1b/2"]);
        assert.equal(node.validate(["skip"]).errors[0].code, "contains-min-error");
        assert.equal(node.validate([1, 2, 3]).errors[0].code, "contains-max-error");
    });

    it("contains annotated matches contribute to unevaluatedItems", () => {
        const node = compileSchema({ $schema, contains: { type: "number", deprecated: true }, unevaluatedItems: false });
        assert.equal(node.validate([1]).valid, true);
        const result = node.validate([1, "extra"]);
        assert.equal(result.valid, false);
        assert.equal(result.errors[0].data.pointer, "#/1");
    });

    it("annotated additional properties are evaluated", () => {
        const node = compileSchema({
            $schema,
            additionalProperties: { type: "number", deprecated: true },
            unevaluatedProperties: false
        });
        const result = node.validate({ "a/b": 1 });
        assert.equal(result.valid, true);
        assert.equal(result.annotations[0]?.data.pointer, "#/a~1b");
        assert.equal(node.validate({ "a/b": "wrong" }).valid, false);
    });

    it("an annotated prefix item is evaluated", () => {
        const node = compileSchema({ $schema, prefixItems: [{ deprecated: true }], unevaluatedItems: false });
        assert.equal(node.validate([1]).valid, true);
        assert.equal(node.validate([1, 2]).valid, false);
    });

    for (const applicator of ["anyOf", "oneOf", "if", "not", "contains"]) {
        it(`${applicator} preserves dynamic-reference scope through annotation checks`, () => {
            const ref = { $dynamicRef: "#item" };
            const list: JsonSchema = applicator === "contains"
                ? { contains: ref }
                : { items: applicator === "if" ? { if: ref, then: true, else: false } : { [applicator]: applicator === "not" ? ref : [ref] } };
            const node = compileSchema({
                $schema,
                $id: "https://example.com/branch-scope/root",
                $ref: "list",
                $defs: {
                    item: { $dynamicAnchor: "item", type: "string", deprecated: true },
                    list: { $id: "list", ...list, $defs: { item: { $dynamicAnchor: "item" } } }
                }
            });
            assert.equal(node.validate(["ok"], "#/a~1b").valid, applicator !== "not");
            assert.equal(node.validate([1], "#/a~1b").valid, applicator === "not");
            if (applicator !== "not") {
                assert.equal(node.validate(["ok"], "#/a~1b").annotations[0]?.data.pointer, "#/a~1b/0");
            }
        });
    }

    it("propertyNames accepts names with successful annotations", () => {
        const node = compileSchema({ propertyNames: { type: "string", minLength: 2, deprecated: true } });
        const result = node.validate({ valid: 1 });
        assert.equal(result.valid, true);
        assert.deepEqual(result.errors, []);
    });

    it("propertyNames reports the actual error after an annotation", () => {
        const node = compileSchema({ propertyNames: { type: "string", minLength: 2, deprecated: true } });
        for (const name of ["x", "/"]) {
            const result = node.validate({ [name]: 1 }, "#/a~1b");
            assert.equal(result.valid, false);
            assert.equal(result.errors.length, 1);
            const error = result.errors[0];
            assert.equal(error.code, "invalid-property-name-error");
            assert.equal(error.data.pointer, "#/a~1b");
            assert.equal(error.data.property, name);
            const validationError = error.data.validationError;
            assert(isJsonError(validationError));
            assert.equal(validationError.code, "min-length-error");
            assert.equal(validationError.data.pointer, name === "/" ? "#/a~1b/~1" : "#/a~1b/x");
        }
    });

    it("draft2019 unevaluatedItems accepts annotated tuple items and rejects invalid or extra items", () => {
        const node = compileSchema({
            $schema: "https://json-schema.org/draft/2019-09/schema",
            items: [{ type: "number", deprecated: true }],
            unevaluatedItems: false
        });
        const result = node.validate([1], "#/a~1b");
        assert.equal(result.valid, true);
        assert.deepEqual(result.errors, []);
        assert.equal(result.annotations[0]?.data.pointer, "#/a~1b/0");
        const invalid = node.validate(["wrong"]);
        assert.equal(invalid.valid, false);
        assert.equal(invalid.errors[0].code, "type-error");
        const extra = node.validate([1, 2]);
        assert.equal(extra.valid, false);
        assert.equal(extra.errors[0].code, "unevaluated-items-error");
        assert.equal(extra.errors[0].data.pointer, "#/1");
    });

    it("draft2019 unevaluatedItems uses successful annotated if evaluations only", () => {
        const node = compileSchema({
            $schema: "https://json-schema.org/draft/2019-09/schema",
            if: { items: [{ type: "number" }], deprecated: true },
            unevaluatedItems: false
        });
        const result = node.validate([1]);
        assert.equal(result.valid, true);
        assert.deepEqual(result.errors, []);
        assert.equal(result.annotations[0]?.code, "deprecated-warning");
        const invalid = node.validate(["wrong"]);
        assert.equal(invalid.valid, false);
        assert.equal(invalid.errors[0].code, "unevaluated-items-error");
        assert.equal(invalid.errors[0].data.pointer, "#/0");
        const extra = node.validate([1, 2]);
        assert.equal(extra.valid, false);
        assert.equal(extra.errors[0].code, "unevaluated-items-error");
        assert.equal(extra.errors[0].data.pointer, "#/1");
    });

    it("keeps invalid annotation schemas as schema errors", () => {
        assert.throws(() => compileSchema({ oneOf: [{ deprecated: "yes" }] }, { throwOnInvalidSchema: true }));
        assert.equal(compileSchema({ deprecated: true }).validate(1).annotations[0]?.code, "deprecated-warning");
    });

    it("oneOf declarators accept annotated matches for validation and reduction", () => {
        const node = compileSchema({
            oneOfProperty: "kind",
            oneOf: [
                { properties: { kind: { const: "old", deprecated: true } }, title: "selected" },
                { properties: { kind: { const: "new" } }, title: "other" }
            ]
        });
        const result = node.validate({ kind: "old" }, "#/a~1b");
        assert.equal(result.valid, true);
        assert.equal(result.annotations[0]?.data.pointer, "#/a~1b/kind");
        assert.equal(node.validate({ kind: "unknown" }).valid, false);
        assert.equal(node.reduceNode({ kind: "old" }).node?.schema.title, "selected");
    });

    for (const [name, schema] of [
        ["if", { if: { deprecated: true }, then: { title: "selected" }, else: { title: "wrong" } }],
        ["anyOf", { anyOf: [{ deprecated: true, title: "selected" }, { type: "string" }] }],
        ["oneOf", { oneOf: [{ deprecated: true, title: "selected" }, { type: "string" }] }]
    ] as const) {
        it(`${name} reduction uses annotation-aware validity`, () => {
            const { node, error } = compileSchema(schema).reduceNode(1);
            assert.equal(error, undefined);
            assert.equal(node?.schema.title, "selected");
        });
    }
});
