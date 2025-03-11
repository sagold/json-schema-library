import { SchemaNode, ValidationPath } from "../types";
import { joinId } from "../utils/joinId";
import splitRef from "../../lib/compile/splitRef";
import { omit } from "../../lib/utils/omit";
import { isObject } from "../../lib/utils/isObject";

export function parseRef(node: SchemaNode) {
    // get and store current $id of node - this may be the same as parent $id
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

export function refValidator({ schema, validators }: SchemaNode) {
    if (schema.$ref == null && schema.$recursiveRef == null) {
        return;
    }
    validators.push(({ node, data, pointer = "#", path }) => {
        const nextNode = node.resolveRef({ pointer, path });
        if (nextNode == null) {
            // @todo evaluate this state - should return node or ref is invalid (or bugged)
            return undefined;
        }
        // recursively resolveRef and validate
        return nextNode.validate(data, pointer, path);
    });
}

export function resolveRef({ pointer, path }: { pointer?: string; path?: ValidationPath } = {}) {
    const node = this as SchemaNode;
    if (node.schema.$recursiveRef) {
        const nextNode = resolveRecursiveRef(node, path);
        path?.push({ pointer, node: nextNode });
        return nextNode;
    }
    if (node.ref == null) {
        return node;
    }
    const resolvedNode = getRef(node);
    // console.log("RESOLVE REF", node.schema, "resolved ref", node.ref, "=>", resolvedNode.schema);
    if (resolvedNode != null) {
        path?.push({ pointer, node: resolvedNode });
    }
    return resolvedNode;
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

function compileNext(referencedNode: SchemaNode, spointer = referencedNode.spointer) {
    const referencedSchema = isObject(referencedNode.schema)
        ? omit(referencedNode.schema, "$id")
        : referencedNode.schema;
    return referencedNode.compileSchema(referencedSchema, `${spointer}/$ref`);
}

export default function getRef(node: SchemaNode, $ref = node?.ref): SchemaNode | undefined {
    if ($ref == null) {
        return node;
    }

    // resolve $ref by json-spointer
    if (node.context.refs[$ref]) {
        // console.log(`ref resolve ${$ref} from refs`, node.context.refs[$ref].ref);
        return compileNext(node.context.refs[$ref], node.spointer);
    }

    if (node.context.anchors[$ref]) {
        // console.log(`ref resolve ${$ref} from anchors`, node.context.anchors[$ref].ref);
        return compileNext(node.context.anchors[$ref], node.spointer);
    }

    // check for remote-host + pointer pair to switch rootSchema
    const fragments = splitRef($ref);
    if (fragments.length === 0) {
        console.error("REF: INVALID", $ref);
        return undefined;
    }

    // resolve $ref as remote-host
    if (fragments.length === 1) {
        const $ref = fragments[0];
        // this is a reference to remote-host root node
        if (node.context.remotes[$ref]) {
            return compileNext(node.context.remotes[$ref], node.spointer);
        }
        console.error("REF: UNFOUND 1", $ref);
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
        const $localRef = fragments[0];
        if (node.context.refs[$localRef]) {
            const nextNode = node.context.refs[$localRef];
            const property = fragments[1].split("$defs/").pop();
            return getRef(nextNode?.$defs?.[property]);
        }

        console.error("REF: UNFOUND 2", $ref);
        return undefined;
    }

    console.error("REF: UNHANDLED", $ref);
}
