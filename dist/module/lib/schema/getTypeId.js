import types from "./types";
import { isObject } from "../utils/isObject";
const typeKeywords = Object.keys(types).filter((id) => types[id].type === false);
const hasOwnProperty = Object.prototype.hasOwnProperty;
/**
 * @throws Error    on multiple matches (invalid schema)
 *
 * Returns the type id of a schema object
 * @param schema
 * @return type id, if found
 */
export default function getTypeId(schema) {
    if (isObject(schema) === false) {
        return undefined;
    }
    if (schema.enum) {
        return "enum";
    }
    const type = schema.type;
    if (Array.isArray(type) || types[type]) {
        return type;
    }
    const ids = typeKeywords.filter((type) => schema[type]);
    if (ids.length === 1) {
        return ids[0];
    }
    if (ids.length === 0) {
        // @expensive, guess type object
        for (let i = 0, l = types.object.keywords.length; i < l; i += 1) {
            const keyword = types.object.keywords[i];
            if (hasOwnProperty.call(schema, keyword)) {
                // eslint-disable-line
                return "object";
            }
        }
        // @expensive, guess type array
        for (let i = 0, l = types.array.keywords.length; i < l; i += 1) {
            const keyword = types.array.keywords[i];
            if (hasOwnProperty.call(schema, keyword)) {
                // eslint-disable-line
                return "array";
            }
        }
        return undefined;
    }
    throw new Error(`Mutiple typeIds [${ids.join(", ")}] matched in ${JSON.stringify(schema)}`);
}
