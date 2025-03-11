import { strict as assert } from "assert";

import { compileSchema } from "../compileSchema";

describe("feature : patternProperties : get", () => {
    it("should step into patternProperties", () => {
        const node = compileSchema({
            type: "object",
            patternProperties: { "[0-9][0-9]7": { type: "string", minLength: 1 } }
        });

        const schema = node.get("007")?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });

    it("should NOT step into patternProperties", () => {
        const node = compileSchema({
            type: "object",
            patternProperties: { "[0-9][0-9]7": { type: "string", minLength: 1 } }
        });

        const schema = node.get("[0-9][0-9]7")?.schema;

        assert.deepEqual(schema, undefined);
    });

    it("should return an error for matching pattern and failed validation", () => {
        const errors = compileSchema({
            type: "object",
            patternProperties: { test: { type: "number" } }
        }).validate({ test: "invalid type" });

        assert.equal(errors.length, 1);
        assert.equal(errors[0].code, "type-error");
    });

    it("should validate a correct matching pattern", () => {
        const errors = compileSchema({
            type: "object",
            patternProperties: { test: { type: "number" } }
        }).validate({ test: 10 });

        assert.equal(errors.length, 0);
    });

    it("should return an error for matching regex pattern and failed validation", () => {
        const errors = compileSchema({
            type: "object",
            patternProperties: { "^.est?": { type: "number" } }
        }).validate({ test: "invalid type" });

        assert.equal(errors.length, 1);
        assert.equal(errors[0].code, "type-error");
    });

    it("should invalidate defined property", () => {
        const errors = compileSchema({
            type: "object",
            properties: {
                test: { type: "string" }
            },
            patternProperties: {
                "^.est?": { type: "number" }
            }
        }).validate({ test: "invalid type" });

        assert.equal(errors.length, 1);
        assert.equal(errors[0].code, "type-error");
    });

    it("should return 'no-additional-properties-error' if additional properties are not allowed", () => {
        const errors = compileSchema({
            type: "object",
            properties: {
                test: { type: "string" }
            },
            patternProperties: {
                "^.est?$": { type: "number" }
            },
            additionalProperties: false
        }).validate({ tester: "invalid property" });

        assert.equal(errors.length, 1);
        assert.equal(errors[0].code, "no-additional-properties-error");
    });

    it("should return an error if one of the matching patterns does not validate", () => {
        const errors = compileSchema({
            type: "object",
            patternProperties: {
                "^.est?$": { type: "number" },
                "^.est$": { type: "string" }
            },
            additionalProperties: false
        }).validate({ test: 10 });

        assert.equal(errors.length, 1);
        assert.equal(errors[0].code, "type-error");
    });

    it("should return no error if additional properties are not allowed but valid in patterns", () => {
        const errors = compileSchema({
            type: "object",
            patternProperties: {
                "^.est?$": { type: "number" }
            },
            additionalProperties: false
        }).validate({ tes: 10 });

        assert.equal(errors.length, 0);
    });

    it("should return no error if additional properties validate value", () => {
        const errors = compileSchema({
            type: "object",
            patternProperties: {
                "^.est?$": { type: "number" }
            },
            additionalProperties: { type: "string" }
        }).validate({ anAddedProp: "valid" });

        assert.equal(errors.length, 0);
    });

    it("should return an AdditionalPropertiesError if additional properties do not validate", () => {
        const errors = compileSchema({
            type: "object",
            patternProperties: {
                "^.est?$": { type: "number" }
            },
            additionalProperties: { type: "string" }
        }).validate({ anAddedProp: 100 });

        assert.equal(errors.length, 1);
        assert.equal(errors[0].code, "type-error");
    });
});
