import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { extendDraft } from "../../Draft";
import { draft2020 } from "../../draft2020";
import { draftEditor } from "../../draftEditor";
import { isJsonError } from "../../types";

describe("issue#128 - annotations must not change branch validity", () => {
    it("accepts and reduces a deprecated oneOf branch", () => {
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

        assert.equal(node.validate({ sortable: "true" }).valid, true);
        assert.equal(node.validate({ sortable: "maybe" }).errors[0]?.code, "one-of-error");
        assert.deepEqual(node.properties?.sortable.reduceNode("true").node?.schema, {
            enum: ["true", "false"],
            deprecated: true
        });
        const ambiguous = compileSchema({ oneOf: [{ type: "string", deprecated: true }, { type: "string" }] });
        assert.equal(ambiguous.validate("true").errors[0]?.code, "multiple-one-of-error");
    });

    it("selects then when an annotated anyOf predicate matches", () => {
        const node = compileSchema({
            if: { anyOf: [{ type: "string", deprecated: true }, { type: "number" }], deprecated: true },
            then: { const: "old" },
            else: { const: false }
        });

        assert.equal(node.validate("old").valid, true);
        assert.equal(node.validate("other").valid, false);
        assert.equal(node.validate(false).valid, true);
        assert.deepEqual(node.reduceNode("old").node?.schema, { const: "old" });
        assert.equal(node.if?.reduceNode("old").node?.schema.type, "string");
    });

    it("rejects data matching an annotated not subschema", () => {
        const node = compileSchema({ not: { type: "string", deprecated: true } });

        assert.equal(node.validate("old").errors[0]?.code, "not-error");
        assert.equal(node.validate(42).valid, true);
    });

    it("validates and reduces an annotated oneOf declarator", () => {
        const node = compileSchema({
            oneOfProperty: "kind",
            oneOf: [
                { properties: { kind: { const: "old", deprecated: true } } },
                { properties: { kind: { const: "new" } } }
            ]
        });
        const data = { kind: "old" };

        assert.equal(node.validate(data).valid, true);
        assert.deepEqual(node.reduceNode(data).node?.schema, {
            properties: { kind: { const: "old", deprecated: true } }
        });
    });

    it("counts annotated matching properties when reducing fuzzy oneOf", () => {
        const node = compileSchema(
            {
                oneOf: [
                    { properties: { value: { type: "number" } }, required: ["missing"] },
                    { properties: { value: { type: "string", deprecated: true } }, required: ["missing"] }
                ]
            },
            { drafts: [draftEditor] }
        );

        assert.deepEqual(node.reduceNode({ value: "old" }).node?.schema, {
            properties: { value: { type: "string", deprecated: true } },
            required: ["missing"]
        });
    });

    it("does not treat pending async validation as a matching branch", () => {
        const draft = extendDraft(draft2020, {
            keywords: [
                {
                    id: "async-error",
                    keyword: "asyncError",
                    addValidate: (node) => node.schema.asyncError === true,
                    validate: async ({ node, pointer, data }) => [
                        node.createError("type-error", { schema: node.schema, pointer, value: data })
                    ]
                }
            ]
        });
        const result = compileSchema({ oneOf: [{ asyncError: true }] }, { drafts: [draft] }).validate("old");

        assert.equal(result.valid, false);
        assert.equal(result.errors[0]?.code, "one-of-error");
    });

    it("ignores annotations in contains, propertyNames and unevaluated checks", () => {
        assert.equal(
            compileSchema({ contains: { type: "string", deprecated: true }, minContains: 2 }).validate(["old", "new"])
                .valid,
            true
        );

        const validationError = compileSchema({ propertyNames: { deprecated: true, minLength: 2 } }).validate({ x: 0 })
            .errors[0]?.data.validationError;
        assert(isJsonError(validationError));
        assert.equal(validationError.code, "min-length-error");

        assert.equal(
            compileSchema({
                if: { deprecated: true },
                then: { properties: { value: { type: "string" } } },
                unevaluatedProperties: false
            }).validate({ value: "old" }).valid,
            true
        );
    });
});
