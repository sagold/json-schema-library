import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";
describe("keyword : additionalProperties : get", () => {
    it("should step into additionalProperties", () => {
        var _a, _b;
        const node = compileSchema({
            type: "object",
            additionalProperties: { type: "string", minLength: 1 }
        });
        const schema = (_b = (_a = node.getChild("header", { header: "huhu" })) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });
    it("should NOT step into additionalProperties if false", () => {
        var _a, _b;
        const node = compileSchema({
            type: "object",
            additionalProperties: false
        });
        const schema = (_b = (_a = node.getChild("header", { header: "huhu" })) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
        assert.deepEqual(schema, undefined);
    });
    it("should return undefined if additionalProperties is true", () => {
        var _a, _b;
        const node = compileSchema({
            type: "object",
            additionalProperties: true
        });
        const schema = (_b = (_a = node.getChild("header", { header: "huhu" })) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
        assert.deepEqual(schema, undefined);
    });
    it("should apply additionalProperties from allOf", () => {
        var _a, _b;
        const node = compileSchema({
            type: "object",
            allOf: [{ additionalProperties: true }]
        });
        const schema = (_b = (_a = node.getChild("header", { header: "huhu" })) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
        assert.deepEqual(schema, undefined);
    });
    it("should override additionalProperties from allOf", () => {
        var _a, _b;
        const node = compileSchema({
            type: "object",
            additionalProperties: { type: "number" },
            allOf: [{ additionalProperties: { type: "boolean" } }]
        });
        const schema = (_b = (_a = node.getChild("header")) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
        assert.deepEqual(schema, { type: "boolean" });
    });
});
describe("keyword : additionalProperties : validate", () => {
    it("should return no-additional-properties-error if no schema is given for an additional property", () => {
        const { errors } = compileSchema({ type: "object", additionalProperties: false }).validate({ a: 1 });
        assert.deepEqual(errors.length, 1);
    });
    it("should return error for property not in properties schema", () => {
        const { errors } = compileSchema({
            $schema: "https://json-schema.org/draft/2019-09/schema",
            properties: { foo: { $ref: "#" } },
            additionalProperties: false
        }).validate({ bar: false });
        assert.deepEqual(errors.length, 1);
    });
    it("should return all no-additional-properties-error", () => {
        const { errors } = compileSchema({
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
        const { errors } = compileSchema({ type: "object", additionalProperties: true }).validate({ a: 1 });
        assert.deepEqual(errors.length, 0);
    });
    it("should be valid if value matches 'additionalProperties' schema", () => {
        const { errors } = compileSchema({
            type: "object",
            properties: { b: { type: "string" } },
            additionalProperties: { type: "number" }
        }).validate({ a: 1 });
        assert.deepEqual(errors.length, 0);
    });
    it("should only validate existing definition in 'properties'", () => {
        const { errors } = compileSchema({
            type: "object",
            properties: { b: { type: "string" } },
            additionalProperties: { type: "number" }
        }).validate({ b: "i am valid" });
        assert.deepEqual(errors.length, 0);
    });
    it("should return error if value does not match 'additionalProperties' schema", () => {
        const { errors } = compileSchema({
            type: "object",
            properties: { b: { type: "string" } },
            additionalProperties: { type: "string" }
        }).validate({ a: 1 });
        assert.deepEqual(errors.length, 1);
        assert.deepEqual(errors[0].type, "error");
    });
    it("should be valid if value matches 'additionalProperties' oneOf schema", () => {
        const { errors } = compileSchema({
            type: "object",
            properties: { b: { type: "string" } },
            additionalProperties: {
                oneOf: [{ type: "number" }]
            }
        }).validate({ a: 1 });
        assert.deepEqual(errors.length, 0);
    });
    it("should be invalid if value does not match 'additionalProperties' in oneOf schema", () => {
        const { errors } = compileSchema({
            type: "object",
            properties: { b: { type: "string" } },
            additionalProperties: {
                oneOf: [{ type: "string" }]
            }
        }).validate({ a: 1 });
        assert.deepEqual(errors.length, 1);
    });
    it("should be ignore properties that are matched by patternProperties", () => {
        const { errors } = compileSchema({
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
        const { errors } = compileSchema({
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
