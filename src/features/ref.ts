import { SchemaNode } from "../types";
import { Feature, JsonSchemaValidatorParams, ValidationPath } from "../Feature";
import { joinId } from "../utils/joinId";
import splitRef from "../utils/splitRef";
import { omit } from "../utils/omit";
import { isObject } from "../utils/isObject";
import { validateNode } from "../validateNode";
import { split } from "@sagold/json-pointer";

export const refFeature: Feature = {
    id: "$ref",
    keyword: "$ref",
    parse: parseRef,
    addValidate: ({ schema }) => schema.$ref != null || schema.$dynamicRef != null,
    validate: validateRef
};

function register(node: SchemaNode, path: string) {
    if (node.context.refs[path] == null) {
        node.context.refs[path] = node;
    }
}

export function parseRef(node: SchemaNode) {
    // add ref resolution method to node
    node.resolveRef = resolveRef;

    // get and store current $id of node - this may be the same as parent $id
    const currentId = joinId(node.parent?.$id, node.schema?.$id);
    node.$id = currentId;
    node.lastIdPointer = node.parent?.lastIdPointer ?? "#";
    if (currentId !== node.parent?.$id && node.spointer !== "#") {
        node.lastIdPointer = node.spointer;
    }

    // store this node for retrieval by $id + json-pointer from $id
    if (node.lastIdPointer !== "#" && node.spointer.startsWith(node.lastIdPointer)) {
        const localPointer = `#${node.spointer.replace(node.lastIdPointer, "")}`;
        register(node, joinId(currentId, localPointer));
    }
    // store $rootId + json-pointer to this node
    register(node, joinId(node.context.rootNode.$id, node.spointer));

    // @draft-2020:  A $dynamicRef to a $dynamicAnchor in the same schema resource behaves like a normal $ref to an $anchor
    const anchor = node.schema.$anchor;
    if (anchor) {
        // store this node for retrieval by $id + anchor
        const anchorUrl = `${currentId.replace(/#$/, "")}#${anchor}`;
        if (node.context.anchors[anchorUrl] == null) {
            node.context.anchors[anchorUrl] = node;
        }
    }

    const dynamicAnchor = node.schema.$dynamicAnchor;
    if (dynamicAnchor) {
        // store this node for retrieval by $id + anchor
        const dynamicAnchorUrl = `${currentId.replace(/#$/, "")}#${dynamicAnchor}`;
        if (node.context.dynamicAnchors[dynamicAnchorUrl] == null) {
            node.context.dynamicAnchors[dynamicAnchorUrl] = node;
        }
    }

    // precompile reference
    if (node.schema.$ref) {
        node.ref = joinId(currentId, node.schema.$ref);
        if (node.ref.startsWith("/")) {
            node.ref = `#${node.ref}`;
        }
    }
}

export function resolveRef({ pointer, path }: { pointer?: string; path?: ValidationPath } = {}) {
    const node = this as SchemaNode;
    if (node.schema.$dynamicRef) {
        const nextNode = resolveRecursiveRef(node, path);
        // console.log("resolved node", node.schema.$dynamicRef, "=>", nextNode != null);
        path?.push({ pointer, node: nextNode });
        return nextNode;
    }

    if (node.ref == null) {
        return node;
    }

    const resolvedNode = getRef(node);
    if (resolvedNode != null) {
        path?.push({ pointer, node: resolvedNode });
    } else {
        // console.log("failed resolving", node.ref, "from", Object.keys(node.context.refs));
    }
    return resolvedNode;
}

function validateRef({ node, data, pointer = "#", path }: JsonSchemaValidatorParams) {
    const nextNode = node.resolveRef({ pointer, path });
    if (nextNode != null) {
        // recursively resolveRef and validate
        return validateNode(nextNode, data, pointer, path);
    }
}

// 1. https://json-schema.org/draft/2019-09/json-schema-core#scopes
function resolveRecursiveRef(node: SchemaNode, path: ValidationPath): SchemaNode {
    const history = path;
    const refInCurrentScope = joinId(node.$id, node.schema.$dynamicRef);
    // console.log("resolve $dynamicRef:", node.schema.$dynamicRef);
    // console.log(" -> scope:", joinId(node.$id, node.schema.$dynamicRef));
    // console.log("dynamicAnchors", Object.keys(node.context.dynamicAnchors));

    // A $dynamicRef with a non-matching $dynamicAnchor in the same schema resource behaves like a normal $ref to $anchor
    const nonMatchingDynamicAnchor = node.context.dynamicAnchors[refInCurrentScope] == null;
    if (nonMatchingDynamicAnchor) {
        if (node.context.anchors[refInCurrentScope]) {
            return compileNext(node.context.anchors[refInCurrentScope], node.spointer);
        }
    }

    for (let i = 0; i < history.length; i += 1) {
        // A $dynamicRef that initially resolves to a schema with a matching $dynamicAnchor resolves to the first $dynamicAnchor in the dynamic scope
        if (history[i].node.schema.$dynamicAnchor) {
            return compileNext(history[i].node, node.spointer);
        }

        // A $dynamicRef only stops at a $dynamicAnchor if it is in the same dynamic scope.
        const refWithoutScope = node.schema.$dynamicRef.split("#").pop();
        const ref = joinId(history[i].node.$id, `#${refWithoutScope}`);
        const anchorNode = node.context.dynamicAnchors[ref];
        if (anchorNode) {
            return compileNext(node.context.dynamicAnchors[ref], node.spointer);
        }
    }

    // A $dynamicRef without a matching $dynamicAnchor in the same schema resource behaves like a normal $ref to $anchor
    // console.log(" -> resolve as ref");
    const nextNode = getRef(node, refInCurrentScope);
    return nextNode;
}

function compileNext(referencedNode: SchemaNode, spointer = referencedNode.spointer) {
    const referencedSchema = isObject(referencedNode.schema)
        ? omit(referencedNode.schema, "$id")
        : referencedNode.schema;

    return referencedNode.compileSchema(referencedSchema, `${spointer}/$ref`, referencedNode.schemaId);
}

export default function getRef(node: SchemaNode, $ref = node?.ref): SchemaNode | undefined {
    if ($ref == null) {
        return node;
    }

    // resolve $ref by json-spointer
    if (node.context.refs[$ref]) {
        return compileNext(node.context.refs[$ref], node.spointer);
    }
    // resolve $ref from $anchor
    if (node.context.anchors[$ref]) {
        return compileNext(node.context.anchors[$ref], node.spointer);
    }
    // resolve $ref from $dynamicAnchor
    if (node.context.dynamicAnchors[$ref]) {
        // A $ref to a $dynamicAnchor in the same schema resource behaves like a normal $ref to an $anchor
        return compileNext(node.context.dynamicAnchors[$ref], node.spointer);
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
            return compileNext(node.context.remotes[$ref], node.spointer);
        }
        // console.error("REF: UNFOUND 1", $ref);
        return undefined;
    }

    if (fragments.length === 2) {
        const $remoteHostRef = fragments[0];
        // this is a reference to remote-host root node (and not a self reference)
        if (node.context.remotes[$remoteHostRef] && node !== node.context.remotes[$remoteHostRef]) {
            const referencedNode = node.context.remotes[$remoteHostRef];
            // resolve full ref on remote schema - we store currently only store ref with domain
            let nextNode = getRef(referencedNode, $ref);
            if (nextNode) {
                return nextNode;
            }
            // @note required for test spec 04
            nextNode = getRef(referencedNode, fragments[1]);
            if (nextNode) {
                return nextNode;
            }
        }

        // resolve by json-pointer (optional dynamicRef)
        if (node.context.refs[$remoteHostRef]) {
            const parentNode = node.context.refs[$remoteHostRef];
            const path = split(fragments[1]);
            // @todo add utility to resolve schema-pointer to schema
            let currentNode = parentNode;
            for (let i = 0; i < path.length; i += 1) {
                // @ts-expect-error random path
                currentNode = currentNode[path[i]];
                if (currentNode == null) {
                    console.error("REF: FAILED RESOLVING ref json-pointer", fragments[1]);
                    return undefined;
                }
            }
            return currentNode;
        }

        console.error("REF: UNFOUND 2", $ref);
        return undefined;
    }

    console.error("REF: UNHANDLED", $ref);
}
