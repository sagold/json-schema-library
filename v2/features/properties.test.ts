import { strict as assert } from "assert";
import { Draft2019 } from "../../lib/draft2019";
import { Draft } from "../../lib/draft";
import { compileSchema } from "../compileSchema";

describe("feature : properties : get", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it("should step into properties without data", () => {
        const node = compileSchema(draft, {
            type: "object",
            properties: {
                header: { type: "string", minLength: 1 }
            }
        });

        const schema = node.get("header")?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });

    it("should step into properties", () => {
        const node = compileSchema(draft, {
            type: "object",
            properties: {
                header: { type: "string", minLength: 1 }
            }
        });

        const schema = node.get("header", { header: "huhu" })?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });

    it("should step into nested properties", () => {
        const node = compileSchema(draft, {
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

        const schema = node.get("header", { header: { title: "huhu" } }).get("title")?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });

    it("should step into properties with if-then present", () => {
        const node = compileSchema(draft, {
            type: "object",
            properties: {
                withHeader: { type: "boolean", default: true }
            },
            if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
            then: { allOf: [{ required: ["header"], properties: { header: { type: "string", minLength: 1 } } }] }
        });

        const schema = node.get("withHeader", { withHeader: false })?.schema;

        assert.deepEqual(schema, { type: "boolean", default: true });
    });
});
