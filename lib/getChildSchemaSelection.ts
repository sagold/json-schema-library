import { Draft } from "./draft";
import { isJsonError, JsonError, JsonSchema } from "./types";
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
export default function getChildSchemaSelection(
    draft: Draft,
    property: string | number,
    schema: JsonSchema = draft.rootSchema
): JsonSchema[] | JsonError {
    if (schema.oneOf) {
        return schema.oneOf.map((item: JsonSchema) => draft.createNode(item).resolveRef().schema);
    }
    if (schema.items?.oneOf) {
        return schema.items.oneOf.map((item: JsonSchema) => draft.createNode(item).resolveRef().schema);
    }

    // array.items[] found
    if (Array.isArray(schema.items) && schema.items.length > +property) {
        return [draft.step(draft.createNode(schema), property, {}).schema];
    }

    // array.items[] exceeded (or undefined), but additionalItems specified
    if (schema.additionalItems && !isObject(schema.items)) {
        // we fallback to a string if no schema is defined - might be subject for configuration
        const additionalSchema: JsonSchema =
            schema.additionalItems === true ? { type: "string" } : schema.additionalItems;
        return [draft.createNode(additionalSchema).resolveRef().schema];
    }

    // array.items[] exceeded
    if (Array.isArray(schema.items) && schema.items.length <= +property) {
        return [];
    }

    const node = draft.step(draft.createNode(schema), property, {});
    if (isJsonError(node)) {
        const error: JsonError = node;
        return error;
    }

    return [node.schema];
}
