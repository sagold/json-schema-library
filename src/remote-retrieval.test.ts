import { strict as assert } from "assert";
import { compileSchema } from "./compileSchema";
import { isJsonError, isSchemaNode, JsonSchema } from "./types";

const retrieval = "https://e.test/catalog/r.json";
const canonical = "https://e.test/canonical/r.json";
const localDefs = "https://e.test/catalog/defs.json";
const canonicalDefs = "https://e.test/canonical/defs.json";
const dialects = ["draft-04", "draft-06", "draft-07", "draft-2019-09", "draft-2020-12"];

for (const draft of dialects) {
    const id = draft === "draft-04" ? "id" : "$id";
    const legacy = ["draft-04", "draft-06", "draft-07"].includes(draft);
    describe(`remote retrieval base (${draft})`, () => {
        it("resolves relative references with relative, omitted and absolute identifiers", () => {
            for (const identifier of ["r.json", undefined, retrieval]) {
                const registry = compileSchema({ $schema: draft });
                const document: JsonSchema = { $schema: draft, $ref: "defs.json" };
                if (identifier !== undefined) document[id] = identifier;
                const original = structuredClone(document);
                registry.addRemoteSchema(retrieval, document);
                registry.addRemoteSchema(localDefs, { $schema: draft, type: "string" });
                const remote = registry.context.remotes[retrieval];
                assert.equal(remote.$id, retrieval);
                assert.equal(remote.$ref, localDefs);
                const refs = { ...remote.context.refs };
                const node = compileSchema({ $schema: draft, $ref: retrieval }, { remote: registry });
                assert.deepEqual(["ok", 1].map((value) => node.validate(value).valid), [true, false]);
                assert.deepEqual(remote.context.refs, refs);
                assert.deepEqual(document, original);
            }
        });

        it("preserves the base when a registered document is compiled again", () => {
            const registry = compileSchema({ $schema: draft });
            const document = { $schema: draft, [id]: "r.json", $ref: "defs.json" };
            registry.addRemoteSchema(retrieval, document);
            registry.addRemoteSchema(localDefs, { $schema: draft, type: "string" });
            const node = compileSchema(document, { remote: registry, draft, baseUri: retrieval });
            assert.equal(node.$id, retrieval);
            assert.equal(node.$ref, localDefs);
            assert.equal(node.context.remotes[retrieval], node);
            assert.deepEqual(["ok", 1].map((value) => node.validate(value).valid), [true, false]);
        });

        it("applies the dialect's identifier-sibling rule independently of retrieval", () => {
            const registry = compileSchema({ $schema: draft });
            registry.addRemoteSchema(retrieval, { $schema: draft, [id]: canonical, $ref: "defs.json" });
            registry.addRemoteSchema(legacy ? localDefs : canonicalDefs, { $schema: draft, type: "string" });
            registry.addRemoteSchema(legacy ? canonicalDefs : localDefs, { $schema: draft, type: "number" });
            const remote = registry.context.remotes[retrieval];
            assert.equal(remote.$id, legacy ? retrieval : canonical);
            assert.deepEqual(["ok", 1].map((value) => remote.validate(value).valid), [true, false]);
            if (legacy) assert.equal(registry.context.remotes[canonical], undefined);
            else assert.equal(registry.context.remotes[canonical], remote);
        });

        it("keeps canonical and retrieval aliases on the same resource", () => {
            const registry = compileSchema({ $schema: draft });
            const document = { $schema: draft, [id]: "../canonical/r.json", properties: { value: { $ref: "defs.json" } } };
            registry.addRemoteSchema(retrieval, document);
            registry.addRemoteSchema(canonicalDefs, { $schema: draft, type: "string" });
            registry.addRemoteSchema(localDefs, { $schema: draft, type: "number" });
            assert.equal(registry.context.remotes[retrieval], registry.context.remotes[canonical]);
            for (const uri of [retrieval, canonical]) {
                const node = compileSchema({ $schema: draft, $ref: uri }, { remote: registry });
                assert.deepEqual([{ value: "ok" }, { value: 1 }].map((value) => node.validate(value).valid), [true, false]);
                const target = registry.getNodeRef(`${uri}#/properties/value`);
                assert.ok(isSchemaNode(target));
                assert.deepEqual(["ok", 1].map((value) => target.validate(value).valid), [true, false]);
            }
        });

        it("retains the base of the first options.remotes document", () => {
            const node = compileSchema({ $schema: draft, $ref: retrieval }, { remotes: [
                { $schema: draft, $id: retrieval, [id]: retrieval, $ref: "defs.json" },
                { $schema: draft, $id: localDefs, [id]: localDefs, type: "string" }
            ] });
            assert.deepEqual(["ok", 1].map((value) => node.validate(value).valid), [true, false]);
        });

        it("retains absolute-reference and missing-reference controls", () => {
            const registry = compileSchema({ $schema: draft });
            registry.addRemoteSchema(retrieval, { $schema: draft, $ref: localDefs });
            registry.addRemoteSchema(localDefs, { $schema: draft, type: "string" });
            const node = compileSchema({ $schema: draft, $ref: retrieval }, { remote: registry });
            assert.deepEqual(["ok", 1].map((value) => node.validate(value).valid), [true, false]);
            registry.addRemoteSchema("https://e.test/catalog/missing-root.json", { $schema: draft, $ref: "missing.json" });
            const missing = registry.context.remotes["https://e.test/catalog/missing-root.json"].resolveRef();
            assert.ok(isJsonError(missing));
            assert.equal(missing.data.ref, "https://e.test/catalog/missing.json");
        });
    });
}

it("does not change an authored document when registering it under another retrieval URI", () => {
    const registry = compileSchema({});
    const document = Object.freeze({ $ref: "defs.json" });
    registry.addRemoteSchema(retrieval, document);
    registry.addRemoteSchema("https://e.test/other/r.json", document);
    registry.addRemoteSchema(localDefs, { type: "string" });
    registry.addRemoteSchema("https://e.test/other/defs.json", { type: "number" });
    assert.deepEqual(["ok", 1].map((value) => registry.context.remotes[retrieval].validate(value).valid), [true, false]);
    assert.deepEqual(["ok", 1].map((value) => registry.context.remotes["https://e.test/other/r.json"].validate(value).valid), [false, true]);
    assert.deepEqual(document, { $ref: "defs.json" });
});

it("resolves dynamic references through a supplied retrieval alias", () => {
    const registry = compileSchema({});
    registry.addRemoteSchema(retrieval, { $id: canonical, $dynamicAnchor: "node", type: "number" });
    const node = compileSchema({
        $id: "https://e.test/outer", $defs: { override: { $dynamicAnchor: "node", type: "string" } },
        $dynamicRef: `${retrieval}#node`
    }, { remote: registry });
    const anchors = { ...node.context.dynamicAnchors };
    assert.deepEqual(["ok", 1].map((value) => node.validate(value).valid), [true, false]);
    assert.deepEqual(node.context.dynamicAnchors, anchors);
});
