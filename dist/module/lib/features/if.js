/**
 * returns if-then-else as a json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns json schema defined by if-then-else or undefined
 */
export function resolveIfSchema(node, data) {
    if (node.schema.if == null) {
        return undefined;
    }
    if (node.schema.if === false) {
        return node.next(node.schema.else);
    }
    if (node.schema.if && (node.schema.then || node.schema.else)) {
        const ifNode = node.draft.resolveRef(node.next(node.schema.if));
        const ifErrors = node.draft.validate(ifNode, data);
        if (ifErrors.length === 0 && node.schema.then) {
            const thenNode = node.next(node.schema.then);
            return node.draft.resolveRef(thenNode);
        }
        if (ifErrors.length !== 0 && node.schema.else) {
            const elseNode = node.next(node.schema.else);
            return node.draft.resolveRef(elseNode);
        }
    }
}
/**
 * @returns validation result of it-then-else schema
 */
const validateIf = (node, value) => {
    const resolvedNode = resolveIfSchema(node, value);
    if (resolvedNode) {
        // @recursiveRef ok, we not just add per pointer, but any evlauation to dynamic scope / validation path
        return node.draft.validate(resolvedNode, value);
    }
};
export { validateIf };
