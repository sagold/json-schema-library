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
    const result = draft.step(property, schema, {}, "#");
    if (isJsonError(result)) {
        if (result.code === "one-of-error") {
            return result.data.oneOf.map((item) => draft.resolveRef(item));
        }
        return result;
    }
    return [result];
}
