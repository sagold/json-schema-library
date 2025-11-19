import { Keyword, JsonSchemaValidatorParams, ValidationPath } from "../../Keyword";
import { joinId } from "../../utils/joinId";
import splitRef from "../../utils/splitRef";
import { omit } from "../../utils/omit";
import { isObject } from "../../utils/isObject";
import { validateNode } from "../../validateNode";
import { SchemaNode } from "../../types";
import { get, split } from "@sagold/json-pointer";
import { reduceRef } from "../../keywords/$ref";

export const $refKeyword: Keyword = {
    id: "$ref",
    keyword: "$ref",
    parse: parseRef,
    addValidate: ({ schema }) => schema.$ref != null || schema.$recursiveRef != null,
    validate: validateRef,
    addReduce: ({ schema }) => schema.$ref != null || schema.$recursiveRef != null,
    reduce: reduceRef
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
    if (currentId !== node.parent?.$id && node.evaluationPath !== "#") {
        node.lastIdPointer = node.evaluationPath;
    }

    // store this node for retrieval by $id + json-pointer from $id
    if (node.lastIdPointer !== "#" && node.evaluationPath.startsWith(node.lastIdPointer)) {
        const localPointer = `#${node.evaluationPath.replace(node.lastIdPointer, "")}`;
        register(node, joinId(currentId, localPointer));
    }
    // store $rootId + json-pointer to this node
    register(node, joinId(node.context.rootNode.$id, node.evaluationPath));
    // store this node for retrieval by $id + anchor
    if (node.schema.$anchor) {
        node.context.anchors[`${currentId.replace(/#$/, "")}#${node.schema.$anchor}`] = node;
    }

    // precompile reference
    if (node.schema.$ref) {
        node.$ref = joinId(currentId, node.schema.$ref);
        if (node.$ref.startsWith("/")) {
            node.$ref = `#${node.$ref}`;
        }
    }
}

// export function reduceRef({ node, data, key, pointer, path }: JsonSchemaReducerParams) {
//     const resolvedNode = node.resolveRef({ pointer, path });
//     if (resolvedNode.schemaLocation === node.schemaLocation) {
//         return resolvedNode;
//     }
//     const result = resolvedNode.reduceNode(data, { key, pointer, path });
//     return result.node ?? result.error;
//     // const merged = mergeNode({ ...node, $ref: undefined, schema: { ...node.schema, $ref: undefined } }, resolvedNode);
//     // const { node: reducedNode, error } = merged.reduceNode(data, { key, pointer, path });
//     // return reducedNode ?? error;
// }

export function resolveRef({ pointer, path }: { pointer?: string; path?: ValidationPath } = {}) {
    const node = this as SchemaNode;
    if (node.schema.$recursiveRef) {
        const nextNode = resolveRecursiveRef(node, path ?? []);
        path?.push({ pointer, node: nextNode });
        return nextNode;
    }

    if (node.$ref == null) {
        return node;
    }

    const resolvedNode = getRef(node);
    if (resolvedNode != null) {
        path?.push({ pointer, node: resolvedNode });
    } else {
        // console.log("failed resolving", node.$ref, "from", Object.keys(node.context.refs));
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

    // RESTRICT BY CHANGE IN BASE-URL
    // go back in history until we have a domain definition and use this as start node to search for an anchor
    let startIndex = 0;
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].node.schema.$recursiveAnchor === false) {
            // $recursiveRef with $recursiveAnchor: false works like $ref
            const nextNode = getRef(node, joinId(node.$id, node.schema.$recursiveRef));
            return nextNode;
        }
        if (/^https?:\/\//.test(history[i].node.schema.$id ?? "") && history[i].node.schema.$recursiveAnchor !== true) {
            startIndex = i;
            break;
        }
    }

    // FROM THERE FIND FIRST OCCURENCE OF AN ANCHOR
    const firstAnchor = history.find((s, index) => index >= startIndex && s.node.schema.$recursiveAnchor === true);
    if (firstAnchor) {
        return firstAnchor.node;
    }

    // $recursiveRef with no $recursiveAnchor works like $ref?
    const nextNode = getRef(node, joinId(node.$id, node.schema.$recursiveRef));
    return nextNode;
}

function compileNext(referencedNode: SchemaNode, evaluationPath = referencedNode.evaluationPath) {
    const referencedSchema = isObject(referencedNode.schema)
        ? omit(referencedNode.schema, "$id")
        : referencedNode.schema;

    return referencedNode.compileSchema(referencedSchema, `${evaluationPath}/$ref`, referencedNode.schemaLocation);
}

export default function getRef(node: SchemaNode, $ref = node?.$ref): SchemaNode | undefined {
    if ($ref == null) {
        return node;
    }

    // resolve $ref by json-evaluationPath
    if (node.context.refs[$ref]) {
        return compileNext(node.context.refs[$ref], node.evaluationPath);
    }
    // resolve $ref from $anchor
    if (node.context.anchors[$ref]) {
        return compileNext(node.context.anchors[$ref], node.evaluationPath);
    }

    // check for remote-host + pointer pair to switch rootSchema
    const fragments = splitRef($ref);
    if (fragments.length === 0) {
        // console.error("REF: INVALID", $ref);
        return undefined;
    }

    // resolve $ref as remote-host
    if (fragments.length === 1) {
        const $ref = fragments[0];
        // this is a reference to remote-host root node
        if (node.context.remotes[$ref]) {
            return compileNext(node.context.remotes[$ref], node.evaluationPath);
        }
        if ($ref[0] === "#") {
            // @todo there is a bug joining multiple fragments to e.g. #/base#/examples/0
            // from "$id": "/base" +  $ref "#/examples/0" (in refOfUnknownKeyword spec)
            const ref = $ref.match(/#[^#]*$/)?.pop(); // sanitize pointer
            // support refOfUnknownKeyword
            const rootSchema = node.context.rootNode.schema;
            const targetSchema = get(rootSchema, ref);
            if (targetSchema) {
                return node.compileSchema(targetSchema, `${node.evaluationPath}/$ref`, ref);
            }
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
                const property = path[i] === "definitions" ? "$defs" : path[i];
                // @ts-expect-error random path
                currentNode = currentNode[property];
                if (currentNode == null) {
                    console.error("REF: FAILED RESOLVING ref json-pointer", fragments[1]);
                    return undefined;
                }
            }
            return currentNode;
        }

        // console.error("REF: UNFOUND 2", $ref);
        return undefined;
    }

    console.error("REF: UNHANDLED", $ref);
}
