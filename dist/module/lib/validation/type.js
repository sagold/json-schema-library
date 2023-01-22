/**
 * @todo: type is also a keyword, as is properties, items, etc
 *
 * An instance has one of six primitive types (http://json-schema.org/latest/json-schema-draft.html#rfc.section.4.2)
 * or seven in case of ajv https://github.com/epoberezkin/ajv/blob/master/KEYWORDS.md#type
 * 1 null, 2 boolean, 3 object, 4 array, 5 number, 6 string (7 integer)
 */
const typeValidators = {
    array: (draft, schema, value, pointer) => draft.typeKeywords.array
        .filter((key) => schema && schema[key] != null)
        .map((key) => draft.validateKeyword[key](draft, schema, value, pointer)),
    object: (draft, schema, value, pointer) => draft.typeKeywords.object
        .filter((key) => schema && schema[key] != null)
        .map((key) => draft.validateKeyword[key](draft, schema, value, pointer)),
    string: (draft, schema, value, pointer) => draft.typeKeywords.string
        .filter((key) => schema && schema[key] != null)
        .map((key) => draft.validateKeyword[key](draft, schema, value, pointer)),
    integer: (draft, schema, value, pointer) => draft.typeKeywords.number
        .filter((key) => schema && schema[key] != null)
        .map((key) => draft.validateKeyword[key](draft, schema, value, pointer)),
    number: (draft, schema, value, pointer) => draft.typeKeywords.number
        .filter((key) => schema && schema[key] != null)
        .map((key) => draft.validateKeyword[key](draft, schema, value, pointer)),
    boolean: (draft, schema, value, pointer) => draft.typeKeywords.boolean
        .filter((key) => schema && schema[key] != null)
        .map((key) => draft.validateKeyword[key](draft, schema, value, pointer)),
    null: (draft, schema, value, pointer) => draft.typeKeywords.null
        .filter((key) => schema && schema[key] != null)
        .map((key) => draft.validateKeyword[key](draft, schema, value, pointer))
};
export default typeValidators;
