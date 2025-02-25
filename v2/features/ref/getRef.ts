import { get } from "@sagold/json-pointer";
import splitRef from "../../../lib/compile/splitRef";
import { SchemaNode } from "../../compiler/types";

const suffixes = /(#)+$/g;

// @todo this should be rootschema based on compiled schema
// @todo context has to be shared across node-trees

// 1. combined is known
// 2. base or pointer is known
// 3. base + pointer is known
export default function getRef(node: SchemaNode, $ref = node.ref): SchemaNode | undefined {
    if ($ref == null) {
        return node;
    }

    const { context } = node;
    const rootSchema = context.rootSchema;

    // is it a known $ref?
    const $remote = $ref.replace(suffixes, "");
    if (context.remotes[$remote] != null) {
        const referencedNode = context.remotes[$remote];
        if (referencedNode?.ref) {
            // @todo add missing test for the following line
            return getRef(referencedNode);
        }
        return referencedNode;
    }

    const $anchor = context.anchors?.[$ref];
    if ($anchor) {
        // console.log("» anchor", $anchor);
        const referencedSchema = get(rootSchema, $anchor);
        if (referencedSchema == null) {
            return undefined;
        }
        return node.compileSchema(node.draft, referencedSchema, $anchor, node);
    }

    if (context.ids[$ref] != null) {
        const rootNode = node.compileSchema(node.draft, rootSchema, context.ids[$ref], node);
        const referencedSchema = get(rootSchema, context.ids[$ref]);
        const referencedNode = node.compileSchema(node.draft, referencedSchema, context.ids[$ref], node);
        if (referencedNode?.ref) {
            // @todo add missing test for the following line
            return getRef(rootNode, referencedNode.ref);
        }
        return referencedNode;
    }

    // is it a ref with host/pointer?
    const fragments = splitRef($ref);
    if (fragments.length === 0) {
        return node.compileSchema(node.draft, rootSchema, node.spointer, node);
    }

    if (fragments.length === 1) {
        $ref = fragments[0];
        if (context.remotes[$ref]) {
            const resolvedNode = context.remotes[$ref];
            const rootNode = node.compileSchema(node.draft, rootSchema, context.ids[$ref], node);
            if (resolvedNode?.ref) {
                return getRef(rootNode, resolvedNode.ref);
            }
        }

        if (context.ids[$ref]) {
            const rootNode = node.compileSchema(node.draft, rootSchema, context.ids[$ref], node);
            const referencedSchema = get(rootSchema, context.ids[$ref]);
            const referencedNode = node.compileSchema(node.draft, referencedSchema, context.ids[$ref], node);
            if (referencedNode?.ref) {
                return getRef(rootNode, referencedNode.ref);
            }
            return referencedNode;
        }

        // @todo why this special case
        // const rootContextRef = rootSchema.getContext?.().ids[$ref];
        // if (rootContextRef) {
        //     return getRef(context, rootSchema, rootContextRef);
        // }
    }

    if (fragments.length === 2) {
        const $inputRef = $ref;
        const base = fragments[0];
        $ref = fragments[1];

        // @todo this is unnecessary due to inconsistencies
        const fromRemoteNode = context.remotes[base] ?? context.remotes[`${base}/`];
        if (fromRemoteNode) {
            // console.log("» remote");
            // We have retrieved a different compiled json-schema. This compiled schema contains a
            // separate scope (context) where we might need to work with

            // ANCHOR
            if (fromRemoteNode.context && fromRemoteNode.context.anchors[$inputRef] != null) {
                // console.log("» remote » anchor");
                // an anchor is stored with its scope (id) it is defined in. Thus collisions are
                // avoided, but the current condition is required to resolve the anchor for now
                return getRef(fromRemoteNode, $inputRef);
            }

            // PATH (get_ref)
            if (fromRemoteNode) {
                // resolve the local part of the reference in the new schema
                return getRef(fromRemoteNode, $ref);
            }

            //log("warning: uncompiled remote - context may be wrong", base);
            return getRef(fromRemoteNode, $ref);
        }

        // @todo this is unnecessary due to inconsistencies
        const fromId = context.ids[base] ?? context.ids[`${base}/`];
        if (fromId) {
            const referencedSchema = get(rootSchema, fromId);
            const referencedNode = node.compileSchema(node.draft, referencedSchema, fromId, node);
            return getRef(referencedNode, $ref);
        }
    }

    const rootNode = node.compileSchema(node.draft, rootSchema, context.ids[$ref], node);
    const referencedSchema = get(rootSchema, context.ids[$ref] ?? $ref);
    const referencedNode = node.compileSchema(node.draft, referencedSchema, context.ids[$ref], node);
    if (referencedNode?.ref) {
        return getRef(rootNode, referencedNode.ref);
    }
    return referencedNode;
}
