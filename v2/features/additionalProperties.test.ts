import { strict as assert } from "assert";
import { Draft2019 } from "../../lib/draft2019";
import { Draft } from "../../lib/draft";
import { compileSchema } from "../compileSchema";

describe("feature : additionalProperties : get", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it("should step into additionalProperties", () => {
        const node = compileSchema(draft, {
            type: "object",
            additionalProperties: { type: "string", minLength: 1 }
        });

        const schema = node.get("header", { header: "huhu" })?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });

    it("should NOT step into additionalProperties if false", () => {
        const node = compileSchema(draft, {
            type: "object",
            additionalProperties: false
        });

        const schema = node.get("header", { header: "huhu" })?.schema;

        assert.deepEqual(schema, undefined);
    });

    it("should create a schema if additionalProperties is true", () => {
        const node = compileSchema(draft, {
            type: "object",
            additionalProperties: true
        });

        const schema = node.get("header", { header: "huhu" })?.schema;

        assert.deepEqual(schema, { type: "string" });
    });

    it("should apply additionalProperties from allOf", () => {
        const node = compileSchema(draft, {
            type: "object",
            allOf: [{ additionalProperties: true }]
        });

        const schema = node.get("header", { header: "huhu" })?.schema;

        assert.deepEqual(schema, { type: "string" });
    });

    it("should override additionalProperties from allOf", () => {
        const node = compileSchema(draft, {
            type: "object",
            additionalProperties: { type: "number" },
            allOf: [{ additionalProperties: { type: "boolean" } }]
        });

        const schema = node.get("header")?.schema;

        assert.deepEqual(schema, { type: "boolean" });
    });
});
