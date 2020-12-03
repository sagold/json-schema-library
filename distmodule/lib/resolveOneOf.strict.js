import filter from "./utils/filter";
import flattenArray from "./utils/flattenArray";
/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param core - validator
 * @param data
 * @param schema - current json schema containing property oneOf
 * @param pointer - json pointer to data
 * @return oneOf schema or an error
 */
export default function resolveOneOf(core, data, schema = core.rootSchema, pointer = "#") {
    const matches = [];
    const errors = [];
    for (let i = 0; i < schema.oneOf.length; i += 1) {
        const one = core.resolveRef(schema.oneOf[i]);
        let result = flattenArray(core.validate(data, one, pointer));
        result = result.filter(filter.errorOrPromise);
        if (result.length > 0) {
            errors.push(...result);
        }
        else {
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
