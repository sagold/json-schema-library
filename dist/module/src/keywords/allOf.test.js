import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";
describe("keyword : allOf : get", () => {
    it("should step into allOf-property", () => {
        var _a, _b;
        const node = compileSchema({
            type: "object",
            allOf: [{ properties: { header: { type: "string", minLength: 1 } } }]
        });
        const schema = (_b = (_a = node.getNodeChild("header", { withHeader: true, header: "huhu" })) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });
    it("should recursively resolve allOf schema", () => {
        var _a, _b;
        const node = compileSchema({
            type: "object",
            allOf: [
                {
                    if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                    then: { required: ["header"], properties: { header: { type: "string", minLength: 1 } } }
                }
            ]
        });
        const schema = (_b = (_a = node.getNodeChild("header", { withHeader: true, header: "huhu" })) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });
});
