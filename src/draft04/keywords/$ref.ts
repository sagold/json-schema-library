import { Keyword, ValidationPath } from "../../Keyword";
import { resolveUri } from "../../utils/resolveUri";
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
    validate: draft06Keyword.validate!
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
        currentId = resolveUri(node.parent?.$id, node.schema.id);
        // console.log("create id", node.evaluationPath, ":", node.parent?.$id, node.schema?.id, "=>", currentId);
    }
    node.$id = currentId as string;
    node.lastIdPointer = node.parent?.lastIdPointer ?? "#";

    // @ts-expect-error add ref resolution method to node
    node.resolveRef = resolveRef;

    // store this node for retrieval by id
    if (node.context.refs[currentId as string] == null) {
        node.context.refs[currentId as string] = node;
    }

    const idChanged = currentId !== node.parent?.$id;
    if (idChanged) {
        node.lastIdPointer = node.evaluationPath;
    }

    // store this node for retrieval by id + json-pointer from id
    if (node.lastIdPointer !== "#" && node.evaluationPath.startsWith(node.lastIdPointer)) {
        const localPointer = `#${node.evaluationPath.replace(node.lastIdPointer, "")}`;
        register(node, resolveUri(currentId, localPointer));
    } else {
        register(node, resolveUri(currentId, node.evaluationPath));
    }
    register(node, resolveUri(node.context.rootNode.$id, node.evaluationPath));

    // precompile reference
    if (node.schema.$ref) {
        node.$ref = resolveUri(currentId, node.schema.$ref);
    }
}

function resolveRef(this: SchemaNode, { pointer, path }: { pointer?: string; path?: ValidationPath } = {}) {
    if (this.$ref == null) {
        return this;
    }
    const resolvedNode = getRef(this);
    // console.log("RESOLVE REF", node.schema, "resolved ref", node.$ref, "=>", resolvedNode.schema);
    if (resolvedNode != null) {
        path?.push({ pointer: pointer!, node: resolvedNode });
        // console.log("resolve ref", node.$ref, "=>", resolvedNode.schema, Object.keys(node.context.refs));
    } else {
        console.log("failed resolving", this.$ref, "from", Object.keys(this.context.refs));
    }

    return resolvedNode;
}

function compileNext(referencedNode: SchemaNode, evaluationPath = referencedNode.evaluationPath) {
    const referencedSchema = isObject(referencedNode.schema)
        ? omit(referencedNode.schema, "id")
        : referencedNode.schema;
    return referencedNode.compileSchema(referencedSchema, `${evaluationPath}/$ref`, referencedSchema.schemaLocation);
}

function getRef(node: SchemaNode, $ref = node?.$ref): SchemaNode | undefined {
    if ($ref == null) {
        return node;
    }

    // resolve $ref by json-evaluationPath
    if (node.context.refs[$ref]) {
        // console.log(`ref resolve ${$ref} from refs`, node.context.refs[$ref].ref);
        return compileNext(node.context.refs[$ref], node.evaluationPath);
    }

    if (node.context.anchors[$ref]) {
        // console.log(`ref resolve ${$ref} from anchors`, node.context.anchors[$ref].ref);
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
            if (property && nextNode?.$defs) {
                return getRef(nextNode.$defs[property]);
            }
        }

        // console.error("REF: UNFOUND 2", $ref);
        return undefined;
    }

    console.error("REF: INVALID", $ref);
}
