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

    // store this node for retrieval by $id
    if (node.context.refs[currentScope] == null) {
        node.context.refs[currentScope] = node;
    }

    // store this node for retrieval by scope + json-pointer
    node.context.refs[joinScope(currentScope, node.spointer)] = node;

    // @todo reevaluate and move to joinScope: if there is a nested $defs and this scope is new,
    // we need to make "#"-refs relative to this scope. In the following case we shift a pointer
    // #/properties/foo/$defs/inner to #/$defs/inner for an initial schema:
    // { $id: http://example.com/schema-relative-uri-defs2.json, $ref: "#/$defs/inner" }
    const localPointer = node.spointer.includes("/$defs/")
        ? `#/$defs/${node.spointer.split("/$defs/").pop()}`
        : node.spointer;
    // console.log(node.spointer, "=>", localPointer);
    node.context.refs[joinScope(currentScope, localPointer)] = node;

    // store this node for retrieval by scope + anchor
    if (node.schema.$anchor) {
        node.context.anchors[`${currentScope}#${node.schema.$anchor}`] = node;
    }

    // precompile reference
    if (node.schema.$ref) {
        node.ref = joinScope(currentScope, node.schema.$ref);
        // console.log("REF", currentScope, node.schema.$ref, "=>", node.ref);
    }
}

export function resolveRef() {
    const node = this as SchemaNode;
    // if (node.ref == null || node.schema == null || getTypeOf(node.schema) === "boolean") {
    if (node.ref == null) {
        return node;
    }
    const resolvedNode = getRef(node);
    // console.log("resolve ref", node.ref, "=>", node.context.refs[node.ref] != null, resolvedNode != null);
    if (resolvedNode == null) {
        // console.log("-- resolve: failed");
        return undefined;
    }
    // console.log("-- resolve: success");
    // @draft >= 2019-09 we now merge schemas: in draft <= 7 $ref is treated as reference, not as schema
    const nextSchema = mergeSchema(resolvedNode.schema, node.schema, "$ref", "definitions", "$defs");
    return resolvedNode.compileSchema(node.draft, nextSchema, node.spointer);
}

export default function getRef(node: SchemaNode, $ref = node.ref): SchemaNode | undefined {
    if ($ref == null) {
        // console.log("  getRef: return node");
        return node;
    }
    // console.log("  getRef:", $ref, Object.keys(node.context.refs));

    // resolve $ref by json-spointer
    if (node.context.refs[$ref]) {
        const final = getRef(node.context.refs[$ref]);
        console.log("getRef found $ref - reresolve", node.context.refs[$ref].ref, final != null);
        return final;
    }

    // check for remote-host + pointer pair to switch rootSchema
    const fragments = splitRef($ref);
    if (fragments.length === 0) {
        // console.log("  getRef: no frags");
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
        // console.log("  getRef: failed frag 1");
        return undefined;
    }

    if (fragments.length === 2) {
        // console.log("  getRef fragments:", fragments);
        const $remoteHostRef = fragments[0];
        // this is a reference to remote-host root node (and not a self reference)
        if (node.context.remotes[$remoteHostRef] && node !== node.context.remotes[$remoteHostRef]) {
            const nextRootNode = node.context.remotes[$remoteHostRef];
            // resolve full ref on remote schema - we store currently only store ref with domain
            return getRef(nextRootNode, $ref);
        }

        // console.log("find", $remoteHostRef, "in", node.context.remotes[$remoteHostRef]);

        // @previously: check if fragments[1] is within nextRootNode
        // @previously: check if $remoteHostRef is in current node-context
        // console.log("  getRef: failed frag 2");
        return undefined;
    }

    console.log("remotes", Object.keys(node.context.remotes));
    // console.log("could not find", $ref, node.schema, "in", Object.keys(node.context.refs));
}
