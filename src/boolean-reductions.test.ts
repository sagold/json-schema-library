import { strict as assert } from "assert";
import { compileSchema } from "./compileSchema";
import { draft2020 } from "./draft2020";
import { extendDraft } from "./Draft";
import { oneOfFuzzyKeyword } from "./keywords/oneOf";
import { isSchemaNode, JsonSchema } from "./types";

for (const draft of ["draft-2019-09", "draft-2020-12"]) {
    describe(`boolean applicator reductions (${draft})`, () => {
        it("does not infer evaluated properties from a true oneOf branch", () => {
            for (const branch of [true, {}]) {
                const node = compileSchema({
                    $schema: draft, type: "object", properties: { known: { type: "string" } },
                    oneOf: [branch], unevaluatedProperties: false
                });
                const refs = { ...node.context.refs };
                const values = [{ known: "ok" }, { known: "ok", extra: 1 }, { known: 1 }, {}];
                assert.deepEqual(values.map((value) => node.validate(value).valid), [true, false, false, true]);
                const reduced = node.reduceNode({ known: "ok", extra: 1 }).node;
                assert.ok(reduced);
                assert.equal(reduced.properties?.extra, undefined);
                assert.equal(node.oneOf![0].dynamicId, "");
                assert.deepEqual(node.context.refs, refs);
            }
        });

        it("does not infer evaluated items from a true oneOf branch", () => {
            for (const branch of [true, {}]) {
                const node = compileSchema({ $schema: draft, type: "array", oneOf: [branch], unevaluatedItems: false });
                assert.deepEqual([[], [1]].map((value) => node.validate(value).valid), [true, false]);
                const reduced = node.reduceNode([1]).node;
                assert.ok(reduced);
                assert.equal(reduced.items, undefined);
                assert.equal(reduced.prefixItems, undefined);
            }
        });

        it("does not invent an evaluated trigger property for a true dependency", () => {
            for (const dependency of [true, {}]) {
                const node = compileSchema({
                    $schema: draft, type: "object", dependentSchemas: { x: dependency }, unevaluatedProperties: false
                });
                const refs = { ...node.context.refs };
                assert.equal(node.validate({}).valid, true);
                assert.equal(node.validate({ x: 1 }).valid, false);
                const reduced = node.reduceNode({ x: 1 }).node;
                assert.ok(reduced);
                assert.equal(reduced.properties?.x, undefined);
                assert.deepEqual(node.context.refs, refs);
            }
        });

        it("retains properties evaluated outside a true dependency", () => {
            const node = compileSchema({
                $schema: draft, type: "object", properties: { x: { type: "number" } },
                dependentSchemas: { x: true }, unevaluatedProperties: false
            });
            assert.deepEqual([{}, { x: 1 }, { x: "wrong" }, { x: 1, extra: true }].map((value) => node.validate(value).valid),
                [true, true, false, false]);
        });

        it("reduces an activated false dependency to a false whole-instance schema", () => {
            const node = compileSchema({
                $schema: draft, type: "object", properties: { x: { type: "number" } }, dependentSchemas: { x: false }
            });
            const refs = { ...node.context.refs };
            assert.equal(node.validate({}).valid, true);
            assert.equal(node.validate({ x: 1 }).valid, false);
            const reduced = node.reduceNode({ x: 1 }).node;
            assert.ok(reduced);
            assert.equal(reduced.schema, false);
            assert.equal(reduced.validate({ x: 1 }).valid, false);
            assert.deepEqual(node.context.refs, refs);
        });
    });

    describe(`reference reduction resource identity (${draft})`, () => {
        const remoteId = "https://example.test/reduced-resource";
        const targets: Record<string, JsonSchema> = {
            dependentSchemas: { dependentSchemas: { x: { properties: { x: { type: "string" } } } } },
            conditional: { if: true, then: { properties: { x: { type: "string" } } } }
        };
        for (const [name, target] of Object.entries(targets)) {
            it(`reduces a remote root's ${name} despite an equal fragment`, () => {
                const node = compileSchema({
                    $schema: draft, $id: "https://example.test/caller", $ref: remoteId, unevaluatedProperties: false
                }).addRemoteSchema(remoteId, { $schema: draft, ...structuredClone(target) });
                const refs = { ...node.context.remotes[remoteId].context.refs };
                const resolved = node.resolveRef();
                assert.ok(isSchemaNode(resolved));
                assert.equal(resolved.schemaLocation, node.schemaLocation);
                assert.notEqual(resolved.context, node.context);
                assert.notEqual(resolved.$id, node.$id);
                const reduced = node.reduceNode({ x: "ok" }).node;
                assert.ok(reduced);
                assert.equal(reduced.properties?.x.type, "string");
                assert.equal(node.getNode("#/x", { x: "ok" }).node?.type, "string");
                const inline = compileSchema({ $schema: draft, ...target, unevaluatedProperties: false });
                const allOf = compileSchema({ $schema: draft, allOf: [target], unevaluatedProperties: false });
                for (const control of [node, inline, allOf]) {
                    assert.deepEqual([{}, { x: "ok" }, { x: 1 }, { x: "ok", extra: true }].map((value) => control.validate(value).valid),
                        [true, true, false, false]);
                }
                assert.deepEqual(node.context.remotes[remoteId].context.refs, refs);
            });
        }

        it("reduces a remote object-valued contains without changing its owner", () => {
            const target = { contains: { type: "string" } };
            const node = compileSchema({ $schema: draft, $ref: remoteId, unevaluatedItems: false })
                .addRemoteSchema(remoteId, { $schema: draft, ...target });
            const inline = compileSchema({ $schema: draft, ...target, unevaluatedItems: false });
            for (const control of [node, inline]) {
                assert.deepEqual([["ok"], [1], ["ok", 1]].map((value) => control.validate(value).valid), [true, false, false]);
            }
        });
    });
}

describe("boolean fuzzy oneOf projections", () => {
    const drafts = [extendDraft(draft2020, { keywords: [oneOfFuzzyKeyword] })];

    it("preserves a true branch on the exact-match path", () => {
        const node = compileSchema({ type: "array", oneOf: [true], unevaluatedItems: false }, { drafts });
        assert.deepEqual([[], [1]].map((value) => node.validate(value).valid), [true, false]);
    });

    it("keeps a heuristically selected true branch unconstrained without mutating it", () => {
        const node = compileSchema({ oneOf: [false, true, { type: "array" }] }, { drafts });
        const branch = node.oneOf![1];
        const reduced = node.reduceNode([1]).node;
        assert.ok(reduced);
        assert.equal(reduced.oneOfIndex, 1);
        assert.equal(reduced.items, undefined);
        assert.equal(reduced.prefixItems, undefined);
        assert.equal(branch.oneOfIndex, undefined);
        assert.equal(branch.dynamicId, "");
    });
});
