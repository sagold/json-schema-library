import { joinId } from "../../utils/joinId";
import splitRef from "../../utils/splitRef";
import { omit } from "../../utils/omit";
import { isObject } from "../../utils/isObject";
import { validateNode } from "../../validateNode";
import { get } from "@sagold/json-pointer";
import { reduceRef } from "../../keywords/$ref";
export const $refKeyword = {
    id: "$ref",
    keyword: "$ref",
    parse: parseRef,
    addValidate: ({ schema }) => schema.$ref != null || schema.$recursiveRef != null,
    validate: validateRef,
    addReduce: ({ schema }) => schema.$ref != null || schema.$recursiveRef != null,
    reduce: reduceRef
};
function register(node, path) {
    if (node.context.refs[path] == null) {
        node.context.refs[path] = node;
    }
}
export function parseRef(node) {
    var _a, _b, _c, _d, _e;
    // add ref resolution method to node
    node.resolveRef = resolveRef;
    // get and store current $id of node - this may be the same as parent $id
    const currentId = joinId((_a = node.parent) === null || _a === void 0 ? void 0 : _a.$id, (_b = node.schema) === null || _b === void 0 ? void 0 : _b.$id);
    node.$id = currentId;
    node.lastIdPointer = (_d = (_c = node.parent) === null || _c === void 0 ? void 0 : _c.lastIdPointer) !== null && _d !== void 0 ? _d : "#";
    if (currentId !== ((_e = node.parent) === null || _e === void 0 ? void 0 : _e.$id) && node.evaluationPath !== "#") {
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
export function resolveRef({ pointer, path } = {}) {
    const node = this;
    if (node.schema.$recursiveRef) {
        const nextNode = resolveRecursiveRef(node, path);
        path === null || path === void 0 ? void 0 : path.push({ pointer, node: nextNode });
        return nextNode;
    }
    if (node.$ref == null) {
        return node;
    }
    const resolvedNode = getRef(node);
    if (resolvedNode != null) {
        path === null || path === void 0 ? void 0 : path.push({ pointer, node: resolvedNode });
    }
    else {
        // console.log("failed resolving", node.$ref, "from", Object.keys(node.context.refs));
    }
    return resolvedNode;
}
function validateRef({ node, data, pointer = "#", path }) {
    const nextNode = node.resolveRef({ pointer, path });
    if (nextNode != null) {
        // recursively resolveRef and validate
        return validateNode(nextNode, data, pointer, path);
    }
}
// 1. https://json-schema.org/draft/2019-09/json-schema-core#scopes
function resolveRecursiveRef(node, path) {
    var _a;
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
        if (/^https?:\/\//.test((_a = history[i].node.schema.$id) !== null && _a !== void 0 ? _a : "") && history[i].node.schema.$recursiveAnchor !== true) {
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
function compileNext(referencedNode, evaluationPath = referencedNode.evaluationPath) {
    const referencedSchema = isObject(referencedNode.schema)
        ? omit(referencedNode.schema, "$id")
        : referencedNode.schema;
    return referencedNode.compileSchema(referencedSchema, `${evaluationPath}/$ref`, referencedNode.schemaLocation);
}
export default function getRef(node, $ref = node === null || node === void 0 ? void 0 : node.$ref) {
    var _a;
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
            const ref = (_a = $ref.match(/#[^#]*$/)) === null || _a === void 0 ? void 0 : _a.pop(); // sanitize pointer
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
        // console.error("REF: UNFOUND 2", $ref);
        return undefined;
    }
    console.error("REF: UNHANDLED", $ref);
}
