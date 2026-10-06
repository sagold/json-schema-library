import { strict as assert } from "assert";
import { compileSchema } from "./compileSchema";
import { isJsonError, isSchemaNode, JsonError, SchemaNode } from "./types";
import { remotes } from "../remotes";

// Setup traversal uses context plus location to terminate authored reference cycles.
function reachable(root: SchemaNode) {
    const visited = new Map<SchemaNode["context"], Set<string>>();
    const targets: (SchemaNode | JsonError)[] = [];
    function visit(node: SchemaNode) {
        for (const child of node.toSchemaNodes()) {
            const locations = visited.get(child.context) ?? new Set<string>();
            visited.set(child.context, locations);
            if (locations.has(child.schemaLocation)) {
                continue;
            }
            locations.add(child.schemaLocation);
            targets.push(child);
            const target = child.resolveRef();
            if (isJsonError(target)) {
                targets.push(target);
            } else if (target !== child) {
                visit(target);
            }
        }
    }
    visit(root);
    return targets;
}

for (const draft of ["draft-06", "draft-07"]) {
    it(`should ignore newer reference keywords while preserving static references (${draft})`, () => {
        for (const withRef of [false, true]) {
            const constraint = { type: "string", minLength: 2 };
            const node = compileSchema({
                $schema: draft,
                $dynamicRef: "https://example.test/unregistered",
                ...(withRef ? { $ref: "#/definitions/text", definitions: { text: constraint } } : constraint)
            });
            const target = node.resolveRef();
            assert.ok(isSchemaNode(target));
            assert.equal(target.type, "string");
            assert.deepEqual(["valid", 1, "x"].map((value) => node.validate(value).valid), [true, false, false]);
        }
    });
}

for (const [draft, anchor, ref, refValue] of [
    ["2019-09", "$recursiveAnchor", "$recursiveRef", "#"],
    ["2020-12", "$dynamicAnchor", "$dynamicRef", "#node"]
]) {
    describe(`adjacent references (${draft})`, () => {
        function compile(staticRef = "https://example.test/id", dynamicRef = refValue) {
            return compileSchema({
                $schema: `https://json-schema.org/draft/${draft}/schema`,
                $id: "https://example.test/root",
                [anchor]: draft === "2019-09" ? true : "node",
                type: "object",
                required: ["label"],
                properties: {
                    label: { type: "string", deprecated: true },
                    child: { $ref: staticRef, [ref]: dynamicRef, unevaluatedProperties: false }
                }
            }).addRemoteSchema("https://example.test/id", {
                $schema: `https://json-schema.org/draft/${draft}/schema`,
                type: "object",
                required: ["id"],
                properties: { id: { type: "string", minLength: 1, deprecated: true } }
            });
        }

        it("should apply both references and retain annotations without mutating authored registries", () => {
            const node = compile();
            const schema = structuredClone(node.schema);
            const refs = { ...node.context.refs };
            const remoteRefs = { ...node.context.remotes["https://example.test/id"].context.refs };
            const anchors = { ...node.context.anchors };
            const dynamicAnchors = { ...node.context.dynamicAnchors };
            for (const [child, valid] of [
                [{ id: "a", label: "b" }, true],
                [{ label: "b" }, false],
                [{ id: "a" }, false],
                [{ id: "", label: "b" }, false],
                [{ id: "a", label: "b", extra: true }, false],
                [{ id: "a", label: "b" }, true]
            ] as const) {
                assert.equal(node.validate({ label: "root", child }).valid, valid, JSON.stringify(child));
            }
            const data = { label: "root", child: { id: "a", label: "b" } };
            assert.deepEqual(
                node.validate(data).annotations.map((entry) => entry.data.pointer).sort(),
                ["#/child/id", "#/child/label", "#/label"]
            );
            assert.equal(node.getNode("#/child/id", data).node?.type, "string");
            assert.equal(node.getNode("#/child/label", data).node?.type, "string");
            assert.deepEqual(node.schema, schema);
            assert.deepEqual(node.context.refs, refs);
            assert.deepEqual(node.context.remotes["https://example.test/id"].context.refs, remoteRefs);
            assert.deepEqual(node.context.anchors, anchors);
            assert.deepEqual(node.context.dynamicAnchors, dynamicAnchors);
        });

        it("should expose both reference targets to schema traversal", () => {
            const node = compile();
            const child = node.toSchemaNodes().find((child) => child.schemaLocation.endsWith("/child"));
            assert.ok(child);
            const conjunction = child.resolveRef();
            assert.ok(isSchemaNode(conjunction));
            assert.notEqual(conjunction.schemaLocation, child.schemaLocation);
            assert.ok(conjunction.dynamicId);
            assert.equal(new Set(conjunction.allOf!.map((entry) => entry.schemaLocation)).size, 2);
            const targets = reachable(node);
            assert.ok(targets.some((target) =>
                isSchemaNode(target) && target.required?.includes("id") &&
                target.context === node.context.remotes["https://example.test/id"].context &&
                target.schemaLocation === "#"
            ));
            assert.ok(targets.some((target) => isSchemaNode(target) && target.required?.includes("label")));
        });

        it("should expose and refuse an unresolved adjacent static reference", () => {
            const node = compile("https://example.test/missing");
            const child = node.properties!.child;
            const conjunction = child.resolveRef();
            assert.ok(isSchemaNode(conjunction));
            const errors = reachable(node).filter(isJsonError);
            assert.ok(errors.some((error) => error.code === "ref-error"));
            const result = node.validate({ label: "root", child: { id: "a", label: "b" } });
            assert.equal(result.valid, false);
            assert.ok(result.errors.some((error) => error.code === "ref-error"));
        });

        it("should expose an invalid static target beside a valid dynamic target for meta-validation", () => {
            const node = compile();
            node.addRemoteSchema("https://example.test/id", {
                $schema: `https://json-schema.org/draft/${draft}/schema`,
                minLength: -1
            });
            const target = reachable(node).find((entry) => isSchemaNode(entry) && entry.schema.minLength === -1);
            assert.ok(isSchemaNode(target));
            const meta = compileSchema(
                { $ref: `https://json-schema.org/draft/${draft}/schema` },
                { draft: `draft-${draft}` }
            );
            for (const schema of remotes) {
                meta.addRemoteSchema(schema.$id ?? schema.id, structuredClone(schema));
            }
            assert.equal(meta.validate(target.schema).valid, false);
            assert.equal(meta.validate({ ...target.schema, minLength: 1 }).valid, true);
        });

        if (draft === "2020-12") {
            for (const layout of ["adjacent", "allOf"]) {
                it(`should keep ${layout} dynamic scope branch-local during validation and navigation`, () => {
                    const node = compileSchema({
                        $schema: "https://json-schema.org/draft/2020-12/schema",
                        ...(layout === "adjacent"
                            ? { $ref: "https://example.test/a#node", $dynamicRef: "https://example.test/b#node" }
                            : { allOf: [{ $ref: "https://example.test/a#node" }, { $dynamicRef: "https://example.test/b#node" }] })
                    });
                    for (const key of ["id", "label"]) {
                        node.addRemoteSchema(`https://example.test/${key === "id" ? "a" : "b"}`, {
                            $dynamicAnchor: "node",
                            type: "object",
                            required: [key],
                            properties: {
                                [key]: { type: "string" },
                                ...(key === "label" ? { child: { $dynamicRef: "#node" } } : {})
                            }
                        });
                    }
                    const data = { id: "a", label: "b", child: { label: "child" } };
                    assert.equal(node.validate(data).valid, true);
                    assert.equal(node.validate({ ...data, child: { id: "wrong scope" } }).valid, false);
                    const child = node.getNode("#/child", data).node;
                    assert.ok(child);
                    assert.deepEqual(child.required, ["label"]);
                    assert.equal(child.validate(data.child).valid, true);
                    assert.equal(node.validate(data).valid, true);
                });
            }

            it("should retain overlapping constraints rather than merge away a reference", () => {
                const node = compileSchema({
                    $ref: "#/$defs/a",
                    $dynamicRef: "#/$defs/b",
                    $defs: { a: { type: "string", minLength: 3 }, b: { type: "string", minLength: 1, maxLength: 4 } }
                });
                assert.deepEqual(["a", "abc", "abcde"].map((value) => node.validate(value).valid), [false, true, false]);
            });

            it("should refuse an unresolved adjacent dynamic reference", () => {
                const node = compile("https://example.test/id", "#missing");
                const result = node.validate({ label: "root", child: { id: "a", label: "b" } });
                assert.equal(result.valid, false);
                assert.ok(result.errors.some((error) => error.code === "ref-error"));
            });
        }
    });
}
