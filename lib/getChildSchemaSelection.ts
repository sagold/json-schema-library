/**
 * Returns a list of possible child-schemas for the given property key. In case of a oneOf selection, multiple schemas
 * could be added at the given property (e.g. item-index), thus an array of options is returned. In all other cases
 * a list with a single item will be returned
 *
 * @param  {Core} core          - core to use
 * @param  {String} property    - parent schema of following property
 * @param  {Object} [schema]    - parent schema of following property
 * @return {Object}
 */
export default function getChildSchemaSelection(core, property, schema = core.rootSchema) {
    const result = core.step(property, schema, {}, "#");

    if (result.type === "error") {
        if (result.code === "one-of-error") {
            return result.data.oneOf.map(item => core.resolveRef(item));
        }
        return result;
    }

    return [result];
}
