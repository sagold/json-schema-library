import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
describe("keyword : items : get", () => {
    describe("items-object", () => {
        it("should step into items without data", () => {
            var _a, _b;
            const node = compileSchema({
                $schema: "draft-2019-09",
                type: "array",
                items: { type: "string", minLength: 1 }
            });
            const schema = (_b = (_a = node.getChild("0")) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
    });
    describe("items-array", () => {
        it("should step into items without data", () => {
            var _a, _b;
            const node = compileSchema({
                $schema: "draft-2019-09",
                type: "array",
                items: [{ type: "number" }, { type: "string", minLength: 1 }]
            });
            const schema = (_b = (_a = node.getChild("1")) === null || _a === void 0 ? void 0 : _a.node) === null || _b === void 0 ? void 0 : _b.schema;
            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
    });
});
