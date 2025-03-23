import { Feature, JsonSchemaValidatorParams, SchemaNode, ValidationPath } from "../../types";
import { resolveRef } from "../ref";
import { joinId } from "../../utils/joinId";

export const refFeature: Feature = {
    id: "$ref",
    keyword: "$ref",
    parse: parseRef,
    addValidate: ({ schema }) => schema.$ref != null,
    validate: validateRef
};

export function parseRef(node: SchemaNode) {
    // get and store current $id of node - this may be the same as parent $id
    let currentId = node.parent?.$id;
    if (node.schema?.$ref == null) {
        currentId = joinId(node.parent?.$id, node.schema?.$id);
    }
    node.$id = currentId;
    node.lastIdPointer = node.parent?.lastIdPointer ?? "#";

    // add ref resolution method to node
    node.resolveRef = resolveRef;

    // store this node for retrieval by $id
    if (node.context.refs[currentId] == null) {
        node.context.refs[currentId] = node;
    }

    const idChanged = currentId !== node.parent?.$id;
    if (idChanged) {
        node.lastIdPointer = node.spointer;
    }

    // store this node for retrieval by $id + json-pointer from $id
    if (node.lastIdPointer !== "#" && node.spointer.startsWith(node.lastIdPointer)) {
        const localPointer = `#${node.spointer.replace(node.lastIdPointer, "")}`;
        node.context.refs[joinId(currentId, localPointer)] = node;
    } else {
        node.context.refs[joinId(currentId, node.spointer)] = node;
    }
    node.context.refs[joinId(node.context.rootNode.$id, node.spointer)] = node;

    // precompile reference
    if (node.schema.$ref) {
        node.ref = joinId(currentId, node.schema.$ref);
    }
}

export function refValidator(node: SchemaNode) {
    if (refFeature.addValidate(node)) {
        node.validators.push(refFeature.validate);
    }
}

export function validateRef({ node, data, pointer = "#", path }: JsonSchemaValidatorParams) {
    const nextNode = resolveAllRefs(node, pointer, path);
    if (nextNode == null) {
        return undefined;
    }
    return nextNode.validate(data, pointer, path);
}

function resolveAllRefs(node: SchemaNode, pointer: string, path: ValidationPath) {
    const nextNode = node.resolveRef({ pointer, path });
    if (nextNode == null) {
        return undefined;
    }
    if (nextNode !== node && nextNode) {
        return resolveAllRefs(nextNode, pointer, path);
    }
    return node;
}
