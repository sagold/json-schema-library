import { compileSchema } from "../compileSchema";
import { draft2020 } from "../draft2020";
import { strict as assert } from "assert";

describe("keyword : unevaluatedProperties : validation", () => {
    it("should return an error if property is not validate by JSON Schema", () => {
        const { errors } = compileSchema({ type: "object", unevaluatedProperties: false }).validate({ test: "123" });
        assert.equal(errors.length, 1);
    });

    it("should not return error if non validated property is undefined", () => {
        const { errors } = compileSchema({ type: "object", unevaluatedProperties: false }).validate({
            test: undefined
        });
        assert.equal(errors.length, 0);
    });

    it("should not return unevaluated-property-error for a property that fails format validation", () => {
        const node = compileSchema(
            {
                type: "object",
                properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" }
                },
                unevaluatedProperties: false
            },
            { drafts: [draft2020] }
        );

        const { errors } = node.validate({ name: "Alice", email: "not-an-email" });

        const unevaluatedErrors = errors.filter((e) => e.code === "unevaluated-property-error");
        assert.equal(unevaluatedErrors.length, 0, "should not flag email as unevaluated");
    });

    it("should not return unevaluated-property-error for a property that fails type validation", () => {
        const node = compileSchema(
            {
                type: "object",
                properties: {
                    name: { type: "string" },
                    age: { type: "number" }
                },
                unevaluatedProperties: false
            },
            { drafts: [draft2020] }
        );

        const { errors } = node.validate({ name: "Alice", age: "not-a-number" });

        const unevaluatedErrors = errors.filter((e) => e.code === "unevaluated-property-error");
        assert.equal(unevaluatedErrors.length, 0, "should not flag age as unevaluated");
    });

    it("should still return unevaluated-property-error for truly unknown properties", () => {
        const node = compileSchema(
            {
                type: "object",
                properties: {
                    name: { type: "string" }
                },
                unevaluatedProperties: false
            },
            { drafts: [draft2020] }
        );

        const { errors } = node.validate({ name: "Alice", unknown: "value" });

        const unevaluatedErrors = errors.filter((e) => e.code === "unevaluated-property-error");
        assert.equal(unevaluatedErrors.length, 1, "should flag unknown as unevaluated");
    });

    it("should not treat a failed anyOf branch's additionalProperties as evaluating a property", () => {
        const node = compileSchema(
            {
                anyOf: [
                    // annotating but failing branch: additionalProperties:true would mark `x`
                    // as evaluated, but maxProperties:0 makes this branch invalid
                    { additionalProperties: true, maxProperties: 0 },
                    // succeeding but non-annotating branch
                    { type: "object" }
                ],
                unevaluatedProperties: false
            },
            { drafts: [draft2020] }
        );

        const { errors } = node.validate({ x: 1 });

        const unevaluatedErrors = errors.filter((e) => e.code === "unevaluated-property-error");
        assert.equal(unevaluatedErrors.length, 1, "failed anyOf branch must not suppress unevaluatedProperties");
    });

    it("should not treat a failed oneOf branch's additionalProperties as evaluating a property", () => {
        const node = compileSchema(
            {
                oneOf: [
                    { additionalProperties: true, maxProperties: 0 },
                    { type: "object" }
                ],
                unevaluatedProperties: false
            },
            { drafts: [draft2020] }
        );

        const { errors } = node.validate({ x: 1 });

        const unevaluatedErrors = errors.filter((e) => e.code === "unevaluated-property-error");
        assert.equal(unevaluatedErrors.length, 1, "failed oneOf branch must not suppress unevaluatedProperties");
    });

    it("should still evaluate a property through a successful anyOf branch", () => {
        const node = compileSchema(
            {
                anyOf: [{ additionalProperties: true }],
                unevaluatedProperties: false
            },
            { drafts: [draft2020] }
        );

        const { errors } = node.validate({ x: 1 });

        const unevaluatedErrors = errors.filter((e) => e.code === "unevaluated-property-error");
        assert.equal(unevaluatedErrors.length, 0, "successful anyOf branch must still evaluate the property");
    });
});
