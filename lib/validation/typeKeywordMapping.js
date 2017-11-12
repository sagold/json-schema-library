/**
 * Mapping, used in type validation to iterate over type-specific keywords to validate
 * @type {Object}
 */
module.exports = {
    array: ["enum", "items", "minItems", "maxItems", "not", "uniqueItems", "allOf", "anyOf"],
    boolean: ["enum", "not", "oneOf", "allOf", "anyOf"], // eslint-disable-line quote-props
    // custom extension: 'format'-validation on object
    object: [
        "additionalProperties", "dependencies", "enum", "format", "minProperties", "maxProperties", "not",
        "patternProperties", "properties", "required", "oneOf", "allOf", "anyOf"
    ],
    string: ["enum", "format", "maxLength", "minLength", "not", "pattern", "oneOf", "allOf", "anyOf"],
    number: ["enum", "format", "maximum", "minimum", "multipleOf", "not", "oneOf", "allOf", "anyOf"],
    null: ["enum", "format", "not", "oneOf", "allOf", "anyOf"] // eslint-disable-line quote-props
};
