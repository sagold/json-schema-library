/* eslint max-len: 0 */

/**
 * Mapping, used in type validation to iterate over type-specific keywords to validate
 * @type {Object}
 */
module.exports = {
    array: ["enum", "items", "minItems", "maxItems", "not", "uniqueItems"],
    boolean: ["enum", "not"], // eslint-disable-line quote-props
    // custom extension: format validation on object
    object: ["additionalProperties", "enum", "format", "minProperties", "maxProperties", "not", "patternProperties", "properties", "required"],
    string: ["enum", "format", "maxLength", "minLength", "not", "pattern"],
    number: ["enum", "format", "maximum", "minimum", "multipleOf", "not"],
    "null": ["enum", "format", "not"]
};
