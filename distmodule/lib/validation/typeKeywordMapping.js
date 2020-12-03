/**
 * Mapping, used in type validation to iterate over type-specific keywords to validate
 *  - overview https://epoberezkin.github.io/ajv/keywords.html
 */
export default {
    array: ["enum", "items", "minItems", "maxItems", "uniqueItems", "not"],
    boolean: ["enum", "not"],
    object: [
        "additionalProperties", "dependencies", "enum", "format", "minProperties", "maxProperties",
        "patternProperties", "properties", "required", "not", "oneOf", "allOf", "anyOf"
    ],
    string: ["enum", "format", "maxLength", "minLength", "pattern", "not", "oneOf", "allOf", "anyOf"],
    number: ["enum", "format", "maximum", "minimum", "multipleOf", "not", "oneOf", "allOf", "anyOf"],
    null: ["enum", "format", "not", "oneOf", "allOf", "anyOf"]
};
