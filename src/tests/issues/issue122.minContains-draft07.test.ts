import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";

// issue#122 — draft-07 reports minContains as an unknown keyword, but contains
// validation still applied it (and maxContains). Those keywords exist only from
// draft 2019-09 onward; draft-07 `contains` requires a single matching item.
describe("issue#122 - draft-07 labels minContains unsupported while still applying it", () => {
    it("should not apply minContains on draft-07", () => {
        const node = compileSchema({ $schema: "draft-07", contains: {}, minContains: 2 });
        assert.equal(node.getDraftVersion(), "draft-07");
        const { valid, errors } = node.validate([0]);
        assert.equal(valid, true);
        assert.equal(errors.length, 0);
    });

    it("should still report minContains as an unknown-keyword annotation on draft-07", () => {
        const { schemaAnnotations } = compileSchema({ $schema: "draft-07", contains: {}, minContains: 2 });
        assert.equal(schemaAnnotations.length, 1);
        assert.equal(schemaAnnotations[0].code, "unknown-keyword-warning");
        assert.equal(schemaAnnotations[0].data.pointer, "#/minContains");
        assert.equal(schemaAnnotations[0].message, "Keyword 'minContains' is not a valid keyword to draft 'draft-07'");
    });

    it("should still require at least one matching item from contains on draft-07", () => {
        const { valid, errors } = compileSchema({ $schema: "draft-07", contains: {}, minContains: 2 }).validate([]);
        assert.equal(valid, false);
        assert.equal(errors[0].code, "contains-min-error");
    });

    it("should not apply maxContains on draft-07", () => {
        const { valid, errors } = compileSchema({ $schema: "draft-07", contains: {}, maxContains: 0 }).validate([0]);
        assert.equal(valid, true);
        assert.equal(errors.length, 0);
    });

    it("should still apply minContains on draft-2019-09", () => {
        const { valid, errors } = compileSchema({
            $schema: "draft-2019-09",
            contains: {},
            minContains: 2
        }).validate([0]);
        assert.equal(valid, false);
        assert.equal(errors[0].code, "contains-min-error");
    });
});
