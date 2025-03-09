import { SchemaNode, ValidationPath } from "../compiler/types";
import { joinId } from "./ref/joinId";
import splitRef from "../../lib/compile/splitRef";
import { omit } from "../../lib/utils/omit";
import { isObject } from "../../lib/utils/isObject";

export function parseRef(node: SchemaNode) {
    // get and store current $id of node - this may be the same as parent $id
    // if $id is not extended by current schema.$?id
    const currentId = joinId(node.parent?.$id, node.schema?.$id);
    node.$id = currentId;

    // add ref resolution method to node
    node.resolveRef = resolveRef;

    // store this node for retrieval by $id
    if (node.context.refs[currentId] == null) {
        node.context.refs[currentId] = node;
    }

    // store this node for retrieval by $id + json-pointer
    node.context.refs[joinId(currentId, node.spointer)] = node;

    // @todo reevaluate and move to joinId: if there is a nested $defs and this $id is new,
    // we need to make "#"-refs relative to this $id. In the following case we shift a pointer
    // #/properties/foo/$defs/inner to #/$defs/inner for an initial schema:
    // { $id: http://example.com/schema-relative-uri-defs2.json, $ref: "#/$defs/inner" }
    const localPointer = node.spointer.includes("/$defs/")
        ? `#/$defs/${node.spointer.split("/$defs/").pop()}`
        : node.spointer;
    node.context.refs[joinId(currentId, localPointer)] = node;

    // store this node for retrieval by $id + anchor
    if (node.schema.$anchor) {
        node.context.anchors[`${currentId.replace(/#$/, "")}#${node.schema.$anchor}`] = node;
    }

    // precompile reference
    if (node.schema.$ref) {
        node.ref = joinId(currentId, node.schema.$ref);
    }
}

// 1. https://json-schema.org/draft/2019-09/json-schema-core#scopes
function resolveRecursiveRef(node: SchemaNode, path: ValidationPath): SchemaNode {
    const history = path;

    // RESTRICT BY CHANGE IN BASE-URL
    // go back in history until we have a domain definition and use this as start node
    // to search for an anchor
    let startIndex = 0;
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].node.schema.$recursiveAnchor === false) {
            // $recursiveRef with $recursiveAnchor: false works like $ref
            const nextNode = getRef(node, joinId(node.$id, node.schema.$recursiveRef));
            console.log("recursive ref resolution", nextNode.schema);
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
        console.log("recursive resolved to", firstAnchor.node.schema);
        return firstAnchor.node;
    }

    // $recursiveRef with no $recursiveAnchor works like $ref?
    const nextNode = getRef(node, joinId(node.$id, node.schema.$recursiveRef));
    console.log("recursive ref failed from", node?.schema, "to", nextNode.schema);
    console.log(JSON.stringify(path, null, 2));
    return nextNode;
}

export function resolveRef({ pointer, path }: { pointer?: string; path?: ValidationPath } = {}) {
    const node = this as SchemaNode;
    // console.log("resolve", node.ref, node.schema.$recursiveRef, node.schema);
    if (node.schema.$recursiveRef) {
        const nextNode = resolveRecursiveRef(node, path);
        path?.push({
            pointer,
            node: nextNode
        });
        return nextNode;
    }
    if (node.ref == null) {
        return node;
    }
    const resolvedNode = getRef(node);
    if (resolvedNode == null) {
        return undefined;
    }

    path?.push({
        pointer,
        node: resolvedNode
    });

    // @ts-expect-error bool schema
    if (resolvedNode.schema === false || resolvedNode.schema === true) {
        return resolvedNode;
    }

    // @draft >= 2019-09
    // we now merge schemas: in draft <= 7 $ref is treated as reference, not as schema
    // https://json-schema.org/draft/2019-09/release-notes:
    // > "Other keywords are now allowed alongside of it"
    // https://json-schema.org/draft/2019-09/json-schema-core#rfc.section.8.2.4:
    // > "Its [$ref] results are the results of the referenced schema."

    // @important @todo we need to remove any $id here to prevent readding this $id to next $id
    // @todo replace this merge by recursively validating $ref
    // const nextSchema = mergeSchema(node.schema, resolvedNode.schema, "$ref", "definitions", "$defs", "$id");
    // const nextNode = resolvedNode.compileSchema(nextSchema, resolvedNode.spointer);
    // const nextSchema = omit(resolvedNode.schema, "$ref", "definitions", "$defs", "$id");
    // const nextNode = resolvedNode.compileSchema(nextSchema, resolvedNode.spointer);

    return resolvedNode;
}

function compileNext(referencedNode: SchemaNode) {
    const referencedSchema = isObject(referencedNode.schema)
        ? omit(referencedNode.schema, "$id")
        : referencedNode.schema;
    return referencedNode.compileSchema(referencedSchema, `${referencedNode.spointer}/$ref`);
}

export default function getRef(node: SchemaNode, $ref = node?.ref): SchemaNode | undefined {
    if ($ref == null) {
        return node;
    }

    // resolve $ref by json-spointer
    if (node.context.refs[$ref]) {
        return compileNext(node.context.refs[$ref]);
    }

    if (node.context.anchors[$ref]) {
        return compileNext(node.context.anchors[$ref]);
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
            return compileNext(node.context.remotes[$ref]);
        }
        console.error("REF: UNFOUND", $ref);
        return undefined;
    }

    if (fragments.length === 2) {
        const $remoteHostRef = fragments[0];
        // this is a reference to remote-host root node (and not a self reference)
        if (node.context.remotes[$remoteHostRef] && node !== node.context.remotes[$remoteHostRef]) {
            const referencedNode = node.context.remotes[$remoteHostRef];
            // resolve full ref on remote schema - we store currently only store ref with domain
            const nextNode = getRef(referencedNode, $ref);
            if (nextNode) {
                return nextNode;
            }
        }

        // @todo this is a poc
        // @previously: check if $remoteHostRef is in current node-context
        const $localRef = fragments[0];
        if (node.context.refs[$localRef]) {
            const nextNode = node.context.refs[$localRef];
            const property = fragments[1].split("$defs/").pop();
            return getRef(nextNode?.$defs?.[property]);
        }

        return undefined;
    }
}
