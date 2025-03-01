import { SchemaNode } from "../compiler/types";
// import { get } from "@sagold/json-pointer";
import joinScope from "./ref/joinScope";
// import getRef from "./ref/getRef";
import { mergeSchema } from "../../lib/mergeSchema";
import splitRef from "../../lib/compile/splitRef";
// import getTypeOf from "../../lib/getTypeOf";

export function parseRef(node: SchemaNode) {
    // get and store current scope of node - this may be the same as parent scope
    // if scope is not extended by current schema.$?id
    const currentScope = joinScope(node.parent?.scope, node.schema?.$id);
    node.scope = currentScope;

    // add ref resolution method to node
    node.resolveRef = resolveRef;

    // store this node for retrieval by json-pointer
    // node.context.refs[node.spointer] = node;

    // store this node for retrieval by scope + json-pointer
    node.context.refs[joinScope(currentScope, node.spointer)] = node;

    // precompile reference
    if (node.schema.$ref) {
        node.ref = joinScope(currentScope, node.schema.$ref);
    }
}

export function resolveRef() {
    const node = this as SchemaNode;
    // if (node.ref == null || node.schema == null || getTypeOf(node.schema) === "boolean") {
    if (node.ref == null) {
        return node;
    }
    const resolvedNode = getRef(node);
    if (resolvedNode == null) {
        return undefined;
    }
    // @draft >= 2019-09 we now merge schemas: in draft <= 7 $ref is treated as reference, not as schema
    const nextSchema = mergeSchema(resolvedNode.schema, node.schema, "$ref", "definitions", "$defs");
    return resolvedNode.compileSchema(node.draft, nextSchema, node.spointer);
}

export default function getRef(node: SchemaNode, $ref = node.ref): SchemaNode | undefined {
    if ($ref == null) {
        return node;
    }

    // resolve $ref by json-spointer
    if (node.context.refs[$ref]) {
        return getRef(node.context.refs[$ref]);
    }

    // check for remote-host + pointer pair to switch rootSchema
    const fragments = splitRef($ref);
    if (fragments.length === 0) {
        return undefined;
    }

    // resolve $ref as remote-host
    if (fragments.length === 1) {
        const $ref = fragments[0];
        // this is a reference to remote-host root node
        if (node.context.remotes[$ref]) {
            const nextRootNode = node.context.remotes[$ref];
            return getRef(nextRootNode);
        }
        // @previously: check if $ref in ids
        return undefined;
    }

    if (fragments.length === 2) {
        const $remoteHostRef = fragments[0];
        // this is a reference to remote-host root node (and not a self reference)
        if (node.context.remotes[$remoteHostRef] && node !== node.context.remotes[$remoteHostRef]) {
            const nextRootNode = node.context.remotes[$remoteHostRef];
            // resolve full ref on remote schema - we store currently only store ref with domain
            return getRef(nextRootNode, $ref);
        }
        // @previously: check if fragments[1] is within nextRootNode
        // @previously: check if $remoteHostRef is in current node-context
        return undefined;
    }

    // console.log("remotes", Object.keys(node.context.remotes));
    console.log("could not find", $ref, node.schema, "in", Object.keys(node.context.refs));
}
