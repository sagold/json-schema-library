import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";

describe("keyword : contains : match bounds", () => {
    it("should ignore minContains and maxContains in draft-06 and draft-07", () => {
        for (const $schema of ["draft-06", "draft-07"]) {
            const node = compileSchema({ $schema, contains: {}, minContains: 2, maxContains: 0 });
            assert.equal(node.validate([0]).valid, true);
            assert.equal(node.validate([]).valid, false);
            assert.deepEqual(
                node.schemaAnnotations.map(({ code, data }) => [code, data.pointer]),
                [
                    ["unknown-keyword-warning", "#/minContains"],
                    ["unknown-keyword-warning", "#/maxContains"]
                ]
            );
        }
    });

    it("should enforce minContains with contains true in draft-2019-09", () => {
        const node = compileSchema({ $schema: "draft-2019-09", contains: true, minContains: 2 });
        assert.equal(node.validate([1]).errors[0]?.code, "contains-min-error");
        assert.equal(node.validate([1, 2]).valid, true);
    });

    it("should enforce maxContains with contains true in draft-2020-12", () => {
        const node = compileSchema({ $schema: "draft-2020-12", contains: true, maxContains: 1 });
        assert.equal(node.validate([1, 2]).errors[0]?.code, "contains-max-error");
        assert.equal(node.validate([1]).valid, true);
    });

    it("should allow an empty array with contains true and minContains zero", () => {
        const node = compileSchema({ $schema: "draft-2019-09", contains: true, minContains: 0, maxContains: 0 });
        assert.equal(node.validate([]).valid, true);
        assert.equal(node.validate([1]).errors[0]?.code, "contains-max-error");
    });

    it("should count zero matches with contains false and minContains zero", () => {
        const node = compileSchema({ $schema: "draft-2020-12", contains: false, minContains: 0 });
        assert.equal(node.validate([]).valid, true);
        assert.equal(node.validate([1]).valid, true);
    });
});
