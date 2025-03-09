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

    it("should return undefined if additionalProperties is true", () => {
        const node = compileSchema(draft, {
            type: "object",
            additionalProperties: true
        });

        const schema = node.get("header", { header: "huhu" })?.schema;

        assert.deepEqual(schema, undefined);
    });

    it("should apply additionalProperties from allOf", () => {
        const node = compileSchema(draft, {
            type: "object",
            allOf: [{ additionalProperties: true }]
        });

        const schema = node.get("header", { header: "huhu" })?.schema;

        assert.deepEqual(schema, undefined);
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

    it("should return no-additional-properties-error if no schema is given for an additional property", () => {
        const errors = compileSchema(draft, { type: "object", additionalProperties: false }).validate({ a: 1 });
        assert.deepEqual(errors.length, 1);
    });

    it("should return error for property not in properties schema", () => {
        const errors = compileSchema(draft, {
            $schema: "https://json-schema.org/draft/2019-09/schema",
            properties: { foo: { $ref: "#" } },
            additionalProperties: false
        }).validate({ bar: false });

        assert.deepEqual(errors.length, 1);
    });

    it("should return all no-additional-properties-error", () => {
        const errors = compileSchema(draft, {
            type: "object",
            patternProperties: {
                dummy: false
            },
            additionalProperties: false
        }).validate({
            a: 1,
            b: 2
        });
        assert.deepEqual(errors.length, 2);
        assert.deepEqual(errors[0].code, "no-additional-properties-error");
        assert.deepEqual(errors[1].code, "no-additional-properties-error");
    });

    it("should be valid if 'additionalProperties' is 'true'", () => {
        const errors = compileSchema(draft, { type: "object", additionalProperties: true }).validate({ a: 1 });
        assert.deepEqual(errors.length, 0);
    });

    it("should be valid if value matches 'additionalProperties' schema", () => {
        const errors = compileSchema(draft, {
            type: "object",
            properties: { b: { type: "string" } },
            additionalProperties: { type: "number" }
        }).validate({ a: 1 });
        assert.deepEqual(errors.length, 0);
    });

    it("should only validate existing definition in 'properties'", () => {
        const errors = compileSchema(draft, {
            type: "object",
            properties: { b: { type: "string" } },
            additionalProperties: { type: "number" }
        }).validate({ b: "i am valid" });
        assert.deepEqual(errors.length, 0);
    });

    it("should return error if value does not match 'additionalProperties' schema", () => {
        const errors = compileSchema(draft, {
            type: "object",
            properties: { b: { type: "string" } },
            additionalProperties: { type: "string" }
        }).validate({ a: 1 });
        assert.deepEqual(errors.length, 1);
        assert.deepEqual(errors[0].type, "error");
    });

    it("should be valid if value matches 'additionalProperties' oneOf schema", () => {
        const errors = compileSchema(draft, {
            type: "object",
            properties: { b: { type: "string" } },
            additionalProperties: {
                oneOf: [{ type: "number" }]
            }
        }).validate({ a: 1 });
        assert.deepEqual(errors.length, 0);
    });

    it("should be invalid if value does not match 'additionalProperties' in oneOf schema", () => {
        const errors = compileSchema(draft, {
            type: "object",
            properties: { b: { type: "string" } },
            additionalProperties: {
                oneOf: [{ type: "string" }]
            }
        }).validate({ a: 1 });
        assert.deepEqual(errors.length, 1);
    });

    it("should be ignore properties that are matched by patternProperties", () => {
        const errors = compileSchema(draft, {
            type: "object",
            properties: { b: { type: "string" } },
            patternProperties: {
                "^.$": { type: "number" }
            },
            additionalProperties: {
                oneOf: [{ type: "string" }]
            }
        }).validate({ a: 1 });
        assert.deepEqual(errors.length, 0);
    });

    it("should be invalid if value does match multiple 'additionalProperties' in oneOf schema", () => {
        const errors = compileSchema(draft, {
            type: "object",
            properties: { b: { type: "string" } },
            additionalProperties: {
                oneOf: [{ type: "string" }, { type: "string" }]
            }
        }).validate({ a: "a string" });
        assert.deepEqual(errors.length, 1);
        // assert.deepEqual(errors[0].code, "additional-properties-error");
    });
});
