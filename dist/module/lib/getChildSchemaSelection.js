import { isJsonError } from "./types";
/**
 * Returns a list of possible child-schemas for the given property key. In case of a oneOf selection, multiple schemas
 * could be added at the given property (e.g. item-index), thus an array of options is returned. In all other cases
 * a list with a single item will be returned
 *
 * @param draft        - draft to use
 * @param property    - parent schema of following property
 * @param [schema]    - parent schema of following property
 * @return
 */
export default function getChildSchemaSelection(draft, property, schema = draft.rootSchema) {
    var _a;
    if (schema.oneOf) {
        return schema.oneOf.map((item) => draft.resolveRef(item));
    }
    if ((_a = schema.items) === null || _a === void 0 ? void 0 : _a.oneOf) {
        return schema.items.oneOf.map((item) => draft.resolveRef(item));
    }
    const result = draft.step(property, schema, {}, "#");
    if (isJsonError(result)) {
        return result;
    }
    return [result];
}
