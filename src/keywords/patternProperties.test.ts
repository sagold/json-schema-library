import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";

describe("keyword : patternProperties : get", () => {
    it("should step into patternProperties", () => {
        const node = compileSchema({
            type: "object",
            patternProperties: { "[0-9][0-9]7": { type: "string", minLength: 1 } }
        });

        // @todo evaluate if we should pass this property to reduce to identify schema without data
        const schema = node.get("007", { "007": undefined })?.node?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });

    it("should NOT step into patternProperties", () => {
        const node = compileSchema({
            type: "object",
            patternProperties: { "[0-9][0-9]7": { type: "string", minLength: 1 } }
        });

        const schema = node.get("[0-9][0-9]7")?.node?.schema;

        assert.deepEqual(schema, undefined);
    });
});

describe("keyword : patternProperties : validate", () => {
    it("should return an error for matching pattern and failed validation", () => {
        const { errors } = compileSchema({
            type: "object",
            patternProperties: { test: { type: "number" } }
        }).validate({ test: "invalid type" });

        assert.equal(errors.length, 1);
        assert.equal(errors[0].code, "type-error");
    });

    it("should validate a correct matching pattern", () => {
        const { errors } = compileSchema({
            type: "object",
            patternProperties: { test: { type: "number" } }
        }).validate({ test: 10 });

        assert.equal(errors.length, 0);
    });

    it("should return an error for matching regex pattern and failed validation", () => {
        const { errors } = compileSchema({
            type: "object",
            patternProperties: { "^.est?": { type: "number" } }
        }).validate({ test: "invalid type" });

        assert.equal(errors.length, 1);
        assert.equal(errors[0].code, "type-error");
    });

    it("should invalidate defined property", () => {
        const { errors } = compileSchema({
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
        const { errors } = compileSchema({
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
        const { errors } = compileSchema({
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
        const { errors } = compileSchema({
            type: "object",
            patternProperties: {
                "^.est?$": { type: "number" }
            },
            additionalProperties: false
        }).validate({ tes: 10 });

        assert.equal(errors.length, 0);
    });

    it("should return no error if additional properties validate value", () => {
        const { errors } = compileSchema({
            type: "object",
            patternProperties: {
                "^.est?$": { type: "number" }
            },
            additionalProperties: { type: "string" }
        }).validate({ anAddedProp: "valid" });

        assert.equal(errors.length, 0);
    });

    it("should return an AdditionalPropertiesError if additional properties do not validate", () => {
        const { errors } = compileSchema({
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

describe("keyword : patternProperties : reduce", () => {
    it("should return schema of matching property", () => {
        const { node } = compileSchema({
            properties: { label: { type: "string", maxLength: 99 } },
            patternProperties: { "[0-9][0-9]7": { type: "string", minLength: 2 } }
        }).reduce({
            "007": "match",
            title: "no match"
        });

        assert.deepEqual(node.schema, {
            properties: {
                label: { type: "string", maxLength: 99 },
                "007": { type: "string", minLength: 2 }
            }
        });
    });

    it("should merge schema with matching property schema", () => {
        const { node } = compileSchema({
            properties: { "007": { type: "string", maxLength: 99 } },
            patternProperties: { "[0-9][0-9]7": { type: "string", minLength: 2 } }
        }).reduce({
            data: {
                "007": "match"
            }
        });

        assert.deepEqual(node.schema, {
            properties: {
                "007": { type: "string", minLength: 2, maxLength: 99 }
            }
        });
    });

    it("should add patterns to properties per default", () => {
        const { node } = compileSchema({
            properties: { "007": { type: "string", maxLength: 99 } },
            patternProperties: { "[0-9][0-9]7": { type: "string", minLength: 2 } }
        }).reduce({});

        assert.deepEqual(node.schema, {
            properties: {
                "007": { type: "string", minLength: 2, maxLength: 99 }
            }
        });
    });
});
