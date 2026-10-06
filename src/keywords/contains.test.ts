import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";

for (const $schema of ["draft-2019-09", "draft-2020-12"]) {
    describe(`keyword : contains : boolean bounds (${$schema})`, () => {
        it("should enforce minContains on true", () => {
            const node = compileSchema({ $schema, contains: true, minContains: 2 });
            assert.equal(node.validate([1]).valid, false);
            assert.equal(node.validate([1, 2]).valid, true);
        });

        it("should enforce maxContains on true", () => {
            const node = compileSchema({ $schema, contains: true, minContains: 2, maxContains: 2 });
            assert.equal(node.validate([1, 2, 3]).valid, false);
            assert.equal(node.validate([1, 2]).valid, true);
        });

        it("should allow zero matches with true", () => {
            const node = compileSchema({ $schema, contains: true, minContains: 0, maxContains: 0 });
            assert.equal(node.validate([]).valid, true);
            assert.equal(node.validate([1]).valid, false);
        });

        it("should count zero matches with false", () => {
            const node = compileSchema({ $schema, contains: false, minContains: 0, maxContains: 0 });
            assert.equal(node.validate([]).valid, true);
            assert.equal(node.validate([1]).valid, true);
        });

        it("should ignore boolean contains bounds on non-arrays", () => {
            for (const contains of [true, false]) {
                const node = compileSchema({ $schema, contains, minContains: 2, maxContains: 0 });
                for (const data of [null, true, 1, "value", {}]) {
                    assert.equal(node.validate(data).valid, true);
                }
            }
        });
    });
}

for (const $schema of ["draft-06", "draft-07"]) {
    describe(`keyword : contains : unsupported bounds (${$schema})`, () => {
        it("should still require one match with true", () => {
            const node = compileSchema({ $schema, contains: true, minContains: 2, maxContains: 0 });
            assert.equal(node.validate([]).valid, false);
            assert.equal(node.validate([1]).valid, true);
            assert.deepEqual(
                node.schemaAnnotations.map(({ code, data }) => [code, data.pointer]),
                [
                    ["unknown-keyword-warning", "#/minContains"],
                    ["unknown-keyword-warning", "#/maxContains"]
                ]
            );
        });

        it("should not allow zero matches with false", () => {
            const node = compileSchema({ $schema, contains: false, minContains: 0 });
            assert.equal(node.validate([]).valid, false);
            assert.equal(node.validate([1]).valid, false);
        });
    });
}

it("should preserve evaluated items with boolean contains", () => {
    const matching = compileSchema({
        $schema: "draft-2020-12",
        contains: true,
        minContains: 2,
        maxContains: 2,
        unevaluatedItems: false
    });
    assert.equal(matching.validate([1, 2]).valid, true);

    const nonmatching = compileSchema({
        $schema: "draft-2020-12",
        contains: false,
        minContains: 0,
        unevaluatedItems: false
    });
    assert.equal(nonmatching.validate([]).valid, true);
    assert.equal(nonmatching.validate([1]).valid, false);
});
