/**
 * @todo: type is also a keyword, as is properties, items, etc
 *
 * An instance has one of six primitive types (http://json-schema.org/latest/json-schema-core.html#rfc.section.4.2)
 * or seven in case of ajv https://github.com/epoberezkin/ajv/blob/master/KEYWORDS.md#type
 * 1 null, 2 boolean, 3 object, 4 array, 5 number, 6 string (7 integer)
 */
const typeValidators = {
    array: (core, schema, value, pointer) => core.typeKeywords.array
        .filter(key => schema && schema[key] != null)
        .map(key => core.validateKeyword[key](core, schema, value, pointer)),
    object: (core, schema, value, pointer) => core.typeKeywords.object
        .filter(key => schema && schema[key] != null)
        .map(key => core.validateKeyword[key](core, schema, value, pointer)),
    string: (core, schema, value, pointer) => core.typeKeywords.string
        .filter(key => schema && schema[key] != null)
        .map(key => core.validateKeyword[key](core, schema, value, pointer)),
    integer: (core, schema, value, pointer) => core.typeKeywords.number
        .filter(key => schema && schema[key] != null)
        .map(key => core.validateKeyword[key](core, schema, value, pointer)),
    number: (core, schema, value, pointer) => core.typeKeywords.number
        .filter(key => schema && schema[key] != null)
        .map(key => core.validateKeyword[key](core, schema, value, pointer)),
    "boolean": (core, schema, value, pointer) => core.typeKeywords.boolean
        .filter(key => schema && schema[key] != null)
        .map(key => core.validateKeyword[key](core, schema, value, pointer)),
    "null": (core, schema, value, pointer) => core.typeKeywords.null
        .filter(key => schema && schema[key] != null)
        .map(key => core.validateKeyword[key](core, schema, value, pointer))
};
export default typeValidators;
