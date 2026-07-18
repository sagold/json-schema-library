import { compileSchema } from "../compileSchema";
import { draft2020 } from "../draft2020";
import { strict as assert } from "assert";

describe("keyword : unevaluatedItems : validation", () => {
    it("should not treat a failed anyOf branch's items:true as evaluating an item", () => {
        const node = compileSchema(
            {
                anyOf: [
                    // annotating but failing branch: items:true would mark index 0 as
                    // evaluated, but maxItems:0 makes this branch invalid
                    { items: true, maxItems: 0 },
                    // succeeding but non-annotating branch
                    { type: "array" }
                ],
                unevaluatedItems: false
            },
            { drafts: [draft2020] }
        );

        const { errors } = node.validate([1]);

        const unevaluatedErrors = errors.filter((e) => e.code === "unevaluated-items-error");
        assert.equal(unevaluatedErrors.length, 1, "failed anyOf branch must not suppress unevaluatedItems");
    });

    it("should not treat a failed oneOf branch's items:true as evaluating an item", () => {
        const node = compileSchema(
            {
                oneOf: [
                    { items: true, maxItems: 0 },
                    { type: "array" }
                ],
                unevaluatedItems: false
            },
            { drafts: [draft2020] }
        );

        const { errors } = node.validate([1]);

        const unevaluatedErrors = errors.filter((e) => e.code === "unevaluated-items-error");
        assert.equal(unevaluatedErrors.length, 1, "failed oneOf branch must not suppress unevaluatedItems");
    });

    it("should still evaluate an item through a successful anyOf branch", () => {
        const node = compileSchema(
            {
                anyOf: [{ items: true }],
                unevaluatedItems: false
            },
            { drafts: [draft2020] }
        );

        const { errors } = node.validate([1]);

        const unevaluatedErrors = errors.filter((e) => e.code === "unevaluated-items-error");
        assert.equal(unevaluatedErrors.length, 0, "successful anyOf branch must still evaluate the item");
    });
});
