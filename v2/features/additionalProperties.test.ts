import { strict as assert } from "assert";
import { Draft2019 } from "../../lib/draft2019";
import { Draft } from "../../lib/draft";
import { compileSchema } from "../compileSchema";

describe("feature : additionalProperties : get", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it("should step into additionalProperties", () => {
        const node = compileSchema(draft, {
            type: "object",
            additionalProperties: { type: "string", minLength: 1 }
        });

        const schema = node.get("header", { header: "huhu" })?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });

    it("should NOT step into additionalProperties if false", () => {
        const node = compileSchema(draft, {
            type: "object",
            additionalProperties: false
        });

        const schema = node.get("header", { header: "huhu" })?.schema;

        assert.deepEqual(schema, undefined);
    });

    it("should create a schema if additionalProperties is true", () => {
        const node = compileSchema(draft, {
            type: "object",
            additionalProperties: true
        });

        const schema = node.get("header", { header: "huhu" })?.schema;

        assert.deepEqual(schema, { type: "string" });
    });

    it("should apply additionalProperties from allOf", () => {
        const node = compileSchema(draft, {
            type: "object",
            allOf: [{ additionalProperties: true }]
        });

        const schema = node.get("header", { header: "huhu" })?.schema;

        assert.deepEqual(schema, { type: "string" });
    });

    it("should override additionalProperties from allOf", () => {
        const node = compileSchema(draft, {
            type: "object",
            additionalProperties: { type: "number" },
            allOf: [{ additionalProperties: { type: "boolean" } }]
        });

        const schema = node.get("header")?.schema;

        assert.deepEqual(schema, { type: "boolean" });
    });
});

describe("feature : additionalProperties : validate", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    // from v1
    it("should return AdditionalPropertiesError for an additional property", () => {
        const errors = compileSchema(draft, { type: "object", additionalProperties: false }).validate({ a: 1 });
        assert.deepEqual(errors.length, 1);
        assert.deepEqual(errors[0].type, "error");
    });

    it("should return all AdditionalPropertiesErrors", () => {
        const errors = compileSchema(draft, { type: "object", additionalProperties: false }).validate({ a: 1, b: 2 });
        assert.deepEqual(errors.length, 2);
        assert.deepEqual(errors[0].name, "NoAdditionalPropertiesError");
        assert.deepEqual(errors[1].name, "NoAdditionalPropertiesError");
    });

    it("should be valid if 'additionalProperties' is 'true'", () => {
        const errors = compileSchema(draft, { type: "object", additionalProperties: true }).validate({ a: 1 });
        assert.deepEqual(errors.length, 0);
    });

    // it("should be valid if value matches 'additionalProperties' schema", () => {
    //     const errors = compileSchema(
    //         draft,
    //         { a: 1 },
    //         {
    //             type: "object",
    //             properties: { b: { type: "string" } },
    //             additionalProperties: { type: "number" }
    //         }
    //     );
    //     expect(errors).to.have.length(0);
    // });

    // it("should only validate existing definition in 'properties'", () => {
    //     const errors = compileSchema(
    //         draft,
    //         { b: "i am valid" },
    //         {
    //             type: "object",
    //             properties: { b: { type: "string" } },
    //             additionalProperties: { type: "number" }
    //         }
    //     );
    //     expect(errors).to.have.length(0);
    // });

    // it("should return error if value does not match 'additionalProperties' schema", () => {
    //     const errors = compileSchema(
    //         draft,
    //         { a: 1 },
    //         {
    //             type: "object",
    //             properties: { b: { type: "string" } },
    //             additionalProperties: { type: "string" }
    //         }
    //     );
    //     expect(errors).to.have.length(1);
    //     expect(errors[0].type).to.eq("error");
    // });

    // it("should be valid if value matches 'additionalProperties' oneOf schema", () => {
    //     const errors = compileSchema(
    //         draft,
    //         { a: 1 },
    //         {
    //             type: "object",
    //             properties: { b: { type: "string" } },
    //             additionalProperties: {
    //                 oneOf: [{ type: "number" }]
    //             }
    //         }
    //     );
    //     expect(errors).to.have.length(0);
    // });

    // it("should be invalid if value does not match 'additionalProperties' in oneOf schema", () => {
    //     const errors = compileSchema(
    //         draft,
    //         { a: 1 },
    //         {
    //             type: "object",
    //             properties: { b: { type: "string" } },
    //             additionalProperties: {
    //                 oneOf: [{ type: "string" }]
    //             }
    //         }
    //     );
    //     expect(errors).to.have.length(1);
    // });

    // it("should be ignore properties that are matched by patternProperties", () => {
    //     const errors = compileSchema(
    //         draft,
    //         { a: 1 },
    //         {
    //             type: "object",
    //             properties: { b: { type: "string" } },
    //             patternProperties: {
    //                 "^.$": { type: "number" }
    //             },
    //             additionalProperties: {
    //                 oneOf: [{ type: "string" }]
    //             }
    //         }
    //     );
    //     expect(errors).to.have.length(0);
    // });

    // it("should be invalid if value does match multiple 'additionalProperties' in oneOf schema", () => {
    //     const errors = compileSchema(
    //         draft,
    //         { a: "a string" },
    //         {
    //             type: "object",
    //             properties: { b: { type: "string" } },
    //             additionalProperties: {
    //                 oneOf: [{ type: "string" }, { type: "string" }]
    //             }
    //         }
    //     );
    //     expect(errors).to.have.length(1);
    //     expect(errors[0].name).to.eq("AdditionalPropertiesError");
    // });
});
