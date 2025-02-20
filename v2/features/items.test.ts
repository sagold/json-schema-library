import { strict as assert } from "assert";
import { Draft2019 } from "../../lib/draft2019";
import { Draft } from "../../lib/draft";
import { compileSchema } from "../compileSchema";

describe("feature : items : get", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    describe("items-object", () => {
        it("should step into items without data", () => {
            const node = compileSchema(draft, {
                type: "array",
                items: { type: "string", minLength: 1 }
            });

            const schema = node.get("0")?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
    });

    describe("items-array", () => {
        it("should step into items without data", () => {
            const node = compileSchema(draft, {
                type: "array",
                items: [{ type: "number" }, { type: "string", minLength: 1 }]
            });

            const schema = node.get("1")?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
    });
});
