import { isJsonError } from "./types";
import { isObject } from "./utils/isObject";
/**
 * Returns a list of possible child-schemas for the given property key. In case of a oneOf selection, multiple schemas
 * could be added at the given property (e.g. item-index), thus an array of options is returned. In all other cases
 * a list with a single item will be returned
 *
 * @param draft       - draft to use
 * @param property    - parent schema of following property
 * @param [schema]    - parent schema of following property
 * @return
 */
export default function getChildSchemaSelection(draft, property, schema = draft.rootSchema) {
    var _a;
    if (schema.oneOf) {
        return schema.oneOf.map((item) => draft.createNode(item).resolveRef().schema);
    }
    if ((_a = schema.items) === null || _a === void 0 ? void 0 : _a.oneOf) {
        return schema.items.oneOf.map((item) => draft.createNode(item).resolveRef().schema);
    }
    // array.items[] found
    if (Array.isArray(schema.items) && schema.items.length > +property) {
        return [draft.step(draft.createNode(schema), property, {}).schema];
    }
    // array.items[] exceeded (or undefined), but additionalItems specified
    if (schema.additionalItems && !isObject(schema.items)) {
        // we fallback to a string if no schema is defined - might be subject for configuration
        const additionalSchema = schema.additionalItems === true ? { type: "string" } : schema.additionalItems;
        return [draft.createNode(additionalSchema).resolveRef().schema];
    }
    // array.items[] exceeded
    if (Array.isArray(schema.items) && schema.items.length <= +property) {
        return [];
    }
    const node = draft.step(draft.createNode(schema), property, {});
    if (isJsonError(node)) {
        const error = node;
        return error;
    }
    return [node.schema];
}
