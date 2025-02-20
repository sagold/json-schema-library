import { strict as assert } from "assert";
import { Draft2019 } from "../../lib/draft2019";
import { Draft } from "../../lib/draft";
import { compileSchema } from "../compileSchema";

describe("feature : if-then-else : get", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it("should step into if-then-property", () => {
        const node = compileSchema(draft, {
            type: "object",
            if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
            then: { required: ["header"], properties: { header: { type: "string", minLength: 1 } } }
        });

        const schema = node.get("header", { withHeader: true, header: "huhu" })?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });

    it("should NOT step into if-then-property", () => {
        const node = compileSchema(draft, {
            type: "object",
            if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
            then: { required: ["header"], properties: { header: { type: "string", minLength: 1 } } },
            additionalProperties: false
        });

        const schema = node.get("header", { withHeader: false, header: "huhu" })?.schema;

        assert.deepEqual(schema, undefined);
    });

    it("should step into if-else-property", () => {
        const node = compileSchema(draft, {
            type: "object",
            if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
            else: { required: ["header"], properties: { header: { type: "string", minLength: 1 } } }
        });

        const schema = node.get("header", { withHeader: false, header: "huhu" })?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });

    it("should recursively resolve if-then-else schema", () => {
        const node = compileSchema(draft, {
            type: "object",
            if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
            then: { allOf: [{ required: ["header"], properties: { header: { type: "string", minLength: 1 } } }] }
        });

        const schema = node.get("header", { withHeader: true, header: "huhu" })?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });
});
