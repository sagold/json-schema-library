import { errorOrPromise } from "./utils/filter";
import flattenArray from "./utils/flattenArray";
import Core from "./cores/CoreInterface";
import { JSONSchema, JSONError, JSONPointer } from "./types";


/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param core - validator
 * @param data
 * @param schema - current json schema containing property oneOf
 * @param pointer - json pointer to data
 * @return oneOf schema or an error
 */
export default function resolveOneOf(core: Core, data: any, schema: JSONSchema = core.rootSchema, pointer: JSONPointer = "#"): JSONSchema|JSONError {
    const matches = [];
    const errors = [];
    for (let i = 0; i < schema.oneOf.length; i += 1) {
        const one = core.resolveRef(schema.oneOf[i]);

        let result = flattenArray(core.validate(data, one, pointer));
        result = result.filter(errorOrPromise);

        if (result.length > 0) {
            errors.push(...result);
        } else {
            matches.push(one);
        }
    }

    if (matches.length === 1) {
        return matches[0];
    }
    if (matches.length > 1) {
        return core.errors.multipleOneOfError({ value: data, pointer, matches });
    }

    return core.errors.oneOfError({ value: JSON.stringify(data), pointer, oneOf: schema.oneOf, errors });
}
