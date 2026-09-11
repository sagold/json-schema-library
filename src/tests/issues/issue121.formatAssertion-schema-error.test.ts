import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";

// issue#121 — formatAssertion:false removed the entire format keyword, so a
// malformed `{format: 0}` was no longer a schema-error, throwOnInvalidSchema
// did not fire, and `format` was reported as an unknown keyword.
describe("issue#121 - formatAssertion:false hides malformed format schemas", () => {
    it("should still report a schema-error when format is not a string", () => {
        const { schemaErrors, schemaAnnotations } = compileSchema({ format: 0 }, { formatAssertion: false });
        assert.equal(schemaErrors?.length, 1);
        assert.equal(schemaErrors[0].code, "schema-error");
        assert.equal(
            schemaAnnotations.some((annotation) => annotation.code === "unknown-keyword-warning"),
            false
        );
    });

    it("should still throw when throwOnInvalidSchema is true", () => {
        assert.throws(() => {
            compileSchema({ format: 0 }, { formatAssertion: false, throwOnInvalidSchema: true });
        });
    });

    it("should not label a valid format keyword as unknown", () => {
        const { schemaErrors, schemaAnnotations } = compileSchema({ format: "email" }, { formatAssertion: false });
        assert.equal(schemaErrors?.length ?? 0, 0);
        assert.equal(
            schemaAnnotations.some((annotation) => annotation.code === "unknown-keyword-warning"),
            false
        );
    });

    it("should still skip format instance assertions", () => {
        const { valid, errors } = compileSchema({ format: "email" }, { formatAssertion: false }).validate(
            "not-an-email"
        );
        assert.equal(valid, true);
        assert.equal(errors.length, 0);
    });
});
