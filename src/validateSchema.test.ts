import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { extendDraft } from "./Draft";
import { draft2020 } from "./draft2020";
import { propertyDependenciesKeyword } from "./keywords/propertyDependencies";
import { draft07 } from "./draft07";

const withAdditionalKeywords = {
    drafts: [
        extendDraft(draft2020, {
            keywords: [propertyDependenciesKeyword]
        })
    ]
};

describe("validateSchema", () => {
    it("should error if `$defs` is not an object", () => {
        const { schemaErrors } = compileSchema({ $defs: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should throw an error if schema is invalid and option 'throwOnInvalidSchema = true'", () => {
        assert.throws(() => {
            compileSchema({ $defs: true }, { throwOnInvalidSchema: true });
        });
    });
    it("should error for missing `$ref` target in $defs", () => {
        const { schemaErrors } = compileSchema({
            type: "object",
            properties: {
                invalid: { $ref: "#/$defs/invalid" }
            }
        });
        assert.equal(schemaErrors?.length, 1);
        assert.equal(schemaErrors[0].data.pointer, "#/properties/invalid/$ref");
        assert.equal(schemaErrors[0].data.value, "#/$defs/invalid");
    });
    it("should error if `additionalProperties` is not a valid JSON Schema", () => {
        const { schemaErrors } = compileSchema({ additionalProperties: 999 });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `allOf` is not a an array", () => {
        const { schemaErrors } = compileSchema({ allOf: {} });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `allOf schema` is not a valid JSON Schema", () => {
        const { schemaErrors } = compileSchema({ allOf: [999] });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `anyOf` is not a an array", () => {
        const { schemaErrors } = compileSchema({ anyOf: {} });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `anyOf schema` is not a valid JSON Schema", () => {
        const { schemaErrors } = compileSchema({ anyOf: [999] });
        assert.equal(schemaErrors?.length, 1);
    });
    // any const is valid: https://json-schema.org/draft/2020-12/json-schema-validation#name-const
    it("should error if `contains` is not a valid JSON Schema", () => {
        const { schemaErrors } = compileSchema({ contains: [] });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `dependencies` is not a an object", () => {
        const { schemaErrors } = compileSchema({ dependencies: [] });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `dependentRequired` is not a an object", () => {
        const { schemaErrors } = compileSchema({ dependentRequired: [] });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `dependentRequired` is not a an object with a list of strings", () => {
        const { schemaErrors } = compileSchema({
            dependentRequired: {
                property: ["title", true]
            }
        });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `dependentSchemas` is not a an object containing schemata", () => {
        const { schemaErrors } = compileSchema({
            dependentSchemas: {
                valid: { type: "string" },
                stillValid: true,
                invalid: 999
            }
        });
        assert.equal(schemaErrors?.length, 1);
        assert.equal(schemaErrors[0].data.pointer, "#/dependentSchemas/invalid");
    });
    it("should error if `deprecated` is not a a boolean", () => {
        const { schemaErrors } = compileSchema({ deprecated: {} });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `enum` is not an array", () => {
        const { schemaErrors } = compileSchema({ type: "string", enum: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `exclusiveMaximum` is not a number", () => {
        const { schemaErrors } = compileSchema({ exclusiveMaximum: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `exclusiveMinimum` is not a number", () => {
        const { schemaErrors } = compileSchema({ exclusiveMinimum: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `format` is not a string", () => {
        const { schemaErrors } = compileSchema({ format: {} });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `if` is not a valid JSON Schema", () => {
        const { schemaErrors } = compileSchema({ if: 999, then: false, else: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `then` is not a valid JSON Schema", () => {
        const { schemaErrors } = compileSchema({ if: {}, then: [], else: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `else` is not a valid JSON Schema", () => {
        const { schemaErrors } = compileSchema({ if: {}, then: false, else: 999 });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `items` is not a valid JSON Schema", () => {
        const { schemaErrors } = compileSchema({ items: [] });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `maximum` is not a number", () => {
        const { schemaErrors } = compileSchema({ maximum: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `maxItems` is not a number", () => {
        const { schemaErrors } = compileSchema({ maxItems: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `maxLength` is not a number", () => {
        const { schemaErrors } = compileSchema({ maxLength: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `maxProperties` is not a number", () => {
        const { schemaErrors } = compileSchema({ maxProperties: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `minimum` is not a number", () => {
        const { schemaErrors } = compileSchema({ minimum: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `minItems` is not a number", () => {
        const { schemaErrors } = compileSchema({ minItems: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `minLength` is not a number", () => {
        const { schemaErrors } = compileSchema({ minLength: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `minProperties` is not a number", () => {
        const { schemaErrors } = compileSchema({ minProperties: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `multipleOf` is not a number", () => {
        const { schemaErrors } = compileSchema({ multipleOf: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `not` is not a JSON Schema", () => {
        const { schemaErrors } = compileSchema({ not: [] });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `oneOf` is not a an array", () => {
        const { schemaErrors } = compileSchema({ oneOf: {} });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `oneOf schema` is not a valid JSON Schema", () => {
        const { schemaErrors } = compileSchema({ oneOf: [999] });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `pattern` is not a string", () => {
        const { schemaErrors } = compileSchema({ type: "string", pattern: true });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `pattern` is an invalid regexp", () => {
        const { schemaErrors } = compileSchema({ type: "string", pattern: "(" });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `properties` is not an object", () => {
        const { schemaErrors } = compileSchema({ type: "object", properties: 999 });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `properties[string]` is not a JSON Schema", () => {
        const { schemaErrors } = compileSchema({
            type: "object",
            properties: {
                valid: { type: "string" },
                alsoValid: false,
                invalid: 999
            }
        });
        assert.equal(schemaErrors?.length, 1);
        assert.equal(schemaErrors[0].data.pointer, "#/properties/invalid");
    });
    it("should error if `propertyDependencies` is not an object", () => {
        const { schemaErrors } = compileSchema({ propertyDependencies: true }, withAdditionalKeywords);
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `propertyDependencies[string]` is not an object", () => {
        const { schemaErrors } = compileSchema({ propertyDependencies: { invalid: true } }, withAdditionalKeywords);
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `propertyDependencies[string][string]` is not JSON Schema", () => {
        const { schemaErrors } = compileSchema(
            { propertyDependencies: { valid: { invalid: 999 } } },
            withAdditionalKeywords
        );
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `propertyNames` is not a JSON Schema type", () => {
        const { schemaErrors } = compileSchema({ propertyNames: "error" });
        assert.equal(schemaErrors?.length, 1);
        assert.equal(schemaErrors[0].data.pointer, "#/propertyNames");
    });
    it("should error if `required` is not a string[]", () => {
        const { schemaErrors } = compileSchema({ type: "object", required: [123, "valid"] });
        assert.equal(schemaErrors?.length, 1);
        assert.equal(schemaErrors[0].data.pointer, "#/required");
    });
    it("should error if `type` is not a JSON Schema type", () => {
        const { schemaErrors } = compileSchema({ type: "error" });
        assert.equal(schemaErrors?.length, 1);
        assert.equal(schemaErrors[0].data.pointer, "#/type");
    });
    it("should error if `type` is not a valid JSON Schema type format", () => {
        const { schemaErrors } = compileSchema({ type: {} });
        assert.equal(schemaErrors?.length, 1);
        assert.equal(schemaErrors[0].data.pointer, "#/type");
    });
    it("should error if `type` is not a valid JSON Schema", () => {
        const { schemaErrors } = compileSchema({ type: "error" });
        assert.equal(schemaErrors?.length, 1);
        assert.equal(schemaErrors[0].data.pointer, "#/type");
    });
    it("should error if `unevaluatedItems` is not a valid JSON Schema", () => {
        const { schemaErrors } = compileSchema({ unevaluatedItems: [] });
        assert.equal(schemaErrors?.length, 1);
        assert.equal(schemaErrors[0].data.pointer, "#/unevaluatedItems");
    });
    it("should error if `unevaluatedProperties` is not a valid JSON Schema", () => {
        const { schemaErrors } = compileSchema({ unevaluatedProperties: 999 });
        assert.equal(schemaErrors?.length, 1);
        assert.equal(schemaErrors[0].data.pointer, "#/unevaluatedProperties");
    });
    it("should error if `uniqueItems` is not a boolean", () => {
        const { schemaErrors } = compileSchema({ uniqueItems: {} });
        assert.equal(schemaErrors?.length, 1);
        assert.equal(schemaErrors[0].data.pointer, "#/uniqueItems");
    });

    describe("annotations", () => {
        it("should return unknown keywords as annotation", () => {
            const { schemaAnnotations } = compileSchema(
                {
                    properties: {
                        headline: {
                            options: {},
                            type: "string"
                        }
                    }
                },
                { withSchemaAnnotations: true }
            );
            assert.equal(schemaAnnotations.length, 1);
            assert.equal(schemaAnnotations[0].data.pointer, "#/properties/headline/options");
        });
        it("should return not unknown keywords starting with 'x-'", () => {
            const { schemaAnnotations } = compileSchema(
                {
                    properties: {
                        headline: {
                            "x-options": {},
                            type: "string"
                        }
                    }
                },
                { withSchemaAnnotations: true }
            );
            assert.equal(schemaAnnotations.length, 0);
        });
        it("should return removed keywords from old drafts as annotation", () => {
            const { schemaAnnotations } = compileSchema(
                {
                    properties: {
                        headline: {
                            additionalItems: true
                        }
                    }
                },
                { withSchemaAnnotations: true }
            );
            assert.equal(schemaAnnotations.length, 1);
            assert.equal(schemaAnnotations[0].data.pointer, "#/properties/headline/additionalItems");
        });
        it("should return new keywords in old drafts as annotation", () => {
            const { schemaAnnotations } = compileSchema(
                {
                    properties: {
                        headline: {
                            prefixItems: []
                        }
                    }
                },
                { drafts: [draft07], withSchemaAnnotations: true }
            );
            assert.equal(schemaAnnotations.length, 1);
            assert.equal(schemaAnnotations[0].data.pointer, "#/properties/headline/prefixItems");
        });
    });
});
