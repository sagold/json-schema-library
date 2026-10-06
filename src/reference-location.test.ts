import { strict as assert } from "assert";
import { compileSchema } from "./compileSchema";
import { isJsonError, isSchemaNode } from "./types";
import { remotes } from "../remotes";

describe("reference child locations", () => {
    for (const draft of ["draft-07", "draft-2019-09", "draft-2020-12"]) {
        for (const container of ["$defs", "extension"]) {
            const targetLocation = `#/${container}/target`;
            const childLocation = container === "$defs" ? "#/%24defs/target" : targetLocation;

            it(`should retain authored conditional and contains locations (${draft}, ${container})`, () => {
                const root = compileSchema({
                    $schema: draft,
                    [container]: {
                        target: {
                            if: { type: "string" },
                            then: { $ref: `#/${container}/text` },
                            else: { type: "array", contains: { $ref: `#/${container}/text` } }
                        },
                        text: { type: "string", minLength: 1 }
                    },
                    properties: { x: { $ref: targetLocation } }
                });
                const expanded = root.properties!.x.resolveRef();
                assert.ok(isSchemaNode(expanded));
                const authored = root.context.refs[targetLocation] ?? root.context.refs[childLocation];
                assert.ok(isSchemaNode(authored));
                for (const node of [authored, expanded]) {
                    assert.equal(node.if!.schemaLocation, `${childLocation}/if`);
                    assert.equal(node.then!.schemaLocation, `${childLocation}/then`);
                    assert.equal(node.else!.schemaLocation, `${childLocation}/else`);
                    assert.equal(node.else!.contains!.schemaLocation, `${childLocation}/else/contains`);
                }
                assert.equal(decodeURIComponent(authored.then!.evaluationPath), `${targetLocation}/then`);
                assert.equal(expanded.then!.evaluationPath, "#/properties/x/$ref/then");
                assert.equal(root.validate({ x: "ok" }).valid, true);
                assert.equal(root.validate({ x: ["ok"] }).valid, true);
                assert.equal(root.validate({ x: "" }).valid, false);
                assert.equal(root.validate({ x: [""] }).valid, false);
            });

            it(`should expose an unresolved conditional reference by its location (${draft}, ${container})`, () => {
                const missing = `#/${container}/missing`;
                const root = compileSchema({
                    $schema: draft,
                    [container]: { target: { if: { type: "number" }, then: { $ref: missing } } },
                    properties: { x: { $ref: targetLocation } }
                });
                const expanded = root.properties!.x.resolveRef();
                assert.ok(isSchemaNode(expanded));
                const reachable = expanded.toSchemaNodes().find(
                    (node) => node.schemaLocation === `${childLocation}/then`
                );
                assert.ok(reachable);
                const result = reachable.resolveRef();
                assert.ok(isJsonError(result));
                assert.equal(result.code, "ref-error");
                assert.ok(typeof result.data.ref === "string");
                assert.equal(decodeURIComponent(result.data.ref), missing);
            });

            it(`should expose a malformed conditional target for meta-validation (${draft}, ${container})`, () => {
                const root = compileSchema({
                    $schema: draft,
                    [container]: {
                        target: { if: { type: "string" }, then: { $ref: `#/${container}/text` } },
                        text: { minLength: -1 }
                    },
                    properties: { x: { $ref: targetLocation } }
                });
                const expanded = root.properties!.x.resolveRef();
                assert.ok(isSchemaNode(expanded));
                const reachable = expanded.toSchemaNodes().find(
                    (node) => node.schemaLocation === `${childLocation}/then`
                );
                assert.ok(reachable);
                const target = reachable.resolveRef();
                assert.ok(isSchemaNode(target));
                const metaId =
                    draft === "draft-07"
                        ? "http://json-schema.org/draft-07/schema#"
                        : `https://json-schema.org/draft/${draft.slice(6)}/schema`;
                const meta = compileSchema({ $ref: metaId }, { draft });
                for (const schema of remotes) {
                    meta.addRemoteSchema(schema.$id ?? schema.id, structuredClone(schema));
                }
                assert.equal(meta.validate(target.schema).valid, false);
                assert.equal(meta.validate({ ...target.schema, minLength: 1 }).valid, true);
            });
        }
    }

    it("should retain a referenced contains location in draft-06", () => {
        const root = compileSchema({
            $schema: "draft-06",
            definitions: { target: { type: "array", contains: { type: "number" } } },
            properties: { x: { $ref: "#/definitions/target" } }
        });
        const target = root.properties!.x.resolveRef();
        assert.ok(isSchemaNode(target));
        assert.equal(target.contains!.schemaLocation, "#/definitions/target/contains");
        assert.equal(root.validate({ x: [1] }).valid, true);
        assert.equal(root.validate({ x: ["invalid"] }).valid, false);
    });

    it("should preserve encoded pointer tokens when compiling a child of an expansion", () => {
        const root = compileSchema({
            extension: { "a/b~ %": { custom: { "$ref/name~ %": { type: "number" } } } },
            properties: { x: { $ref: "#/extension/a~1b~0%20%25" } }
        });
        const target = root.properties!.x.resolveRef();
        assert.ok(isSchemaNode(target));
        const child = target.compileSchema(
            target.schema.custom["$ref/name~ %"],
            `${target.evaluationPath}/custom/%24ref~1name~0%20%25`
        );
        assert.equal(child.schemaLocation, "#/extension/a~1b~0%20%25/custom/%24ref~1name~0%20%25");
        assert.equal(child.validate(1).valid, true);
        assert.equal(child.validate("invalid").valid, false);
    });

    it("should retain the same location for omitted or unchanged evaluation paths", () => {
        const root = compileSchema({ properties: { x: { type: ["string", "number"] } } });
        const node = root.properties!.x;
        assert.equal(node.compileSchema({}).schemaLocation, "#/properties/x");
        assert.equal(node.compileSchema({}, node.evaluationPath).schemaLocation, "#/properties/x");
        const reduced = node.reduceNode("text").node;
        assert.ok(reduced);
        assert.equal(reduced.schemaLocation, "#/properties/x");
        assert.equal(reduced.type, "string");
    });

    it("should preserve synthetic reference lookups and non-descendant paths", () => {
        const root = compileSchema({
            properties: { x: {} },
            $defs: { text: { type: "string", minLength: 1 } }
        });
        const node = root.properties!.x;
        const target = node.getNodeRef("#/$defs/text");
        assert.ok(isSchemaNode(target));
        assert.equal(target.evaluationPath, "$dynamic/$ref");
        assert.equal(target.schemaLocation, "#/$defs/text");
        assert.equal(target.validate("ok").valid, true);
        assert.equal(target.validate("").valid, false);
        assert.equal(node.compileSchema({}, "#/properties/xy").schemaLocation, "#/properties/x/properties/xy");
        assert.equal(node.compileSchema({}, "$dynamic").schemaLocation, "#/properties/x/%24dynamic");
    });
});

describe("registered remote fragments", () => {
    const uri = "https://example.test/old";
    const fragment = "#/definitions/tuple";
    const tuple = { type: "array", items: [{ type: "string" }], additionalItems: false };
    const remoteSchema = () => ({
        $schema: "http://json-schema.org/draft-07/schema#",
        $ref: fragment,
        definitions: { tuple: structuredClone(tuple) }
    });

    // Exercise each reference resolver with a separately registered draft-07 document.
    for (const draft of [undefined, "draft-2019-09", "draft-04"]) {
        it(`should resolve a fragment below a remote root reference (${draft ?? "default"})`, () => {
            const node = compileSchema({ ...(draft ? { $schema: draft } : {}), $ref: `${uri}${fragment}` });
            node.addRemoteSchema(uri, remoteSchema());
            const remote = node.context.remotes[uri];
            const refs = { ...remote.context.refs };
            const target = node.resolveRef();
            assert.ok(isSchemaNode(target));
            assert.equal(target === node || target === remote, false);
            assert.equal(target.context.rootNode === remote, true);
            assert.equal(target.getDraftVersion(), "draft-07");
            assert.equal(target.schemaLocation, fragment);
            assert.deepEqual(target.schema, tuple);
            assert.deepEqual(
                [["ok"], [1], ["ok", "extra"]].map((value) => node.validate(value).valid),
                [true, false, false]
            );
            assert.equal(node.validate(["ok"]).valid, true);
            assert.deepEqual(remote.context.refs, refs);
        });

        it(`should refuse a missing fragment below a remote root reference (${draft ?? "default"})`, () => {
            const ref = `${uri}#/definitions/missing`;
            const node = compileSchema({ ...(draft ? { $schema: draft } : {}), $ref: ref });
            node.addRemoteSchema(uri, remoteSchema());
            const target = node.resolveRef();
            assert.equal(isSchemaNode(target), false);
            if (isJsonError(target)) {
                assert.equal(target.code, "ref-error");
            }
            const result = node.validate(["ok"]);
            assert.equal(result.valid, false);
            assert.equal(result.errors[0].code, "ref-error");
        });
    }

    for (const control of ["root URI", "local fragment", "remote without root reference"]) {
        it(`should preserve the working ${control} control`, () => {
            const schema = remoteSchema();
            const node =
                control === "local fragment"
                    ? compileSchema(schema)
                    : compileSchema({ $ref: control === "root URI" ? uri : `${uri}${fragment}` });
            if (control !== "local fragment") {
                const { $schema, definitions } = schema;
                node.addRemoteSchema(uri, control === "root URI" ? schema : { $schema, definitions });
            }
            const target = node.resolveRef();
            assert.ok(isSchemaNode(target));
            const tupleNode = control === "root URI" ? target.resolveRef() : target;
            assert.ok(isSchemaNode(tupleNode));
            assert.deepEqual(tupleNode.schema, tuple);
            assert.deepEqual(
                [["ok"], [1], ["ok", "extra"]].map((value) => node.validate(value).valid),
                [true, false, false]
            );
        });
    }
});

describe("empty URI references", () => {
    for (const draft of ["draft-04", "draft-06", "draft-07", "draft-2019-09", "draft-2020-12"]) {
        const id = draft === "draft-04" ? "id" : "$id";
        for (const base of ["anonymous", "named", "nested"]) {
            it(`should resolve an empty reference against the current resource (${draft}, ${base})`, () => {
                const schema = {
                    type: "object",
                    properties: { value: { type: "number" }, child: { $ref: "" } },
                    additionalProperties: false
                };
                const root = compileSchema({
                    $schema: draft,
                    ...(base === "anonymous" ? {} : { [id]: "https://example.com/root" }),
                    ...(base === "nested"
                        ? { type: "object", properties: { nested: { [id]: "nested", ...schema } } }
                        : schema)
                });
                const resource = base === "nested" ? root.properties!.nested : root;
                const ref = resource.properties!.child;
                const target = ref.resolveRef();
                assert.ok(isSchemaNode(target));
                // Check the target before validating recursive data.
                assert.equal(target === ref, false);
                assert.equal(target.schemaLocation, resource.schemaLocation);
                assert.equal(
                    ref.$ref,
                    base === "anonymous" ? "#" : `https://example.com/${base === "nested" ? "nested" : "root"}`
                );
                assert.equal(target.type, "object");
                assert.deepEqual(target.schema.properties, schema.properties);

                const wrap = (data: unknown) => (base === "nested" ? { nested: data } : data);
                const valid = wrap({ value: 1, child: { value: 2 } });
                assert.equal(root.validate(wrap({})).valid, true);
                assert.equal(root.validate(wrap({ child: {} })).valid, true);
                assert.equal(root.validate(valid).valid, true);
                assert.equal(root.validate(wrap({ child: 1 })).valid, false);
                assert.equal(root.validate(wrap({ child: { value: "invalid" } })).valid, false);
                assert.equal(root.validate(wrap({ child: { unexpected: true } })).valid, false);
                const pointer = base === "nested" ? "#/nested/child/value" : "#/child/value";
                assert.equal(root.getNode(pointer, valid).node?.type, "number");
                assert.equal(root.validate(valid).valid, true);
            });
        }

        it(`should apply the draft's sibling-keyword rules to an empty reference (${draft})`, () => {
            const root = compileSchema({
                $schema: draft,
                type: "object",
                properties: { child: { $ref: "", type: "string" } }
            });
            const ref = root.properties!.child;
            assert.equal(ref.resolveRef() === ref, false);
            const ignoresSiblings = ["draft-04", "draft-06", "draft-07"].includes(draft);
            assert.equal(root.validate({ child: {} }).valid, ignoresSiblings);
            assert.equal(root.validate({ child: "invalid" }).valid, false);
        });
    }
    it("should resolve an empty dynamic reference as an ordinary root reference", () => {
        const root = compileSchema({
            $schema: "draft-2020-12",
            type: "object",
            properties: { value: { type: "number" }, child: { $dynamicRef: "" } },
            additionalProperties: false
        });
        const ref = root.properties!.child;
        const target = ref.resolveRef();
        assert.ok(isSchemaNode(target));
        assert.equal(target === ref, false);
        assert.equal(target.schemaLocation, "#");
        assert.equal(root.validate({ value: 1, child: { value: 2 } }).valid, true);
        assert.equal(root.validate({ child: 1 }).valid, false);
        assert.equal(root.validate({ child: { value: "invalid" } }).valid, false);
    });
});

describe("anonymous root references", () => {
    for (const draft of ["draft-04", "draft-06", "draft-07", "draft-2019-09", "draft-2020-12"]) {
        it(`should validate recursive objects against the constrained document root (${draft})`, () => {
            const root = compileSchema({
                $schema: draft,
                type: "object",
                properties: { value: { type: "number" }, next: { $ref: "#" } },
                required: ["value"]
            });
            const valid = { value: 1, next: { value: 2 } };
            assert.equal(root.validate(valid).valid, true);
            assert.equal(root.validate({ value: 1, next: { value: "invalid" } }).valid, false);
            assert.equal(root.validate({ value: 1, next: {} }).valid, false);
            assert.equal(root.validate({ value: 1, next: 2 }).valid, false);
            const target = root.properties!.next.resolveRef();
            assert.ok(isSchemaNode(target));
            assert.equal(target.schemaLocation, "#");
            assert.deepEqual(target.schema, root.schema);
            assert.ok(root.context.refs["#"] === root);
            assert.equal(root.getNode("#/next/value", valid).node?.type, "number");
            assert.equal(root.validate(valid).valid, true);
        });
    }
});
