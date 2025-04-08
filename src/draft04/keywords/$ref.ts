import { Keyword, ValidationPath } from "../../Keyword";
import { joinId } from "../../utils/joinId";
import { isObject } from "../../utils/isObject";
import { omit } from "../../utils/omit";
import splitRef from "../../utils/splitRef";
import { $refKeyword as draft06Keyword } from "../../draft06/keywords/$ref";
import { SchemaNode } from "../../types";

export const $refKeyword: Keyword = {
    id: "$ref",
    keyword: "$ref",
    parse: parseRef,
    addValidate: ({ schema }) => schema.$ref != null,
    validate: draft06Keyword.validate
};

function register(node: SchemaNode, path: string) {
    if (node.context.refs[path] == null) {
        node.context.refs[path] = node;
    }
}

function parseRef(node: SchemaNode) {
    // get and store current id of node - this may be the same as parent id
    let currentId = node.parent?.$id;
    if (node.schema?.$ref == null && node.schema?.id) {
        currentId = joinId(node.parent?.$id, node.schema.id);
        // console.log("create id", node.spointer, ":", node.parent?.$id, node.schema?.id, "=>", currentId);
    }
    node.$id = currentId;
    node.lastIdPointer = node.parent?.lastIdPointer ?? "#";

    // add ref resolution method to node
    node.resolveRef = resolveRef;

    // store this node for retrieval by id
    if (node.context.refs[currentId] == null) {
        node.context.refs[currentId] = node;
    }

    const idChanged = currentId !== node.parent?.$id;
    if (idChanged) {
        node.lastIdPointer = node.spointer;
    }

    // store this node for retrieval by id + json-pointer from id
    if (node.lastIdPointer !== "#" && node.spointer.startsWith(node.lastIdPointer)) {
        const localPointer = `#${node.spointer.replace(node.lastIdPointer, "")}`;
        register(node, joinId(currentId, localPointer));
    } else {
        register(node, joinId(currentId, node.spointer));
    }
    register(node, joinId(node.context.rootNode.$id, node.spointer));

    // precompile reference
    if (node.schema.$ref) {
        node.$ref = joinId(currentId, node.schema.$ref);
    }
}

function resolveRef({ pointer, path }: { pointer?: string; path?: ValidationPath } = {}) {
    // throw new Error("resolving ref");
    const node = this as SchemaNode;
    if (node.$ref == null) {
        return node;
    }
    const resolvedNode = getRef(node);
    // console.log("RESOLVE REF", node.schema, "resolved ref", node.$ref, "=>", resolvedNode.schema);
    if (resolvedNode != null) {
        path?.push({ pointer, node: resolvedNode });
        // console.log("resolve ref", node.$ref, "=>", resolvedNode.schema, Object.keys(node.context.refs));
    } else {
        console.log("failed resolving", node.$ref, "from", Object.keys(node.context.refs));
    }

    return resolvedNode;
}

function compileNext(referencedNode: SchemaNode, spointer = referencedNode.spointer) {
    const referencedSchema = isObject(referencedNode.schema)
        ? omit(referencedNode.schema, "id")
        : referencedNode.schema;
    return referencedNode.compileSchema(referencedSchema, `${spointer}/$ref`, referencedSchema.schemaId);
}

function getRef(node: SchemaNode, $ref = node?.$ref): SchemaNode | undefined {
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
        // console.error("REF: INVALID", $ref);
        return undefined;
    }

    // resolve $ref as remote-host
    if (fragments.length === 1) {
        const $ref = fragments[0];
        // this is a reference to remote-host root node
        if (node.context.remotes[$ref]) {
            return compileNext(node.context.remotes[$ref], node.spointer);
        }
        // console.error("REF: UNFOUND 1", $ref, Object.keys(node.context.remotes));
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

        // @todo this is a poc
        const $localRef = fragments[0];
        if (node.context.refs[$localRef]) {
            const nextNode = node.context.refs[$localRef];
            const property = fragments[1].split("$defs/").pop();
            return getRef(nextNode?.$defs?.[property]);
        }

        // console.error("REF: UNFOUND 2", $ref);
        return undefined;
    }
    console.error("REF: UNHANDLED", $ref);
}
