import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";

// issue#120 — the `url` format validator was the only format validator missing
// the `typeof data !== "string"` guard all sibling validators have. A `null`
// value was coerced to the string "null" and rejected, although `format` must
// only apply to strings.
describe("issue#120 - url format should ignore non-string values", () => {
    const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties: {
            url: { type: ["string", "null"], format: "url" }
        }
    };

    it("should validate null for format url on type ['string', 'null']", () => {
        const node = compileSchema(schema);
        const { errors } = node.validate({ url: null });
        assert.equal(errors.length, 0);
    });

    it("should ignore other non-string values for format url", () => {
        const node = compileSchema(schema);
        const { errors } = node.validate({ url: 123 });
        assert(errors.length > 0, "number should still fail type validation, not format");
        const formatError = errors.find((error) => error.code === "format-url-error");
        assert.equal(formatError, undefined);
    });

    it("should validate a valid url", () => {
        const node = compileSchema(schema);
        const { errors } = node.validate({ url: "https://example.com" });
        assert.equal(errors.length, 0);
    });

    it("should return format-url-error for an invalid url", () => {
        const node = compileSchema(schema);
        const { errors } = node.validate({ url: "not a url" });
        assert(errors.length > 0);
        const formatError = errors.find((error) => error.code === "format-url-error");
        assert(formatError != null);
    });
});
