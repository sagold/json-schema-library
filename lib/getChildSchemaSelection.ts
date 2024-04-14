import { Draft } from "./draft";
import { isJsonError, JsonError, JsonSchema } from "./types";

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
    const node = draft.step(draft.createNode(schema), property, {});
    if (isJsonError(node)) {
        return node;
    }

    return [node.schema];
}
