import { strict as assert } from "assert";
import { compileSchema } from "./compileSchema";
import { JsonSchema } from "./types";

describe("reference validation scope", () => {
    for (const [draft, anchor, ref] of [
        ["2019-09", "$anchor", "$ref"],
        ["2020-12", "$anchor", "$ref"],
        ["2020-12", "$dynamicAnchor", "$dynamicRef"]
    ]) {
        it(`should retain authored anchors reached through a pointer (${draft}, ${ref})`, () => {
            const node = compileSchema({
                $schema: `https://json-schema.org/draft/${draft}/schema`,
                extension: {
                    tree: {
                        [anchor]: "node",
                        type: "object",
                        properties: { value: { type: "number" }, child: { [ref]: "#node" } },
                        required: ["value"]
                    }
                },
                properties: { tree: { $ref: "#/extension/tree" } }
            });
            const valid = { tree: { value: 1, child: { value: 2 } } };
            assert.equal(node.validate(valid).valid, true);
            const authored = node.context.refs["#/extension/tree"];
            assert.ok(authored);
            assert.equal(authored.schemaLocation, "#/extension/tree");
            assert.equal(authored.dynamicId, "");
            const keys = Object.keys(node.context.refs);
            assert.equal(node.validate({ tree: { value: 1, child: { value: "invalid" } } }).valid, false);
            assert.equal(node.validate(valid).valid, true);
            assert.deepEqual(Object.keys(node.context.refs), keys);
            assert.equal(node.context.refs["#/extension/tree"], authored);
        });
    }

    for (const value of [true, false]) {
        it(`should resolve a boolean schema reached through a pointer (${value})`, () => {
            const node = compileSchema({ extension: { value }, $ref: "#/extension/value" });
            const resolved = node.resolveRef();
            assert.equal(resolved.schema, value);
            assert.equal(resolved.schemaLocation, "#/extension/value");
            assert.equal(node.validate("input").valid, value);
        });
    }

    for (const [draft, anchor, ref] of [
        ["2019-09", "$recursiveAnchor", "$recursiveRef"],
        ["2020-12", "$dynamicAnchor", "$dynamicRef"]
    ]) {
        const $schema = `https://json-schema.org/draft/${draft}/schema`;
        const anchorValue = draft === "2019-09" ? true : "node";
        const refValue = draft === "2019-09" ? "#" : "#node";
        const aRef = { $ref: "https://example.com/a" };
        const bRef = { $ref: "https://example.com/b" };
        const a = { kind: "A" };
        const b = { kind: "B", child: { kind: "B" } };
        const invalidB = { kind: "B", child: { kind: "A" } };

        function compile(schema: JsonSchema) {
            const node = compileSchema({ $schema, ...schema });
            for (const kind of ["A", "B"]) {
                const $id = `https://example.com/${kind.toLowerCase()}`;
                node.addRemoteSchema($id, {
                    $schema,
                    $id,
                    [anchor]: anchorValue,
                    type: "object",
                    required: ["kind"],
                    properties: {
                        kind: { const: kind },
                        child: { [ref]: refValue }
                    }
                });
            }
            return node;
        }

        for (const [name, schema] of Object.entries({
            properties: { properties: { a: aRef, b: bRef } },
            allOf: { allOf: [{ properties: { a: aRef } }, { properties: { b: bRef } }] }
        })) {
            it(`should isolate sibling ${name} resources (${draft})`, () => {
                const node = compile(schema);
                assert.equal(node.validate({ b }).valid, true);
                assert.equal(node.validate({ a, b }).valid, true);
                assert.equal(node.validate({ b: invalidB }).valid, false);
                assert.equal(node.validate({ a, b: invalidB }).valid, false);
            });
        }

        it(`should isolate a reference from adjacent keywords (${draft})`, () => {
            const node = compile({ ...aRef, properties: { b: bRef } });
            assert.equal(node.validate({ kind: "A", b }).valid, true);
            assert.equal(node.validate({ kind: "A", b: invalidB }).valid, false);
        });

        it(`should discard a failed anyOf branch's scope (${draft})`, () => {
            const node = compile({ anyOf: [aRef, bRef] });
            assert.equal(node.validate(b).valid, true);
            assert.equal(node.validate(invalidB).valid, false);
            assert.equal(node.validate({ kind: "A", child: a }).valid, true);
        });

        it(`should preserve the outer recursive resource while evaluating descendants (${draft})`, () => {
            const node = compile({
                $id: "https://example.com/extended-b",
                [anchor]: anchorValue,
                $ref: bRef.$ref,
                required: ["label"]
            });
            assert.equal(node.validate({ kind: "B", label: "root", child: { kind: "B", label: "child" } }).valid, true);
            assert.equal(node.validate({ kind: "B", label: "root", child: { kind: "B" } }).valid, false);
        });
    }

    for (const [name, anchor, expectedKind, rejectedKind] of [
        ["omitted", {}, "B", "A"],
        ["false", { $recursiveAnchor: false }, "B", "A"],
        ["true", { $recursiveAnchor: true }, "A", "B"]
    ] as const) {
        it(`should gate recursive rebinding on the initial target's anchor (${name})`, () => {
            const $schema = "https://json-schema.org/draft/2019-09/schema";
            const node = compileSchema({
                $schema,
                $id: "https://example.com/a",
                $recursiveAnchor: true,
                type: "object",
                required: ["kind"],
                properties: { kind: { const: "A" }, b: { $ref: "https://example.com/b" } }
            }).addRemoteSchema("https://example.com/b", {
                $schema,
                $id: "https://example.com/b",
                ...anchor,
                type: "object",
                required: ["kind"],
                properties: { kind: { const: "B" }, child: { $recursiveRef: "#" } }
            });
            const valid = { kind: "A", b: { kind: "B", child: { kind: expectedKind } } };
            assert.deepEqual(
                [
                    node.validate(valid).valid,
                    node.validate({ kind: "A", b: { kind: "B", child: { kind: rejectedKind } } }).valid,
                    node.validate({ kind: "A", b: { kind: "B", child: 1 } }).valid
                ],
                [true, false, false]
            );
            assert.equal(
                node.getNode("#/b/child/kind", valid, { path: [{ pointer: "#", node }] }).node?.schema.const,
                expectedKind
            );
            assert.equal(node.validate(valid).valid, true);
        });
    }

    for (const base of ["https://example.test/", "urn:example:"]) {
        for (const [name, anchor, expectedKind] of [
            ["omitted", {}, "C"],
            ["false", { $recursiveAnchor: false }, "C"],
            ["true", { $recursiveAnchor: true }, "A"]
        ] as const) {
            it(`should stop recursive scope at non-enabled intermediate resources (${base}, ${name})`, () => {
                const $schema = "https://json-schema.org/draft/2019-09/schema";
                const node = compileSchema({
                    $schema,
                    $id: `${base}a`,
                    $recursiveAnchor: true,
                    type: "object",
                    required: ["kind"],
                    properties: { kind: { const: "A" }, b: { $ref: `${base}b` } }
                }).addRemoteSchema(`${base}b`, {
                    $schema,
                    $id: `${base}b`,
                    ...anchor,
                    properties: { c: { $ref: `${base}c` } }
                }).addRemoteSchema(`${base}c`, {
                    $schema,
                    $id: `${base}c`,
                    $recursiveAnchor: true,
                    type: "object",
                    required: ["kind"],
                    properties: { kind: { const: "C" }, child: { $recursiveRef: "#" } }
                });
                const b = node.properties!.b.resolveRef();
                const c = b.properties!.c.resolveRef();
                const target = c.properties!.child.resolveRef({ path: [node, b, c].map((node) => ({ pointer: "#", node })) });
                assert.equal(target.$id, `${base}${expectedKind.toLowerCase()}`);
                const wrap = (kind: string) => ({ kind: "A", b: { c: { kind: "C", child: { kind } } } });
                assert.equal(node.validate(wrap(expectedKind)).valid, true);
                assert.equal(node.validate(wrap(expectedKind === "C" ? "A" : "C")).valid, false);
                assert.equal(node.getNode("#/b/c/child/kind", wrap(expectedKind), { path: [{ pointer: "#", node }] }).node?.schema.const, expectedKind);
                assert.equal(node.validate(wrap(expectedKind)).valid, true);
            });
        }
    }

    it("should isolate referenced resources when checking unevaluated properties", () => {
        const $schema = "https://json-schema.org/draft/2020-12/schema";
        const node = compileSchema({
            $schema,
            allOf: [{ $ref: "https://example.com/a" }, { $ref: "https://example.com/b" }],
            unevaluatedProperties: false
        });
        for (const kind of ["A", "B"]) {
            node.addRemoteSchema(`https://example.com/${kind.toLowerCase()}`, {
                $schema,
                properties: { [kind.toLowerCase()]: { $ref: "#node" } },
                $defs: {
                    node: {
                        $dynamicAnchor: "node",
                        type: "object",
                        required: ["kind"],
                        properties: { kind: { const: kind }, child: { $dynamicRef: "#node" } }
                    }
                }
            });
        }
        const data = { a: { kind: "A" }, b: { kind: "B", child: { kind: "B" } } };
        assert.equal(node.validate(data).valid, true);
        assert.equal(node.validate({ ...data, unexpected: true }).valid, false);
        assert.equal(node.validate({ ...data, b: { kind: "B", child: { kind: "A" } } }).valid, false);
    });

    it("should ignore differently named dynamic anchors in the current scope", () => {
        const node = compileSchema({
            $schema: "https://json-schema.org/draft/2020-12/schema",
            $dynamicAnchor: "other",
            type: "object",
            required: ["b"],
            properties: { b: { $ref: "https://example.com/b" } }
        }).addRemoteSchema("https://example.com/b", {
            $schema: "https://json-schema.org/draft/2020-12/schema",
            $dynamicAnchor: "node",
            type: "object",
            required: ["kind"],
            properties: { kind: { const: "B" }, child: { $dynamicRef: "#node" } }
        });
        assert.equal(node.validate({ b: { kind: "B", child: { kind: "B" } } }).valid, true);
        assert.equal(node.validate({ b: { kind: "B", child: { kind: "A" } } }).valid, false);
    });

    it("should resolve a dynamic reference without an anchor fragment as an ordinary reference", () => {
        const node = compileSchema({
            $schema: "https://json-schema.org/draft/2020-12/schema",
            $dynamicAnchor: "node",
            type: "object",
            properties: { value: { $dynamicRef: "#/$defs/value" } },
            $defs: { value: { type: "integer" } }
        });
        assert.equal(node.validate({ value: 1 }).valid, true);
        assert.equal(node.validate({ value: "invalid" }).valid, false);
    });
});
