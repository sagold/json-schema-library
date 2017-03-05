/**
 * Mapping, used in type validation to iterate over type-specific keywords to validate
 * @type {Object}
 */
module.exports = {
    array: ["enum", "minItems", "maxItems", "not"],
    boolean: ["enum", "not"], // eslint-disable-line quote-props
    object: ["additionalProperties", "enum", "minProperties", "maxProperties", "not"],
    string: ["enum", "format", "maxLength", "minLength", "not", "pattern"],
    number: ["enum", "format", "maximum", "minimum", "multipleOf", "not"]
};
