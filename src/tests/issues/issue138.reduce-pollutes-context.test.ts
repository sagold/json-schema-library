import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { isJsonError, isSchemaNode } from "../../types";

describe("issue#138 - derived nodes should not update context refs", () => {
    it("reduceNode should not replace node context.refs", () => {
        const root = compileSchema(
            {
                $schema: "http://json-schema.org/draft-07/schema#",
                $id: "https://example.test/tree",
                type: "object",
                properties: {
                    enabled: { type: "boolean" },
                    child: { $ref: "#" }
                },
                if: { required: ["enabled"] },
                then: { required: ["name"] }
            },
            { draft: "draft-7" }
        );

        const rootRef = root.context.refs["https://example.test/tree"];
        root.reduceNode({ enabled: true });
        const rootRefAfter = root.context.refs["https://example.test/tree"];

        assert(rootRef === rootRefAfter);
    });

    it("getNodeChild should not register inferred schemas", () => {
        const root = compileSchema({ type: "object" });
        const refs = { ...root.context.refs };

        const { node, error } = root.getNodeChild("extra", { extra: { count: 1 } }, { createSchema: true });

        assert.equal(error, undefined);
        assert(node);
        assert.equal(node.validate({ count: 1 }).valid, true);
        assert.equal(node.validate({ count: "invalid" }).valid, false);
        assert.deepEqual(Object.keys(root.context.refs), Object.keys(refs));
        Object.entries(refs).forEach(([ref, target]) => assert(root.context.refs[ref] === target));
        assert.equal(root.getNodeChild("extra").node, undefined);
    });

    it("inferred nodes should keep added remotes through reference lookups", () => {
        for (const draft of ["draft-04", "draft-2020-12"]) {
            const remoteId = "https://example.test/remote";
            const root = compileSchema(
                {
                    type: "object",
                    definitions: { entry: { $ref: `${remoteId}#/definitions/count` } }
                },
                { draft }
            );
            const { node } = root.getNodeChild("extra", { extra: 1 }, { createSchema: true });
            assert(node);

            node.addRemoteSchema(remoteId, { id: remoteId, definitions: { count: { type: "integer" } } });
            for (const ref of [`${remoteId}#/definitions/count`, "#/definitions/entry"]) {
                const target = node.getNodeRef(ref);
                assert(isSchemaNode(target));
                assert.equal(target.validate(1).valid, true);
                assert.equal(target.validate("invalid").valid, false);
            }
            assert.equal(root.context.remotes[remoteId], undefined);
        }
    });

    it("getNodeChild should preserve refs and anchors when resolving pattern properties", () => {
        for (const draft of ["draft-2019-09", "draft-2020-12"]) {
            const definitions = {
                entry: {
                    type: "object",
                    properties: { count: { $ref: "#count" } }
                },
                count: { $anchor: "count", type: "integer", minimum: 0 }
            };
            const remoteId = "https://example.test/remote";
            const root = compileSchema(
                {
                    $defs: definitions,
                    patternProperties: {
                        "^x": { $ref: "#/$defs/entry" },
                        "^y": { $ref: `${remoteId}#/$defs/entry` },
                        "^e": { $ref: `${remoteId}#/$defs/%65ntry` },
                        "^z": { $ref: `${remoteId}#/$defs/missing` }
                    }
                },
                { draft }
            );
            root.addRemoteSchema(remoteId, { $defs: definitions });
            const remote = root.context.remotes[remoteId];
            const refs = { ...root.context.refs };
            const anchor = root.context.anchors["#count"];
            const remoteRefs = { ...remote.context.refs };
            const remoteAnchor = remote.context.anchors[`${remoteId}#count`];

            for (const key of ["xOne", "yOne", "encoded"]) {
                const { node, error } = root.getNodeChild(key, { [key]: { count: 1 } });
                assert.equal(error, undefined);
                assert(node);
                assert.equal(node.validate({ count: 1 }).valid, true);
                assert.equal(node.validate({ count: -1 }).valid, false);
                assert.deepEqual(Object.keys(root.context.refs), Object.keys(refs));
                Object.entries(refs).forEach(([ref, target]) => assert(root.context.refs[ref] === target));
                assert(root.context.anchors["#count"] === anchor);
                assert.deepEqual(Object.keys(remote.context.refs), Object.keys(remoteRefs));
                Object.entries(remoteRefs).forEach(([ref, target]) => assert(remote.context.refs[ref] === target));
                assert(remote.context.anchors[`${remoteId}#count`] === remoteAnchor);
            }
            const missing = root.getNodeChild("zOne", { zOne: 1 });
            const error = missing.error ?? missing.node;
            assert(isJsonError(error));
            assert.equal(error.code, "ref-error");
        }
    });

    it("getNodeChild should preserve draft-04 refs through nested lookups", () => {
        const first = "https://example.test/first";
        const second = "https://example.test/second";
        const root = compileSchema(
            {
                definitions: {
                    entry: {
                        type: "object",
                        properties: { count: { $ref: "#/definitions/count" } }
                    },
                    count: { type: "integer", minimum: 0 }
                },
                patternProperties: {
                    "^x": { $ref: "#/definitions/entry" },
                    "^y": { $ref: `${first}#/$defs/entry` }
                }
            },
            { draft: "draft-04" }
        );
        root.addRemoteSchema(first, {
            id: first,
            definitions: { entry: { type: "object", properties: { count: { $ref: `${second}#/definitions/count` } } } }
        });
        root.addRemoteSchema(second, { id: second, definitions: { count: { type: "integer", minimum: 0 } } });
        const registries = [root, root.context.remotes[first], root.context.remotes[second]].map((node) => ({
            refs: node.context.refs,
            entries: { ...node.context.refs }
        }));

        for (const key of ["xOne", "xTwo", "yOne"]) {
            const { node, error } = root.getNodeChild(key, { [key]: { count: 1 } });
            assert.equal(error, undefined);
            assert(node);
            assert.equal(node.validate({ count: 1 }).valid, true);
            const { node: count } = node.getNodeChild("count");
            assert(count);
            assert.equal(count.validate(1).valid, true);
            assert.equal(count.validate(-1).valid, false);
            for (const { refs, entries } of registries) {
                assert.deepEqual(Object.keys(refs), Object.keys(entries));
                Object.entries(entries).forEach(([ref, target]) => assert(refs[ref] === target));
            }
        }
    });
});
