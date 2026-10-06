import { strict as assert } from "assert";
import { compileSchema } from "./compileSchema";
import { isSchemaNode, JsonSchema, SchemaNode } from "./types";
import { draft2020 } from "./draft2020";
import { extendDraft } from "./Draft";
import { propertyDependenciesKeyword } from "./keywords/propertyDependencies";
import { mergeNode } from "./mergeNode";

const outer = "https://example.test/outer";
const foreign = "https://example.test/foreign";
const selections: Record<string, (ref: JsonSchema) => JsonSchema> = {
    allOf: (ref) => ({ allOf: [ref] }),
    anyOf: (ref) => ({ anyOf: [ref] }),
    oneOf: (ref) => ({ oneOf: [ref] }),
    then: (ref) => ({ if: true, then: ref }),
    else: (ref) => ({ if: false, else: ref }),
    dependentSchemas: (ref) => ({ dependentSchemas: { x: ref } }),
    dependencies: (ref) => ({ dependencies: { x: ref } }),
    propertyDependencies: (ref) => ({ propertyDependencies: { x: { ok: ref } } })
};

function assertRetiredReference(node: SchemaNode) {
    assert.equal(node.schema.$ref, undefined);
    assert.equal(node.schema.$dynamicRef, undefined);
    assert.equal(node.schema.$recursiveRef, undefined);
    assert.equal(node.resolveRef() === node, true);
    assert.equal(node.validators.some((fn) => fn.toJSON?.() === "$ref"), false);
    assert.equal(node.reducers.some((fn) => fn.toJSON?.() === "$ref"), false);
}

function fixture(selection: string, dynamic: boolean) {
    const ref = dynamic ? { $dynamicRef: `${foreign}#node` } : { $ref: foreign };
    return compileSchema({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: outer,
        $defs: { override: { $dynamicAnchor: "node", type: "object", additionalProperties: { type: "string" } } },
        ...selections[selection](ref),
        unevaluatedProperties: false
    }, { drafts: [extendDraft(draft2020, { keywords: [propertyDependenciesKeyword] })] }).addRemoteSchema(foreign, dynamic ? {
        $dynamicAnchor: "node", type: "object", additionalProperties: { type: "number" }
    } : {
        type: "object",
        $defs: { leaf: { type: "string" } },
        additionalProperties: { $ref: "#/$defs/leaf" }
    });
}

function dynamicProperties() {
    return compileSchema({
        $id: outer, type: "object",
        $defs: { leaf: { $dynamicAnchor: "node", type: "string" } },
        $ref: "https://example.test/container", unevaluatedProperties: false
    }).addRemoteSchema("https://example.test/container", {
        type: "object", additionalProperties: { $dynamicRef: `${foreign}#node` }
    }).addRemoteSchema(foreign, { $dynamicAnchor: "node", type: "number" });
}

function recursiveItems() {
    return compileSchema({
        $schema: "https://json-schema.org/draft/2019-09/schema", $id: outer, $recursiveAnchor: true,
        type: "object", properties: { b: { $ref: foreign } }
    }).addRemoteSchema(foreign, {
        $schema: "https://json-schema.org/draft/2019-09/schema", $recursiveAnchor: true,
        type: "array", items: [], additionalItems: { $recursiveRef: "#" }
    });
}

// These inspections do not invoke a validator retained on a reduced node.
describe("bounded reduction inspection", () => {
    for (const [draft, anchor, reference, value] of [
        ["2019-09", "$recursiveAnchor", "$recursiveRef", "#"],
        ["2020-12", "$dynamicAnchor", "$dynamicRef", "#node"]
    ]) {
        it(`keeps an active ${reference} callback until reduction consumes it`, () => {
            const node = compileSchema({
                $schema: `https://json-schema.org/draft/${draft}/schema`,
                [anchor]: draft === "2019-09" ? true : "node",
                type: "object", properties: { child: { [reference]: value } }
            });
            const child = node.properties!.child;
            const merged = mergeNode(child, child)!;
            assert.ok(merged.validators.some((fn) => fn.toJSON?.() === "$ref"));
            assert.ok(merged.reducers.some((fn) => fn.toJSON?.() === "$ref"));
            const reduced = merged.reduceNode({}, { path: [{ pointer: "#", node }] }).node;
            assert.ok(reduced);
            assertRetiredReference(reduced);
            assert.equal(reduced.type, "object");
        });
    }

    it("retires both adjacent references after reducing their conjunction", () => {
        const node = compileSchema({
            $defs: { a: { type: "string", minLength: 1 }, b: { type: "string", maxLength: 3 } },
            $ref: "#/$defs/a", $dynamicRef: "#/$defs/b"
        });
        const reduced = node.reduceNode("ok").node;
        assert.ok(reduced);
        assertRetiredReference(reduced);
        assert.equal(reduced.type, "string");
    });

    it("isolates sibling dependency reduction scopes", () => {
        const node = compileSchema({
            $id: outer,
            dependencies: {
                a: { $id: "https://example.test/sibling", $defs: { override: {
                    $dynamicAnchor: "node", properties: { value: { type: "string" } }
                } } },
                b: { $dynamicRef: `${foreign}#node` }
            }
        }).addRemoteSchema(foreign, { $dynamicAnchor: "node", properties: { value: { type: "number" } } });
        const reduced = node.reduceNode({ a: true, b: true, value: 1 }).node;
        assert.ok(reduced);
        assert.equal(reduced.properties?.value.type, "number");
    });

    it("carries scope into additional-property selection", () => {
        const node = dynamicProperties();
        const child = node.getNodeChild("x", { x: "ok" }, { path: [{ pointer: "#", node }] }).node;
        assert.ok(child);
        assert.equal(child.type, "string");
    });

    it("carries recursive scope into additional-item selection", () => {
        const node = recursiveItems();
        const remote = node.context.remotes[foreign];
        const child = remote.getNodeChild(0, [{}], { path: [{ pointer: "#", node }] }).node;
        assert.ok(child);
        assert.equal(child.type, "object");
    });

    for (const draft of ["draft-04", "draft-06", "draft-07", "draft-2019-09", "draft-2020-12"]) {
        it(`retires consumed reference evaluators (${draft})`, () => {
            const node = compileSchema({
                $schema: draft, type: "object", definitions: { leaf: { type: "string" } },
                additionalProperties: { $ref: "#/definitions/leaf" }, unevaluatedProperties: false
            });
            const reference = node.additionalProperties!;
            // Older drafts resolve references before reduction rather than registering a reference reducer.
            const target = ["draft-04", "draft-06", "draft-07"].includes(draft) ? reference.resolveRef() : reference;
            const reduced = target.reduceNode("ok").node;
            assert.ok(reduced);
            assert.equal(reduced.type, "string");
            assertRetiredReference(reduced);
        });
    }
    for (const selection of Object.keys(selections)) {
        it(`carries dynamic scope through ${selection}`, () => {
            const node = fixture(selection, true);
            const path = [{ pointer: "#", node }];
            const reduced = node.reduceNode({ x: "ok" }, { path }).node;
            assert.ok(reduced);
            assert.equal(reduced.additionalProperties?.type, "string");
        });

        it(`retains foreign child context through ${selection} and repeated reduction`, () => {
            const node = fixture(selection, false);
            const reduced = node.reduceNode({ x: "ok" }).node;
            assert.ok(reduced);
            assert.equal(reduced.additionalProperties?.$id, foreign);
            const again = reduced.reduceNode({ x: "ok" }).node;
            assert.ok(again);
            assert.equal(again.additionalProperties?.$id, foreign);
            const target = again.additionalProperties!.resolveRef();
            assert.ok(isSchemaNode(target));
            assert.equal(target.type, "string");
        });
    }
});

describe("reduction validation controls", () => {
    for (const draft of ["draft-06", "draft-07"]) {
        it(`continues ignoring unsupported dynamic references (${draft})`, () => {
            const node = compileSchema({
                $schema: draft, definitions: { leaf: { type: "string" } },
                $ref: "#/definitions/leaf", $dynamicRef: "#missing"
            });
            const merged = mergeNode(node, node)!;
            assert.equal(merged.resolveRef().type, "string");
            assert.equal(merged.validate("ok").valid, true);
            assert.equal(merged.validate(1).valid, false);
        });
    }

    it("validates foreign-container additional properties with the outer dynamic scope", () => {
        const node = dynamicProperties();
        const child = node.getNode("#/x", { x: "ok" }).node;
        assert.ok(child);
        assert.equal(child.type, "string");
        assertRetiredReference(child);
        assert.equal(node.validate({ x: "ok" }).valid, true);
        assert.equal(node.validate({ x: 1 }).valid, false);
    });

    it("preserves recursive additional-item navigation", () => {
        const node = recursiveItems();
        const child = node.getNode("#/b/0", { b: [{}] }).node;
        assert.ok(child);
        assert.equal(child.type, "object");
        assertRetiredReference(child);
        assert.equal(node.validate({ b: [{}] }).valid, true);
        assert.equal(node.validate({ b: [1] }).valid, false);
    });

    it("validates referenced additional properties without a retired evaluator", () => {
        const node = compileSchema({
            type: "object", $defs: { leaf: { type: "string" } },
            additionalProperties: { $ref: "#/$defs/leaf" }, unevaluatedProperties: false
        });
        const reduced = node.additionalProperties!.reduceNode("ok").node;
        assert.ok(reduced);
        assertRetiredReference(reduced);
        assert.equal(node.validate({ x: "ok" }).valid, true);
        assert.equal(node.validate({ x: 1 }).valid, false);
        assert.equal(reduced.validate("ok").valid, true);
        assert.equal(reduced.validate(1).valid, false);
    });

    it("retains annotation callbacks after reducing a reference", () => {
        const node = compileSchema({ $defs: { leaf: { type: "string", deprecated: true } }, $ref: "#/$defs/leaf" });
        const reduced = node.reduceNode("ok").node;
        assert.ok(reduced);
        assertRetiredReference(reduced);
        const result = reduced.validate("ok");
        assert.equal(result.valid, true);
        assert.ok(result.annotations.some((annotation) => annotation.code === "deprecated-warning"));
    });

    for (const selection of Object.keys(selections)) {
        for (const dynamic of [false, true]) {
            it(`validates and navigates ${selection} with ${dynamic ? "dynamic" : "foreign"} references`, () => {
                const node = fixture(selection, dynamic);
                const contexts = [node.context, node.context.remotes[foreign].context];
                const snapshots = contexts.map((context) => ({
                    refs: { ...context.refs }, anchors: { ...context.anchors }, dynamicAnchors: { ...context.dynamicAnchors }
                }));
                const reduced = node.reduceNode({ x: "ok" }, { path: [{ pointer: "#", node }] }).node;
                assert.ok(reduced?.additionalProperties);
                const leaf = reduced.additionalProperties.reduceNode("ok").node;
                assert.ok(leaf);
                assertRetiredReference(leaf);
                assert.equal(leaf.type, "string");
                assert.equal(node.validate({ x: "ok" }).valid, true);
                assert.equal(node.validate({ x: 1 }).valid, false);
                assert.equal(node.getNode("#/x", { x: "ok" }).node?.type, "string");
                assert.equal(node.validate({ x: "ok" }).valid, true);
                contexts.forEach((context, index) => {
                    assert.deepEqual(context.refs, snapshots[index].refs);
                    assert.deepEqual(context.anchors, snapshots[index].anchors);
                    assert.deepEqual(context.dynamicAnchors, snapshots[index].dynamicAnchors);
                });
            });
        }
    }
});
