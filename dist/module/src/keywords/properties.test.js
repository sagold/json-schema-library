import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";
describe("keyword : properties : get", () => {
    it("should step into properties without data", () => {
        var _a, _b;
        const node = compileSchema({
            type: "object",
            properties: {
                header: { type: "string", minLength: 1 }
            }
        });
        const schema = (_b = (_a = node.getChild("header")) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });
    it("should step into properties", () => {
        var _a, _b;
        const node = compileSchema({
            type: "object",
            properties: {
                header: { type: "string", minLength: 1 }
            }
        });
        const schema = (_b = (_a = node.getChild("header", { header: "huhu" })) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });
    it("should step into nested properties", () => {
        var _a, _b;
        const node = compileSchema({
            type: "object",
            properties: {
                header: {
                    type: "object",
                    properties: {
                        title: { type: "string", minLength: 1 }
                    }
                }
            }
        });
        const { node: next } = node.getChild("header", { header: { title: "huhu" } });
        const schema = (_b = (_a = next.getChild("title")) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });
    it("should step into properties with if-then present", () => {
        var _a, _b;
        const node = compileSchema({
            type: "object",
            properties: {
                withHeader: { type: "boolean", default: true }
            },
            if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
            then: { allOf: [{ required: ["header"], properties: { header: { type: "string", minLength: 1 } } }] }
        });
        const schema = (_b = (_a = node.getChild("withHeader", { withHeader: false })) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
        assert.deepEqual(schema, { type: "boolean", default: true });
    });
});
describe("keyword : properties : validate", () => {
    it("should validate matching property type", () => {
        const { errors } = compileSchema({
            type: "object",
            properties: {
                header: { type: "string", minLength: 1 }
            }
        }).validate({ header: "123" });
        assert.deepEqual(errors.length, 0);
    });
    it("should validate boolean schema `true`", () => {
        const { errors } = compileSchema({
            type: "object",
            properties: {
                header: true
            }
        }).validate({ header: "123" });
        assert.deepEqual(errors.length, 0);
    });
    it("should validate boolean schema `false` if property not given", () => {
        const { errors } = compileSchema({
            type: "object",
            properties: {
                header: true,
                missing: false
            }
        }).validate({ header: "123" });
        assert.deepEqual(errors.length, 0);
    });
    it("should NOT validate boolean schema `false`", () => {
        const { errors } = compileSchema({
            type: "object",
            properties: {
                header: false
            }
        }).validate({ header: "123" });
        assert.deepEqual(errors.length, 1);
    });
});
