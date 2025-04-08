import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";
describe("keyword : if-then-else : get", () => {
    describe("object", () => {
        it("should step into if-then-property", () => {
            var _a, _b;
            const node = compileSchema({
                type: "object",
                if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                then: { required: ["header"], properties: { header: { type: "string", minLength: 1 } } }
            });
            const schema = (_b = (_a = node.getChild("header", { withHeader: true, header: "huhu" })) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
        it("should NOT step into if-then-property", () => {
            var _a, _b;
            const node = compileSchema({
                type: "object",
                if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                then: { required: ["header"], properties: { header: { type: "string", minLength: 1 } } },
                additionalProperties: false
            });
            const schema = (_b = (_a = node.getChild("header", { withHeader: false, header: "huhu" })) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
            assert.deepEqual(schema, undefined);
        });
        it("should step into if-else-property", () => {
            var _a, _b;
            const node = compileSchema({
                type: "object",
                if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                else: { required: ["header"], properties: { header: { type: "string", minLength: 1 } } }
            });
            const schema = (_b = (_a = node.getChild("header", { withHeader: false, header: "huhu" })) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
        it("should recursively resolve if-then-else schema", () => {
            var _a, _b;
            const node = compileSchema({
                type: "object",
                if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                then: { allOf: [{ required: ["header"], properties: { header: { type: "string", minLength: 1 } } }] }
            });
            const schema = (_b = (_a = node.getChild("header", { withHeader: true, header: "huhu" })) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
    });
    // describe("array", () => {});
});
