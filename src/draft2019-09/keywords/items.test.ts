import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";

describe("keyword : items : get", () => {
    describe("items-object", () => {
        it("should step into items without data", () => {
            const node = compileSchema({
                $schema: "draft-2019-09",
                type: "array",
                items: { type: "string", minLength: 1 }
            });

            const schema = node.get("0")?.node?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
    });

    describe("items-array", () => {
        it("should step into items without data", () => {
            const node = compileSchema({
                $schema: "draft-2019-09",
                type: "array",
                items: [{ type: "number" }, { type: "string", minLength: 1 }]
            });

            const schema = node.get("1")?.node?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
    });
});
