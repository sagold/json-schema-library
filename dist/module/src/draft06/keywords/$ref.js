import { resolveRef } from "../../keywords/$ref.js";
import { joinId } from "../../utils/joinId.js";
import { validateNode } from "../../validateNode.js";
export const $refKeyword = {
    id: "$ref",
    keyword: "$ref",
    parse: parseRef,
    addValidate: ({ schema }) => schema.$ref != null,
    validate: validateRef
};
function parseRef(node) {
    var _a, _b, _c, _d, _e, _f, _g;
    // get and store current $id of node - this may be the same as parent $id
    let currentId = (_a = node.parent) === null || _a === void 0 ? void 0 : _a.$id;
    if (((_b = node.schema) === null || _b === void 0 ? void 0 : _b.$ref) == null) {
        currentId = joinId((_c = node.parent) === null || _c === void 0 ? void 0 : _c.$id, (_d = node.schema) === null || _d === void 0 ? void 0 : _d.$id);
    }
    node.$id = currentId;
    node.lastIdPointer = (_f = (_e = node.parent) === null || _e === void 0 ? void 0 : _e.lastIdPointer) !== null && _f !== void 0 ? _f : "#";
    // add ref resolution method to node
    node.resolveRef = resolveRef;
    // store this node for retrieval by $id
    if (node.context.refs[currentId] == null) {
        node.context.refs[currentId] = node;
    }
    const idChanged = currentId !== ((_g = node.parent) === null || _g === void 0 ? void 0 : _g.$id);
    if (idChanged) {
        node.lastIdPointer = node.evaluationPath;
    }
    // store this node for retrieval by $id + json-pointer from $id
    if (node.lastIdPointer !== "#" && node.evaluationPath.startsWith(node.lastIdPointer)) {
        const localPointer = `#${node.evaluationPath.replace(node.lastIdPointer, "")}`;
        node.context.refs[joinId(currentId, localPointer)] = node;
    }
    else {
        node.context.refs[joinId(currentId, node.evaluationPath)] = node;
    }
    node.context.refs[joinId(node.context.rootNode.$id, node.evaluationPath)] = node;
    // precompile reference
    if (node.schema.$ref) {
        node.$ref = joinId(currentId, node.schema.$ref);
    }
}
function validateRef({ node, data, pointer = "#", path }) {
    const nextNode = resolveAllRefs(node, pointer, path);
    if (nextNode == null) {
        return undefined;
    }
    return validateNode(nextNode, data, pointer, path);
}
function resolveAllRefs(node, pointer, path) {
    const nextNode = node.resolveRef({ pointer, path });
    if (nextNode == null) {
        return undefined;
    }
    if (nextNode !== node && nextNode) {
        return resolveAllRefs(nextNode, pointer, path);
    }
    return node;
}
