import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";
describe("feature : items : get", () => {
    describe("items-object", () => {
        it("should step into items without data", () => {
            var _a;
            const node = compileSchema({
                type: "array",
                items: { type: "string", minLength: 1 }
            });
            const schema = (_a = node.get("0")) === null || _a === void 0 ? void 0 : _a.schema;
            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
    });
    describe("items-array", () => {
        it("should step into items without data", () => {
            var _a;
            const node = compileSchema({
                type: "array",
                items: [{ type: "number" }, { type: "string", minLength: 1 }]
            });
            const schema = (_a = node.get("1")) === null || _a === void 0 ? void 0 : _a.schema;
            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
    });
});
