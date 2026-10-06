import { Keyword, JsonSchemaValidatorParams, ValidationPath } from "../../Keyword";
import { resolveStaticRef as resolveRef } from "../../keywords/$ref";
import { isSchemaNode, SchemaNode } from "../../types";
import { resolveUri } from "../../utils/resolveUri";
import { validateNode } from "../../validateNode";

export const $refKeyword: Keyword = {
    id: "$ref",
    keyword: "$ref",
    parse: parseRef,
    addValidate: ({ schema }) => schema.$ref != null,
    validate: validateRef
};

function parseRef(node: SchemaNode) {
    // get and store current $id of node - this may be the same as parent $id
    let currentId = node.parent?.$id ?? node.$id;
    if (node.schema?.$ref == null) {
        currentId = resolveUri(currentId, node.schema?.$id);
    }
    node.$id = currentId as string;
    node.lastIdPointer = node.parent?.lastIdPointer ?? "#";

    // @ts-expect-error add ref resolution method to node
    node.resolveRef = resolveRef;

    // store this node for retrieval by $id
    if (!node.dynamicId && node.context.refs[currentId as string] == null) {
        node.context.refs[currentId as string] = node;
    }

    const idChanged = currentId !== node.parent?.$id;
    if (idChanged) {
        node.lastIdPointer = node.evaluationPath;
    }

    // Data-dependent reductions must not replace authored reference targets.
    if (!node.dynamicId) {
        // store this node for retrieval by $id + json-pointer from $id
        if (node.lastIdPointer !== "#" && node.evaluationPath.startsWith(node.lastIdPointer)) {
            const localPointer = `#${node.evaluationPath.replace(node.lastIdPointer, "")}`;
            node.context.refs[resolveUri(currentId, localPointer)] = node;
        } else {
            node.context.refs[resolveUri(currentId, node.evaluationPath)] = node;
        }
        node.context.refs[resolveUri(node.context.rootNode.$id, node.evaluationPath)] = node;
    }

    // precompile reference
    if (node.schema.$ref != null) {
        node.$ref = resolveUri(currentId, node.schema.$ref);
    }
}

function validateRef({ node, data, pointer = "#", path }: JsonSchemaValidatorParams) {
    const nextNode = resolveAllRefs(node, pointer, path);
    if (!isSchemaNode(nextNode)) {
        return node.createError("ref-error", {
            ref: node.schema.$ref,
            pointer,
            schema: node.schema,
            value: data
        });
    }
    return validateNode(nextNode, data, pointer, path);
}

function resolveAllRefs(node: SchemaNode, pointer: string, path: ValidationPath) {
    const nextNode = node.resolveRef({ pointer, path });
    if (!isSchemaNode(nextNode)) {
        return node.createError("ref-error", {
            ref: node.schema.$ref,
            pointer,
            schema: node.schema,
            value: undefined
        });
    }
    if (nextNode !== node && nextNode) {
        return resolveAllRefs(nextNode, pointer, path);
    }
    return node;
}
