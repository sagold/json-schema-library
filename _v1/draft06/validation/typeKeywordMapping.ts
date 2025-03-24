/**
 * Mapping, used in type validation to iterate over type-specific keywords to validate
 *  - overview https://epoberezkin.github.io/ajv/keywords.html
 */
export default {
    array: ["enum", "contains", "items", "minItems", "maxItems", "uniqueItems", "not", "if"],
    boolean: ["enum", "not"],
    object: [
        "additionalProperties", "dependencies", "enum", "format", "minProperties", "maxProperties",
        "patternProperties", "properties", "propertyNames", "required", "not", "oneOf", "allOf", "anyOf", "if"
    ],
    string: ["enum", "format", "maxLength", "minLength", "pattern", "not", "oneOf", "allOf", "anyOf", "if"],
    number: ["enum", "exclusiveMaximum", "exclusiveMinimum", "format", "maximum", "minimum", "multipleOf", "not", "oneOf", "allOf", "anyOf", "if"],
    null: ["enum", "format", "not", "oneOf", "allOf", "anyOf"]
};
