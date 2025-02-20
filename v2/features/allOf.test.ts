import { strict as assert } from "assert";
import { Draft2019 } from "../../lib/draft2019";
import { Draft } from "../../lib/draft";
import { compileSchema } from "../compileSchema";

describe("feature : allOf : get", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it("should step into allOf-property", () => {
        const node = compileSchema(draft, {
            type: "object",
            allOf: [{ properties: { header: { type: "string", minLength: 1 } } }]
        });

        const schema = node.get("header", { withHeader: true, header: "huhu" })?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });

    it("should recursively resolve allOf schema", () => {
        const node = compileSchema(draft, {
            type: "object",
            allOf: [
                {
                    if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                    then: { required: ["header"], properties: { header: { type: "string", minLength: 1 } } }
                }
            ]
        });

        const schema = node.get("header", { withHeader: true, header: "huhu" })?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });
});
